import { useEffect, useMemo, useRef, useState } from 'react'
import { Map, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { categoryOf } from '../lib/categories.js'
import { placePhoto, placeParticipants } from '../lib/places.js'
import { catIconSrc, faceRoundSrc, uiIconSrc, characterSrc } from '../lib/asset.js'
import { usePlaces } from '../store/PlacesContext.jsx'

const SEOUL = { lat: 37.5665, lng: 126.978 }
const SS = 4

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
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2
  ctx.fillStyle = color
  roundRect(ctx, 0, boxTop, boxOuter, boxOuter, 14); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - 7, boxTop + boxOuter - 3); ctx.lineTo(cx + 7, boxTop + boxOuter - 3); ctx.lineTo(cx, boxTop + boxOuter + tail)
  ctx.closePath(); ctx.fill()
  ctx.restore()

  ctx.save()
  roundRect(ctx, bd, boxTop + bd, inner, inner, 11); ctx.clip()
  ctx.fillStyle = '#fff'; ctx.fillRect(bd, boxTop + bd, inner, inner)
  try {
    if (photo) {
      const img = await loadImg(photo)
      const s = Math.max(inner / img.width, inner / img.height)
      ctx.drawImage(img, bd + (inner - img.width * s) / 2, boxTop + bd + (inner - img.height * s) / 2, img.width * s, img.height * s)
    } else {
      const img = await loadImg(catIconSrc(place.category))
      const pad = 5, box = inner - pad * 2
      const s = Math.min(box / img.width, box / img.height)
      ctx.drawImage(img, bd + (inner - img.width * s) / 2, boxTop + bd + (inner - img.height * s) / 2, img.width * s, img.height * s)
    }
  } catch { /* 흰 상자만 */ }
  ctx.restore()

  if (faceKey) {
    try {
      const f = await loadImg(faceRoundSrc(faceKey))
      ctx.drawImage(f, (w - face) / 2, 0, face, face)
    } catch { /* 생략 */ }
  }
  return { url: c.toDataURL('image/png'), w, h }
}

// 가고 싶은 곳 마커 — 흰 바탕 + 점선 카테고리색 테두리(계획 느낌) + 카테고리 아이콘. 얼굴 없음.
async function buildWishBase(wish) {
  const color = categoryOf(wish.category).color
  const inner = 44, bd = 3, boxOuter = inner + bd * 2, tail = 9
  const w = boxOuter
  const h = boxOuter + tail
  const cx = w / 2

  const c = document.createElement('canvas')
  c.width = w * SS; c.height = h * SS
  const ctx = c.getContext('2d')
  ctx.scale(SS, SS)
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'

  // 흰 상자 + 꼬리 + 그림자
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2
  ctx.fillStyle = '#fff'
  roundRect(ctx, 0, 0, boxOuter, boxOuter, 13); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - 7, boxOuter - 3); ctx.lineTo(cx + 7, boxOuter - 3); ctx.lineTo(cx, boxOuter + tail)
  ctx.closePath(); ctx.fill()
  ctx.restore()

  // 점선 카테고리색 테두리
  ctx.save()
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash([5, 3])
  roundRect(ctx, bd, bd, boxOuter - bd * 2, boxOuter - bd * 2, 11); ctx.stroke()
  ctx.restore()

  // 카테고리 아이콘
  try {
    const img = await loadImg(catIconSrc(wish.category))
    const pad = 10, box = boxOuter - pad * 2
    const s = Math.min(box / img.width, box / img.height)
    ctx.drawImage(img, (boxOuter - img.width * s) / 2, (boxOuter - img.height * s) / 2, img.width * s, img.height * s)
  } catch { /* 흰 상자만 */ }

  return { url: c.toDataURL('image/png'), w, h }
}

