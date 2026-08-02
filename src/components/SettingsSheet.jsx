import { useState } from 'react'
import { EMOJI_CHOICES } from '../lib/members.js'
import { usePlaces } from '../store/PlacesContext.jsx'

// 설정 바텀시트 — 가족 구성원 관리 + 가족 코드
export default function SettingsSheet({ onClose }) {
  const { members, saveMembers, newMemberId, familyCode, cloud, leaveFamily } = usePlaces()
  const [draft, setDraft] = useState(() => members.map((m) => ({ ...m })))
  const [saving, setSaving] = useState(false)

  const patch = (id, p) => setDraft((d) => d.map((m) => (m.id === id ? { ...m, ...p } : m)))
  const remove = (id) => setDraft((d) => d.filter((m) => m.id !== id))
  const add = () => setDraft((d) => [...d, { id: newMemberId(), label: '', emoji: '🙂' }])

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
        <h3 className="sheet__title">⚙️ 설정</h3>

        <div className="set-section">
          <div className="set-section__head">
            <span>가족 구성원</span>
            <button className="add-member" onClick={add}>＋ 추가</button>
          </div>
          <ul className="member-edit-list">
            {draft.map((m) => (
              <li key={m.id} className="member-edit">
                <select
                  className="emoji-select"
                  value={m.emoji}
                  onChange={(e) => patch(m.id, { emoji: e.target.value })}
                  aria-label="이모지"
                >
                  {/* 현재 이모지가 목록에 없을 수도 있으니 항상 첫 옵션으로 포함 */}
                  {!EMOJI_CHOICES.includes(m.emoji) && <option value={m.emoji}>{m.emoji}</option>}
                  {EMOJI_CHOICES.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
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
                  🗑
                </button>
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
