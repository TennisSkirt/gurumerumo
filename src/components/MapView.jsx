import { useEffect, useMemo, useRef, useState } from 'react'
import { Map, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { categoryOf } from '../lib/categories.js'
import { placePhoto, placeParticipants } from '../lib/places.js'
import { catIconSrc, faceRoundSrc, uiIconSrc } from '../lib/asset.js'
import { usePlaces } from '../store/PlacesContext.jsx'

const SEOUL = { lat: 37.5665, lng: 126.978 }
const SS = 4 // 슈퍼샘플링(고해상도)

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

function faceKeyFor(place, resolveMember) {
  const ids = placeParticipants(place)
  if (ids.length >= 2) return 'couple'
  if (ids.length === 1) return resolveMember(ids[0]).avatar || null
  return null
}

function zoomFactor(zoom) {
  const z = typeof zoom === 'number' ? zoom : 15
  return Math.min(1.8, Math.max(0.5, Math.pow(1.15, z - 15)))
}

async function buildMarkerBase(place, resolveMember) {
  const color = categoryOf(place.category).color
  const photo = placePhoto(place)
  const faceKey = faceKeyFor(place, resolveMember)

  const inner = 52, bd = 3, boxOuter = inner + bd * 2
  const face = 38, overlap = 15, tail = 9
  const w = boxOuter
  const boxTop = face - overlap
  const h = boxTop + boxOuter + tail
  const cx = w / 2

  const c = document.createElement('canvas')
  c.width = w * SS; c.height = h * SS
  const ctx = c.getContext('2d')
  ctx.scale(SS, SS)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

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
  } catch { /* noop */ }
  ctx.restore()

  if (faceKey) {
    try {
      const f = await loadImg(faceRoundSrc(faceKey))
      ctx.drawImage(f, (w - face) / 2, 0, face, face)
    } catch { /* noop */ }
  }
  return { url: c.toDataURL('image/png'), w, h }
}

// 클러스터(묶음) 표시 — 오렌지 원 + 개수
function clusterIconUrl(count, size) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>` +
    `<circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 4}' fill='#e8562c' stroke='#fff' stroke-width='3'/>` +
    `<circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 4}' fill='none' stroke='rgba(0,0,0,.08)' stroke-width='1'/>` +
    `</svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

const clusterRenderer = {
  render({ count, position }) {
    const size = count < 10 ? 42 : count < 100 ? 50 : 58
    return new window.google.maps.Marker({
      position,
      icon: {
        url: clusterIconUrl(count, size),
        scaledSize: new window.google.maps.Size(size, size),
        anchor: new window.google.maps.Point(size / 2, size / 2),
      },
      label: { text: String(count), color: '#fff', fontSize: '14px', fontWeight: '800' },
      zIndex: 10000 + count,
    })
  },
}

// 마커 + 클러스터러 (명령형 관리)
function Markers({ places, onSelect, zoom }) {
  const map = useMap('main')
  const { resolveMember } = usePlaces()
  const clustererRef = useRef(null)
  const markersRef = useRef([]) // [{ marker, base }]

  // places 바뀌면 마커/클러스터 재생성
  useEffect(() => {
    if (!map) return
    let cancelled = false
    ;(async () => {
      const built = await Promise.all(
        places.map(async (p) => ({ place: p, base: await buildMarkerBase(p, resolveMember) })),
      )
      if (cancelled) return
      if (clustererRef.current) clustererRef.current.setMap(null)
      markersRef.current.forEach(({ marker }) => marker.setMap(null))

      const f = zoomFactor(zoom)
      const items = built.map(({ place, base }) => {
        const marker = new window.google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          icon: {
            url: base.url,
            scaledSize: new window.google.maps.Size(base.w * f, base.h * f),
            anchor: new window.google.maps.Point((base.w * f) / 2, base.h * f),
          },
        })
        marker.addListener('click', () => onSelect(place))
        return { marker, base }
      })
      markersRef.current = items
      clustererRef.current = new MarkerClusterer({
        map,
        markers: items.map((i) => i.marker),
        renderer: clusterRenderer,
      })
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, places])

  // 줌 바뀌면 개별 마커 크기만 재계산
  useEffect(() => {
    const f = zoomFactor(zoom)
    markersRef.current.forEach(({ marker, base }) => {
      marker.setIcon({
        url: base.url,
        scaledSize: new window.google.maps.Size(base.w * f, base.h * f),
        anchor: new window.google.maps.Point((base.w * f) / 2, base.h * f),
      })
    })
  }, [zoom])

  // 언마운트 정리
  useEffect(() => () => {
    if (clustererRef.current) clustererRef.current.setMap(null)
    markersRef.current.forEach(({ marker }) => marker.setMap(null))
  }, [])

  return null
}

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
  const { t } = usePlaces()
  const locate = () => {
    if (!navigator.geolocation || !map) return
    navigator.geolocation.getCurrentPosition(
      (pos) => { map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); map.setZoom(16) },
      () => alert(t('위치를 가져올 수 없어요.', '現在地を取得できませんでした。')),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }
  return (
    <button className="map-fab locate" onClick={locate} aria-label={t('내 위치', '現在地')}>
      <img src={uiIconSrc('locate')} alt="" width={24} height={24} />
    </button>
  )
}

export default function MapView({ onSelect }) {
  const { places, t } = usePlaces()
  const loaded = useApiIsLoaded()
  const [zoom, setZoom] = useState(places.length ? 14 : 11)

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
        onCameraChanged={(ev) => {
          const z = Math.round(ev.detail.zoom * 2) / 2
          setZoom((prev) => (prev === z ? prev : z))
        }}
      >
        {loaded && <Markers places={places} onSelect={onSelect} zoom={zoom} />}
        <FitPlaces places={places} />
      </Map>
      <LocateButton />

      {places.length === 0 && (
        <div className="map-empty">
          <div className="map-empty__card">
            <img className="map-empty__img" src={uiIconSrc('search')} alt="" width={44} height={44} />
            <b>{t('아직 기록한 장소가 없어요', 'まだ記録した場所がありません')}</b>
            <p>{t('아래 기록 탭에서', '下の「記録」タブから')}<br />{t('첫 장소를 남겨보세요!', '最初の場所を残してみましょう！')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
