import { useMemo } from 'react'
import { Map, Marker, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps'
import { categoryOf } from '../lib/categories.js'
import { usePlaces } from '../store/PlacesContext.jsx'

const SEOUL = { lat: 37.5665, lng: 126.978 }

// 카테고리 색 물방울 핀(SVG data URI)
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

// 내 위치로 이동 버튼 (지도 위 오버레이)
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
          <Marker
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => onSelect(p)}
            icon={{
              url: pinUrl(p.category),
              scaledSize: new window.google.maps.Size(36, 46),
              anchor: new window.google.maps.Point(18, 44),
            }}
          />
        ))}
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
