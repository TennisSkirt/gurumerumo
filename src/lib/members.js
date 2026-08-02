// 가족 구성원(캐릭터) — "누가 기록했나" 구분용
// 고정 목록이 아니라 설정 화면에서 추가/편집/삭제하며, 가족 문서(Firestore)에 공유 저장된다.
// 기본값은 부부 2명. 이모지 아바타(나중에 이미지로 교체 가능).
export const DEFAULT_MEMBERS = [
  { id: 'm1', label: '남편', emoji: '👨', avatar: 'husband' },
  { id: 'm2', label: '아내', emoji: '👩', avatar: 'wife' },
]

// 설정에서 고를 수 있는 얼굴 아바타(디자인 이미지) 키
export const AVATAR_CHOICES = [
  { key: 'husband', label: '남편' },
  { key: 'wife', label: '아내' },
  { key: 'couple', label: '커플' },
]

// 구성원 추가 시 고를 수 있는 이모지 팔레트
export const EMOJI_CHOICES = [
  '👨', '👩', '🧑', '👦', '👧', '👶', '🧔', '👱',
  '👴', '👵', '🙂', '😎', '🥰', '🐶', '🐱', '🐰',
  '🦊', '🐻', '🌟', '❤️',
]

// 목록에 없는 id(삭제된 구성원 등)를 만났을 때의 안전 표시
export function fallbackMember(id) {
  return { id: id || 'unknown', label: '누군가', emoji: '🙂' }
}

// 새 구성원 id 생성
export function newMemberId() {
  return 'm_' + crypto.randomUUID().slice(0, 8)
}
