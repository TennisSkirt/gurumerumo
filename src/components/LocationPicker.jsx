import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { searchPlaces } from '../lib/geocode.js'

const SEOUL = [37.5665, 126.978]

const dropIcon = L.divIcon({
  html: '<div class="gm-drop">📍</div>',
  className: 'gm-drop-wrap',
  iconSize: [40, 40],
  iconAnchor: [20, 38],
})

// 지도 클릭 → 좌표 콜백
function ClickCatcher({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

// 외부에서 좌표가 바뀌면 지도 이동
function Recenter({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], Math.max(map.getZoom(), 15))
  }, [coords, map])
  return null
}

// 컨테이너 크기 늦게 확정 시 타일 일부만 로드되는 문제 방지
function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0)
    return () => clearTimeout(t)
  }, [map])
  return null
}

export default function LocationPicker({ coords, onPick, onName }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const abortRef = useRef(null)

  const runSearch = async () => {
    if (!q.trim()) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setBusy(true); setErr(''); setResults([])
    try {
      const found = await searchPlaces(q, { signal: ctrl.signal })
      setResults(found)
      if (found.length === 0) setErr('검색 결과가 없어요. 지도를 눌러 직접 찍어도 돼요.')
    } catch (e2) {
      if (e2.name !== 'AbortError') setErr('검색 중 문제가 생겼어요.')
    } finally {
      setBusy(false)
    }
  }

  const choose = (r) => {
    onPick(r.lat, r.lng)
    onName?.(r.name)
    setResults([])
    setQ(r.name)
  }

  return (
    <div className="picker">
      {/* 바깥 record 폼 안에 또 form 을 두면 중첩 폼이 되어 검색 버튼이 상위 폼을 제출함.
          그래서 form 대신 div + 버튼 onClick / Enter 키로 검색을 실행한다. */}
      <div className="picker-search">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch() } }}
          placeholder="가게·장소 이름으로 검색 (예: 홍대 연남토마)"
        />
        <button type="button" onClick={runSearch} disabled={busy}>{busy ? '…' : '검색'}</button>
      </div>
      {err && <div className="picker-err">{err}</div>}
      {results.length > 0 && (
        <ul className="picker-results">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => choose(r)}>
                <b>{r.name}</b>
                <span>{r.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="picker-map">
        <MapContainer center={coords ? [coords.lat, coords.lng] : SEOUL} zoom={coords ? 15 : 11} className="leaflet-root">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <ClickCatcher onPick={onPick} />
          <Recenter coords={coords} />
          <InvalidateSize />
          {coords && <Marker position={[coords.lat, coords.lng]} icon={dropIcon} />}
        </MapContainer>
        <div className="picker-hint">지도를 눌러 위치를 콕 찍어보세요</div>
      </div>
    </div>
  )
}
