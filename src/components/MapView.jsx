import { useEffect, useMemo, useRef, useState } from 'react'
import { Map, Marker, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps'
import { categoryOf } from '../lib/categories.js'
import { placePhoto, placeParticipants } from '../lib/places.js'
import { catIconSrc, faceRoundSrc } from '../lib/asset.js'
import { usePlaces } from '../store/PlacesContext.jsx'

const SEOUL = { lat: 37.5665, lng: 126.978 }

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = src
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// 참여자 → 얼굴 이미지 키 (1명=본인 아바타 / 2명 이상=커플)
function faceKeyFor(place, resolveMember) {
  const ids = placeParticipants(place)
  if (ids.length >= 2) return 'couple'
  if (ids.length === 1) return resolveMember(ids[0]).avatar || null
  return null
}

// 마커 = (사진 또는 카테고리 아이콘) 상자 + 위에 얼굴 아바타
async function buildMarkerIcon(place, resolveMember) {
  const color = categoryOf(place.category).color
  const photo = placePhoto(place)
  const faceKey = faceKeyFor(place, resolveMember)

  const inner = 52, bd = 3, boxOuter = inner + bd * 2 // 58
  const face = 38, overlap = 15, tail = 9
  const w = boxOuter
  const boxTop = face - overlap // 23
  const h = boxTop + boxOuter + tail // 90
  const cx = w / 2

  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')

  // 상자 테두리 + 꼬리 (그림자)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2
  ctx.fillStyle = color
  roundRect(ctx, 0, boxTop, boxOuter, boxOuter, 14); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - 7, boxTop + boxOuter - 3)
  ctx.lineTo(cx + 7, boxTop + boxOuter - 3)
  ctx.lineTo(cx, boxTop + boxOuter + tail)
  ctx.closePath(); ctx.fill()
  ctx.restore()

  // 내부: 사진(cover) 또는 카테고리 아이콘(흰 배경 + contain)
  ctx.save()
  roundRect(ctx, bd, boxTop + bd, inner, inner, 11); ctx.clip()
  ctx.fillStyle = '#fff'
  ctx.fillRect(bd, boxTop + bd, inner, inner)
  try {
    if (photo) {
      const img = await loadImg(photo)
      const s = Math.max(inner / img.width, inner / img.height)
      const dw = img.width * s, dh = img.height * s
      ctx.drawImage(img, bd + (inner - dw) / 2, boxTop + bd + (inner - dh) / 2, dw, dh)
    } else {
      const img = await loadImg(catIconSrc(place.category))
      const pad = 5, box = inner - pad * 2
      const s = Math.min(box / img.width, box / img.height)
      const dw = img.width * s, dh = img.height * s
      ctx.drawImage(img, bd + (inner - dw) / 2, boxTop + bd + (inner - dh) / 2, dw, dh)
    }
  } catch { /* 이미지 로드 실패 시 흰 상자만 */ }
  ctx.restore()

  // 얼굴 아바타 (상자 위)
  if (faceKey) {
    try {
      const f = await loadImg(faceRoundSrc(faceKey))
      ctx.drawImage(f, (w - face) / 2, 0, face, face)
    } catch { /* 얼굴 없으면 생략 */ }
  }

  return {
    url: c.toDataURL('image/png'),
    scaledSize: new window.google.maps.Size(w, h),
    anchor: new window.google.maps.Point(cx, h),
  }
}

function PlaceMarker({ place, onSelect }) {
  const { resolveMember } = usePlaces()
  const [icon, setIcon] = useState(null)
  const faceKey = faceKeyFor(place, resolveMember)
  const photo = placePhoto(place)
  useEffect(() => {
    let cancelled = false
    buildMarkerIcon(place, resolveMember).then((ic) => { if (!cancelled) setIcon(ic) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, place.category, faceKey])
  if (!icon) return null
  return (
    <Marker position={{ lat: place.lat, lng: place.lng }} icon={icon} onClick={() => onSelect(place)} />
  )
}

// 장소가 처음 로드되면 지도를 그 장소들에 맞춰 한 번 이동
function FitPlaces({ places }) {
  const map = useMap('main')
  const done = useRef(false)
  useEffect(() => {
    if (!map || done.current || !places.length) return
    done.current = true
    if (places.length === 1) {
      map.panTo({ lat: places[0].lat, lng: places[0].lng })
      map.setZoom(15)
    } else {
      const b = new window.google.maps.LatLngBounds()
      places.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }))
      map.fitBounds(b, 60)
    }
  }, [map, places])
  return null
}

function LocateButton() {
  const map = useMap('main')
  const locate = () => {
    if (!navigator.geolocation || !map) return
    navigator.geolocation.getCurrentPosition(
      (pos) => { map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); map.setZoom(15) },
      () => alert('위치를 가져올 수 없어요.'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }
  return (
    <button className="map-fab locate" onClick={locate} aria-label="내 위치" title="내 위치">🎯</button>
  )
}

export default function MapView({ onSelect }) {
  const { places } = usePlaces()
  const loaded = useApiIsLoaded()

  const center = useMemo(
    () => (places.length ? { lat: places[0].lat, lng: places[0].lng } : SEOUL),
    [places],
  )

  return (
    <div className="map-wrap">
      <Map
        id="main"
        defaultCenter={center}
        defaultZoom={places.length ? 14 : 11}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        style={{ width: '100%', height: '100%' }}
      >
        {loaded && places.map((p) => (
          <PlaceMarker key={p.id} place={p} onSelect={onSelect} />
        ))}
        <FitPlaces places={places} />
      </Map>
      <LocateButton />

      {places.length === 0 && (
        <div className="map-empty">
          <div className="map-empty__card">
            <div className="map-empty__emoji">🗺️</div>
            <b>아직 기록한 장소가 없어요</b>
            <p>아래 <b>➕ 기록</b> 탭에서<br />첫 장소를 남겨보세요!</p>
          </div>
        </div>
      )}
    </div>
  )
}
