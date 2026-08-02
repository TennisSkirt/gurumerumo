// Nominatim(OpenStreetMap) 지오코딩 — 가게 이름/주소로 좌표 검색
// 무료. 사용정책: 초당 1회 이하, 개인용 소량. 앱 이름을 붙여 요청.
// 대량/상업용이면 자체 Nominatim 또는 유료 서비스로 교체 필요.
const ENDPOINT = 'https://nominatim.openstreetmap.org/search'

export async function searchPlaces(query, { limit = 6, signal } = {}) {
  const q = query.trim()
  if (!q) return []
  const url =
    `${ENDPOINT}?format=jsonv2&addressdetails=1&limit=${limit}` +
    `&accept-language=ko&q=${encodeURIComponent(q)}`
  const res = await fetch(url, {
    signal,
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`검색 실패 (${res.status})`)
  const data = await res.json()
  return data.map((d) => ({
    name: d.name || d.display_name.split(',')[0],
    displayName: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    kind: d.type,
  }))
}

// 좌표 → 주소 (핀을 지도에서 직접 찍었을 때 주소 채우기, 선택)
const REVERSE = 'https://nominatim.openstreetmap.org/reverse'
export async function reverseGeocode(lat, lng, { signal } = {}) {
  const url = `${REVERSE}?format=jsonv2&accept-language=ko&lat=${lat}&lon=${lng}`
  const res = await fetch(url, { signal, headers: { 'Accept': 'application/json' } })
  if (!res.ok) return null
  const d = await res.json()
  return d?.display_name || null
}
