// 가족 구성원(캐릭터) — "누가 기록했나" 구분용
// 지금은 이모지 아바타, 나중에 캐릭터 이미지(assets/members/<id>.png)로 교체 가능
export const MEMBERS = [
  { id: 'dad',     label: '아빠',   emoji: '👨' },
  { id: 'mom',     label: '엄마',   emoji: '👩' },
  { id: 'son',     label: '아들',   emoji: '👦' },
  { id: 'daughter',label: '딸',     emoji: '👧' },
  { id: 'grandpa', label: '할아버지', emoji: '👴' },
  { id: 'grandma', label: '할머니', emoji: '👵' },
]

export const MEMBER_MAP = Object.fromEntries(MEMBERS.map((m) => [m.id, m]))

export function memberOf(id) {
  return MEMBER_MAP[id] || { id: 'unknown', label: '누군가', emoji: '🙂' }
}
