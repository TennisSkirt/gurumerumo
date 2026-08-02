import { useEffect, useRef, useState } from 'react'
import { Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { searchPlaces } from '../lib/geocode.js'
import { usePlaces } from '../store/PlacesContext.jsx'

const SEOUL = { lat: 37.5665, lng: 126.978 }

// 외부에서 좌표가 바뀌면 지도 이동 (검색 결과 선택 시)
function Recenter({ coords }) {
  const map = useMap('picker')
  useEffect(() => {
    if (map && coords) {
      map.panTo(coords)
      map.setZoom(Math.max(map.getZoom() || 15, 16))
    }
  }, [coords, map])
  return null
}

export default function LocationPicker({ coords, onPick, onName }) {
  const { t } = usePlaces()
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
      if (found.length === 0) setErr(t('검색 결과가 없어요. 지도를 눌러 직접 찍어도 돼요.', '検索結果がありません。地図をタップして指定できます。'))
    } catch (e2) {
      if (e2.name !== 'AbortError') setErr(t('검색 중 문제가 생겼어요.', '検索中に問題が発生しました。'))
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
          placeholder={t('가게·장소 이름으로 검색 (예: 성수동 카페)', '店・場所名で検索（例: 道頓堀 たこ焼き）')}
        />
        <button type="button" onClick={runSearch} disabled={busy}>{busy ? '…' : t('검색', '検索')}</button>
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
        <Map
          id="picker"
          defaultCenter={coords || SEOUL}
          defaultZoom={coords ? 16 : 11}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          onClick={(e) => {
            const ll = e.detail?.latLng
            if (ll) onPick(ll.lat, ll.lng)
          }}
          style={{ width: '100%', height: '100%' }}
        >
          {coords && <Marker position={coords} />}
          <Recenter coords={coords} />
        </Map>
        <div className="picker-hint">{t('지도를 눌러 위치를 콕 찍어보세요', '地図をタップして場所を指定')}</div>
      </div>
    </div>
  )
}
