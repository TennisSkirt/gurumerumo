// 장소(Place)의 방문 기록(visits) 헬퍼
// 신 모델: place.visits = [{ rating, photo, memo, visitedAt, author, createdAt }, ...]
// 구 모델(레거시): rating/photo/memo/visitedAt/author 가 place 최상위에 있음 → 방문 1건으로 변환

// 방문 참여자(같이/따로) — participants[] 없으면 레거시 author 1명으로
export function participantsOf(visit) {
  if (Array.isArray(visit.participants) && visit.participants.length) return visit.participants
  return visit.author ? [visit.author] : []
}

// 장소의 모든 방문에 참여한 사람 합집합 (마커 얼굴용)
export function placeParticipants(place) {
  const set = new Set()
  for (const v of visitsOf(place)) for (const id of participantsOf(v)) set.add(id)
  return [...set]
}

export function visitsOf(place) {
  if (Array.isArray(place.visits) && place.visits.length) return place.visits
  return [{
    rating: place.rating || 0,
    photo: place.photo || null,
    memo: place.memo || '',
    visitedAt: place.visitedAt || '',
    author: place.author || null,
    createdAt: place.createdAt || 0,
  }]
}

// 최신 방문이 앞으로
export function sortedVisits(place) {
  return [...visitsOf(place)].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export function latestVisit(place) {
  return sortedVisits(place)[0]
}

export function visitCount(place) {
  return visitsOf(place).length
}

// 방문의 사진들 (photos[] 없으면 레거시 photo 1장으로)
export function visitPhotos(visit) {
  if (Array.isArray(visit.photos) && visit.photos.length) return visit.photos
  return visit.photo ? [visit.photo] : []
}

// 지도/목록 썸네일용: 사진이 있는 가장 최신 방문의 첫 사진
export function placePhoto(place) {
  for (const v of sortedVisits(place)) {
    const ps = visitPhotos(v)
    if (ps.length) return ps[0]
  }
  return null
}

// 대표 별점: 가장 최신 방문의 별점
export function latestRating(place) {
  return latestVisit(place)?.rating || 0
}