// 마커 이미지 캐시 — 카테고리·얼굴·사진이 그대로면 캔버스 재합성 생략(스냅샷마다 전부 다시 안 그림)
// ⚠️ 이 파일은 vis.gl 의 <Map> 을 import 하므로 전역 Map 이 가려짐 → 캐시는 일반 객체로.
const baseCache = Object.create(null)
function markerSig(place, resolveMember) {
  const photo = placePhoto(place)
  const fk = faceKeyFor(place, resolveMember) || 'none'
  const pf = photo ? photo.length + ':' + photo.slice(-24) : 'none'
  return `${place.category}|${fk}|${pf}`
}
function buildMarkerBaseCached(place, resolveMember) {
  const sig = markerSig(place, resolveMember)
  const hit = baseCache[sig]
  if (hit) return Promise.resolve(hit)
  return buildMarkerBase(place, resolveMember).then((base) => { baseCache[sig] = base; return base })
}

function applyIcon(marker, base, zoom) {
  const f = zoomFactor(zoom)
  marker.setIcon({
    url: base.url,
    scaledSize: new window.google.maps.Size(base.w * f, base.h * f),
    anchor: new window.google.maps.Point((base.w * f) / 2, base.h * f),
  })
}

function clusterIcon(count) {
  const size = count < 10 ? 42 : count < 100 ? 50 : 58
  const r = size / 2 - 3
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>` +
    `<circle cx='${size / 2}' cy='${size / 2}' r='${r + 3}' fill='#e8562c' opacity='0.25'/>` +
    `<circle cx='${size / 2}' cy='${size / 2}' r='${r}' fill='#e8562c' stroke='#fff' stroke-width='3'/></svg>`
  return { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), size }
}
const clusterRenderer = {
  render: ({ count, position }) => {
    const { url, size } = clusterIcon(count)
    return new window.google.maps.Marker({
      position,
      icon: { url, scaledSize: new window.google.maps.Size(size, size), anchor: new window.google.maps.Point(size / 2, size / 2) },
      label: { text: String(count), color: '#fff', fontSize: count < 100 ? '15px' : '13px', fontWeight: '700' },
      zIndex: 1000 + count,
    })
  },
}

// 마커를 명령형으로 생성 + 클러스터러로 관리 (축소하면 개수로 묶임)
function Markers({ places, onSelect, zoom }) {
  const map = useMap('main')
  const { resolveMember } = usePlaces()
  const markers = useRef({}) // id -> google.maps.Marker
  const clusterer = useRef(null)
  const onSelectRef = useRef(onSelect)
  const zoomRef = useRef(zoom)
  onSelectRef.current = onSelect
  zoomRef.current = zoom

  useEffect(() => {
    if (!map || clusterer.current) return
    clusterer.current = new MarkerClusterer({ map, renderer: clusterRenderer })
  }, [map])

  // places 변화 → 마커 동기화
  useEffect(() => {
    if (!map || !clusterer.current) return
    const cur = markers.current
    const ids = new Set(places.map((p) => p.id))
    for (const id of Object.keys(cur)) {
      if (!ids.has(id)) { cur[id].setMap(null); delete cur[id] }
    }
    for (const p of places) {
      let m = cur[p.id]
      if (!m) {
        m = new window.google.maps.Marker({ position: { lat: p.lat, lng: p.lng } })
        m.addListener('click', () => onSelectRef.current(m.__place))
        cur[p.id] = m
      } else {
        m.setPosition({ lat: p.lat, lng: p.lng })
      }
      m.__place = p
      buildMarkerBaseCached(p, resolveMember).then((base) => { m.__base = base; applyIcon(m, base, zoomRef.current) })
    }
    clusterer.current.clearMarkers()
    clusterer.current.addMarkers(Object.values(cur))
  }, [places, map]) // eslint-disable-line react-hooks/exhaustive-deps

  // 줌 변화 → 아이콘 크기 재적용
  useEffect(() => {
    for (const m of Object.values(markers.current)) {
      if (m.__base) applyIcon(m, m.__base, zoom)
    }
  }, [zoom])

  useEffect(() => () => {
    // 언마운트 정리
    if (clusterer.current) clusterer.current.clearMarkers()
    for (const m of Object.values(markers.current)) m.setMap(null)
    markers.current = {}
  }, [])

  return null
}

// 가고 싶은 곳 마커 (클러스터 없이 개별 표시). 탭하면 위시리스트 탭으로 이동.
function WishMarkers({ wishes, zoom, onWishClick }) {
  const map = useMap('main')
  const markers = useRef({})
  const zoomRef = useRef(zoom)
  const onClickRef = useRef(onWishClick)
  zoomRef.current = zoom
  onClickRef.current = onWishClick

  useEffect(() => {
    if (!map) return
    const cur = markers.current
    const ids = new Set(wishes.map((w) => w.id))
    for (const id of Object.keys(cur)) {
      if (!ids.has(id)) { cur[id].setMap(null); delete cur[id] }
    }
    for (const w of wishes) {
      let m = cur[w.id]
      if (!m) {
        m = new window.google.maps.Marker({ position: { lat: w.lat, lng: w.lng }, title: w.name, zIndex: 5 })
        m.addListener('click', () => onClickRef.current && onClickRef.current(m.__wish))
        cur[w.id] = m
      } else {
        m.setPosition({ lat: w.lat, lng: w.lng })
        m.setTitle(w.name)
      }
      m.__wish = w
      m.setMap(map)
      buildWishBase(w).then((base) => { m.__base = base; applyIcon(m, base, zoomRef.current) })
    }
  }, [wishes, map])

  useEffect(() => {
    for (const m of Object.values(markers.current)) {
      if (m.__base) applyIcon(m, m.__base, zoom)
    }
  }, [zoom])

  useEffect(() => () => {
    for (const m of Object.values(markers.current)) m.setMap(null)
    markers.current = {}
  }, [])

  return null
}

function FitPlaces({ places }) {
  const map = useMap('main')
  const done = useRef(false)
  useEffect(() => {
    if (!map || done.current || !places.length) return
    done.current = true
    if (places.length === 1) { map.panTo({ lat: places[0].lat, lng: places[0].lng }); map.setZoom(15) }
    else {
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

export default function MapView({ onSelect, onWishClick }) {
  const { places, wishes, t } = usePlaces()
  const loaded = useApiIsLoaded()
  const [zoom, setZoom] = useState(places.length ? 14 : 11)
  const [filter, setFilter] = useState('all') // all | visited | wish

  const center = useMemo(
    () => (places.length ? { lat: places[0].lat, lng: places[0].lng } : SEOUL),
    [places],
  )

  const showVisited = filter !== 'wish'
  const showWish = filter !== 'visited'

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
        {loaded && showVisited && <Markers places={places} onSelect={onSelect} zoom={zoom} />}
        {loaded && showWish && <WishMarkers wishes={wishes} zoom={zoom} onWishClick={onWishClick} />}
        <FitPlaces places={places} />
      </Map>
      <LocateButton />
      <img className="map-mascot" src={characterSrc('husband')} alt="" />

      {wishes.length > 0 && (
        <div className="map-filter">
          <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>{t('전체', 'すべて')}</button>
          <button className={filter === 'visited' ? 'on' : ''} onClick={() => setFilter('visited')}>{t('가봤어요', '行った')}</button>
          <button className={filter === 'wish' ? 'on' : ''} onClick={() => setFilter('wish')}>{t('가고싶어', '行きたい')}</button>
        </div>
      )}

      {places.length === 0 && wishes.length === 0 && (
        <div className="map-empty">
          <div className="map-empty__card">
            <b>{t('아직 기록한 장소가 없어요', 'まだ記録した場所がありません')}</b>
            <p>{t('아래 기록 탭에서', '下の「記録」タブから')}<br />{t('첫 장소를 남겨보세요!', '最初の場所を残してみましょう！')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
