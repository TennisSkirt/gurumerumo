// Firebase(Firestore) 저장 사용량을 앱이 들고 있는 데이터로 추정한다.
// 사진은 문서 안에 base64 로 저장되므로, 각 장소 문서의 바이트 크기 합이 곧 저장 사용량.
import { visitsOf, visitPhotos } from './places.js'

const DOC_LIMIT = 1024 * 1024          // 1 MiB — Firestore 문서 1건 최대(하드 리밋, 초과 시 저장 실패)
const FREE_TIER = 1024 * 1024 * 1024   // 1 GiB — Firestore 무료 저장 한도

function byteSize(obj) {
  try { return new Blob([JSON.stringify(obj)]).size } catch { return 0 }
}

function countPhotos(place) {
  let n = 0
  for (const v of visitsOf(place)) n += visitPhotos(v).length
  for (const c of place.comments || []) if (c && c.photo) n++
  return n
}

// 전체 사용량 + 가장 큰 문서(문서 한도 근접 경고용)
export function storageUsage(places = []) {
  let total = 0
  let photos = 0
  let largest = null
  let largestSize = 0
  for (const p of places) {
    const s = byteSize(p)
    total += s
    photos += countPhotos(p)
    if (s > largestSize) { largestSize = s; largest = p }
  }
  const freePct = FREE_TIER ? total / FREE_TIER : 0
  const largestPct = DOC_LIMIT ? largestSize / DOC_LIMIT : 0
  const nearFree = freePct >= 0.8
  const nearDoc = largestPct >= 0.8
  return {
    total, photos, count: places.length,
    freeTier: FREE_TIER, freePct,
    docLimit: DOC_LIMIT, largest, largestSize, largestPct,
    nearFree, nearDoc,
    warn: nearFree || nearDoc,
    // 상태: 여유 / 주의 / 경고
    level: nearFree || nearDoc ? 'danger' : (freePct >= 0.5 || largestPct >= 0.5 ? 'warn' : 'ok'),
  }
}

export function fmtBytes(b) {
  if (!b) return '0 KB'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export function fmtPct(x) {
  const p = x * 100
  if (p > 0 && p < 0.1) return '0.1%'
  return p < 10 ? `${p.toFixed(1)}%` : `${Math.round(p)}%`
}
