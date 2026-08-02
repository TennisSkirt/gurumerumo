// 장소 카테고리 — 지도 핀 색/아이콘 구분에 사용
// color 는 핀·뱃지 색, emoji 는 아이콘(나중에 이미지로 교체 가능)
export const CATEGORIES = [
  { id: 'food',    label: '맛집',   emoji: '🍜', color: '#e8562c' },
  { id: 'cafe',    label: '카페',   emoji: '☕', color: '#a9744f' },
  { id: 'play',    label: '놀거리', emoji: '🎡', color: '#8e5bd0' },
  { id: 'travel',  label: '여행',   emoji: '✈️', color: '#2f8fd0' },
  { id: 'nature',  label: '자연',   emoji: '🌳', color: '#4e9a51' },
  { id: 'etc',     label: '기타',   emoji: '📍', color: '#6b7280' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export function categoryOf(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP.etc
}
