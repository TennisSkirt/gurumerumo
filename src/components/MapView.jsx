import { useEffect, useMemo, useRef, useState } from 'react'
import { Map, Marker, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps'
import { categoryOf } from '../lib/categories.js'
import { usePlaces } from '../store/PlacesContext.jsx'

const SEOUL = { lat: 37.5665, lng: 126.978 }

// ── 카테고리 색 물방울 핀(사진 없을 때) ──
function pinUrl(categoryId) {
  const c = categoryOf(categoryId)
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='46' viewBox='0 0 36 46'>` +
    `<path d='M18 2C9.7 2 3 8.7 3 17c0 10.6 15 27 15 27s15-16.4 15-27C33 8.7 26.3 2 18 2z' fill='${c.color}' stroke='#fff' stroke-width='2.5'/>` +
    `<circle cx='18' cy='17' r='9.5' fill='#fff'/>` +
    `<text x='18' y='18' font-size='13' text-anchor='middle' dominant-baseline='central'>${c.emoji}</text>` +
    `</svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}
function categoryIcon(categoryId) {
  return {
    url: pinUrl(categoryId),
    scaledSize: new window.google.maps.Size(36, 46),
    anchor: new window.google.maps.Point(18, 44),
  }
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

// ── 사진 썸네일 핀(사진 있을 때): 캔버스로 둥근 사각 + 카테고리색 테두리 + 아래 삼각 꼬리 ──
function buildPhotoIcon(photo, categoryId) {
  return new Promise((resolve) => {
    const color = categoryOf(categoryId).color
    const inner = 54          // 사진 영역
    const bd = 3              // 테두리
    const tail = 9            // 꼬리 높이
    const w = inner + bd * 2
    const boxH = inner + bd * 2
    const h = boxH + tail
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      // 그림자
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,.35)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetY = 2
      // 테두리(둥근 사각) + 꼬리
      ctx.fillStyle = color
      roundRect(ctx, 0, 0, w, boxH, 14)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(w / 2 - 7, boxH - 3)
      ctx.lineTo(w / 2 + 7, boxH - 3)
      ctx.lineTo(w / 2, h)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
      // 사진(둥근 사각으로 클립, cover 맞춤)
      ctx.save()
      roundRect(ctx, bd, bd, inner, inner, 11)
      ctx.clip()
      const scale = Math.max(inner / img.width, inner / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.drawImage(img, bd + (inner - dw) / 2, bd + (inner - dh) / 2, dw, dh)
      ctx.restore()
      resolve({
        url: c.toDataURL('image/png'),
        scaledSize: new window.google.maps.Size(w, h),
        anchor: new window.google.maps.Point(w / 2, h),
      })
    }
    img.onerror = () => resolve(categoryIcon(categoryId))
    img.src = photo
  })
}

// 장소 한 개의 마커 — 사진 있으면 썸네일 핀, 없으면 카테고리 핀
function PlaceMarker({ place, onSelect }) {
  const [icon, setIcon] = useState(() => categoryIcon(place.category))
  useEffect(() => {
    let cancelled = false
    if (place.photo) {
      buildPhotoIcon(place.photo, place.category).then((ic) => { if (!cancelled) setIcon(ic) })
    } else {
      setIcon(categoryIcon(place.category))
    }
    return () => { cancelled = true }
  }, [place.photo, place.category])
  return (
    <Marker
      position={{ lat: place.lat, lng: place.lng }}
      icon={icon}
      onClick={() => onSelect(place)}
    />
  )
}

// 장소가 처음 로드되면 지도를 그 장소들에 맞춰 한 번 이동(클라우드 비동기 로드 대응)
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

// 내 위치로 이동 버튼
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
