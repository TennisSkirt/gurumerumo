// 장소 검색(지오코딩)
//  - 구글 Places(New) Text Search: 한·일 모두, 한글로 쳐도 잘 찾음("이치란 오사카", "성수동 맛집").
//    브라우저에서 직접 호출 가능(CORS 지원). 키는 리퍼러+API 제한 걸면 노출돼도 안전.
//  - 키가 없으면 Nominatim(OSM)으로 자동 폴백(무료·무키, 단 한글/일본 검색 약함).
//
// [설정 — 사용자]
//  1) console.cloud.google.com → gurumerumo 프로젝트 → "Places API (New)" 사용 설정
//  2) 결제(카드) 사용 설정 (Places는 결제 계정 필요 — 가족앱 사용량은 무료 한도 안)
//  3) 사용자 인증 정보 → API 키 생성 → 제한:
//     - 애플리케이션 제한: HTTP 리퍼러 → https://tennisskirt.github.io/*, http://localhost:5175/*
//     - API 제한: "Places API (New)"만
//  4) 아래 GOOGLE_PLACES_KEY 에 붙여넣기
export const GOOGLE_PLACES_KEY = 'AIzaSyDxIrdNerkFcvvKdBo5X2sJEfCnsD6D6Sw'

const GOOGLE_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const REVERSE = 'https://nominatim.openstreetmap.org/reverse'

async function googleSearch(q, { limit = 6, signal } = {}) {
  const res = await fetch(GOOGLE_ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({ textQuery: q, languageCode: 'ko', maxResultCount: limit }),
  })
  if (!res.ok) throw new Error(`검색 실패 (${res.status})`)
  const data = await res.json()
  return (data.places || []).map((p) => ({
    name: p.displayName?.text || p.formattedAddress,
    displayName: p.formattedAddress || p.displayName?.text || '',
    lat: p.location.latitude,
    lng: p.location.longitude,
  }))
}

async function nominatimSearch(q, { limit = 6, signal } = {}) {
  const url =
    `${NOMINATIM}?format=jsonv2&addressdetails=1&limit=${limit}` +
    `&accept-language=ko&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
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

export async function searchPlaces(query, opts = {}) {
  const q = query.trim()
  if (!q) return []
  if (GOOGLE_PLACES_KEY) return googleSearch(q, opts)
  return nominatimSearch(q, opts)
}

// 좌표 → 주소 (선택 기능). Nominatim 사용(무료).
export async function reverseGeocode(lat, lng, { signal } = {}) {
  const url = `${REVERSE}?format=jsonv2&accept-language=ko&lat=${lat}&lon=${lng}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const d = await res.json()
  return d?.display_name || null
}
