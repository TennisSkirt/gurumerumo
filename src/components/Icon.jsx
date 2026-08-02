import { catIconSrc, faceRoundSrc, uiIconSrc } from '../lib/asset.js'
import { categoryOf } from '../lib/categories.js'

// 카테고리 아이콘 (이미지)
export function CatIcon({ category, size = 22, className = '' }) {
  const c = categoryOf(category)
  return (
    <img
      src={catIconSrc(c.id)}
      alt={c.label}
      width={size}
      height={size}
      className={'gm-cat-icon ' + className}
      style={{ width: size, height: size, objectFit: 'contain', verticalAlign: 'middle' }}
    />
  )
}

// 구성원 아바타 — avatar(얼굴 이미지 키) 있으면 이미지, 없으면 이모지
export function MemberAvatar({ member, size = 24, className = '' }) {
  if (member?.avatar) {
    return (
      <img
        src={faceRoundSrc(member.avatar)}
        alt={member.label || ''}
        width={size}
        height={size}
        className={'gm-avatar ' + className}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle' }}
      />
    )
  }
  return <span className={'gm-avatar-emoji ' + className} style={{ fontSize: size * 0.8 }}>{member?.emoji || '🙂'}</span>
}

// UI 아이콘 (이모지 대체)
export function UiIcon({ name, size = 20, className = '' }) {
  return (
    <img
      src={uiIconSrc(name)}
      alt=""
      width={size}
      height={size}
      className={'gm-ui-icon ' + className}
      style={{ width: size, height: size, objectFit: 'contain', verticalAlign: 'middle' }}
    />
  )
}
