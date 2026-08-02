import { useState } from 'react'
import { AVATAR_CHOICES } from '../lib/members.js'
import { faceRoundSrc } from '../lib/asset.js'
import { UiIcon } from './Icon.jsx'
import { usePlaces } from '../store/PlacesContext.jsx'

// 설정 바텀시트 — 가족 구성원 관리 + 가족 코드
export default function SettingsSheet({ onClose }) {
  const { members, saveMembers, newMemberId, familyCode, cloud, leaveFamily } = usePlaces()
  const [draft, setDraft] = useState(() => members.map((m) => ({ ...m })))
  const [saving, setSaving] = useState(false)

  const patch = (id, p) => setDraft((d) => d.map((m) => (m.id === id ? { ...m, ...p } : m)))
  const remove = (id) => setDraft((d) => d.filter((m) => m.id !== id))
  const add = () => setDraft((d) => [...d, { id: newMemberId(), label: '', emoji: '🙂', avatar: 'husband' }])

  const save = async () => {
    // 이름 빈 칸은 기본 라벨로 정리
    const cleaned = draft.map((m, i) => ({
      ...m,
      label: m.label.trim() || `구성원${i + 1}`,
    }))
    setSaving(true)
    try {
      await saveMembers(cleaned)
      onClose()
    } catch (e) {
      console.error(e)
      alert('저장 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.')
      setSaving(false)
    }
  }

  const doLeave = () => {
    if (confirm('이 가족 지도 연결을 해제할까요? (기기에서만 나가며, 데이터는 클라우드에 남아요)')) {
      leaveFamily()
      onClose()
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grab" />
        <h3 className="sheet__title"><UiIcon name="gear" size={20} /> 설정</h3>

        <div className="set-section">
          <div className="set-section__head">
            <span>가족 구성원</span>
            <button className="add-member" onClick={add}>＋ 추가</button>
          </div>
          <ul className="member-edit-list">
            {draft.map((m) => (
              <li key={m.id} className="member-edit">
                <div className="member-edit__row">
                  <input
                    className="member-name"
                    value={m.label}
                    onChange={(e) => patch(m.id, { label: e.target.value })}
                    placeholder="이름 (예: 아빠, 김밀리)"
                    maxLength={12}
                  />
                  <button
                    className="member-del"
                    onClick={() => remove(m.id)}
                    disabled={draft.length <= 1}
                    aria-label="삭제"
                    title={draft.length <= 1 ? '최소 1명은 있어야 해요' : '삭제'}
                  >
                    <UiIcon name="trash" size={18} />
                  </button>
                </div>
                <div className="ava-pick">
                  {AVATAR_CHOICES.map((a) => (
                    <button
                      type="button"
                      key={a.key}
                      className={'ava-opt' + (m.avatar === a.key ? ' on' : '')}
                      onClick={() => patch(m.id, { avatar: a.key })}
                      title={a.label}
                    >
                      <img src={faceRoundSrc(a.key)} alt={a.label} />
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <p className="hint-sm">
            구성원은 가족이 함께 공유해요. 삭제한 사람이 남긴 기록은 "누군가"로 표시됩니다.
          </p>
        </div>

        {cloud && (
          <div className="set-section">
            <div className="set-section__head"><span>가족 공유</span></div>
            <p className="hint-sm">
              가족 코드 <b className="code">{familyCode}</b> — 이 코드를 가족에게 알려주면 같은 지도를 봐요.
            </p>
            <button className="ghost leave-btn" onClick={doLeave}>이 기기에서 연결 해제</button>
          </div>
        )}

        <div className="sheet__actions">
          <button className="ghost" onClick={onClose}>취소</button>
          <button className="primary" onClick={save} disabled={saving}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
