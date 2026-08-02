import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { makePin } from '../lib/pin.js'
import { usePlaces } from '../store/PlacesContext.jsx'

const SEOUL = [37.5665, 126.978]

// 컨테이너 크기가 늦게 확정될 때 타일이 일부만 로드되는 문제 방지
function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const fix = () => map.invalidateSize()
    const t = setTimeout(fix, 0)
    window.addEventListener('resize', fix)
    return () => { clearTimeout(t); window.removeEventListener('resize', fix) }
  }, [map])
  return null
}

// 내 위치로 이동 버튼 (지도 위 오버레이)
function LocateButton() {
  const map = useMap()
  const locate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 15),
      () => alert('위치를 가져올 수 없어요.'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }
  return (
    <button className="map-fab locate" onClick={locate} aria-label="내 위치" title="내 위치">
      🎯
    </button>
  )
}

export default function MapView({ onSelect }) {
  const { places } = usePlaces()
  const startedRef = useRef(false)

  const center = useMemo(() => {
    if (places.length) return [places[0].lat, places[0].lng]
    return SEOUL
  }, [places])

  return (
    <div className="map-wrap">
      <MapContainer
        center={center}
        zoom={places.length ? 13 : 11}
        className="leaflet-root"
        zoomControl={false}
        whenReady={() => { startedRef.current = true }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {places.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={makePin(p.category)}
            eventHandlers={{ click: () => onSelect(p) }}
          />
        ))}
        <InvalidateSize />
        <LocateButton />
      </MapContainer>

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
