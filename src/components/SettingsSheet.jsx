import { useState } from 'react'
import { AVATAR_CHOICES } from '../lib/members.js'
import { faceRoundSrc } from '../lib/asset.js'
import { UiIcon } from './Icon.jsx'
import { useSheetDrag } from '../lib/useSheetDrag.js'
import { usePlaces } from '../store/PlacesContext.jsx'

export default function SettingsSheet({ onClose }) {
  const { members, saveMembers, newMemberId, familyCode, cloud, leaveFamily, lang, setLang, t } = usePlaces()
  const { dragProps, sheetStyle } = useSheetDrag(onClose)
  const [draft, setDraft] = useState(() => members.map((m) => ({ ...m })))
  const [saving, setSaving] = useState(false)

  const patch = (id, p) => setDraft((d) => d.map((m) => (m.id === id ? { ...m, ...p } : m)))
  const remove = (id) => setDraft((d) => d.filter((m) => m.id !== id))
  const add = () => setDraft((d) => [...d, { id: newMemberId(), label: '', avatar: 'husband' }])

  const save = async () => {
    const cleaned = draft.map((m, i) => ({ ...m, label: m.label.trim() || `${t('구성원', 'メンバー')}${i + 1}` }))
    setSaving(true)
    try { await saveMembers(cleaned); onClose() }
    catch (e) { console.error(e); alert(t('저장 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.', '保存中に問題が発生しました。少し後にもう一度お試しください。')); setSaving(false) }
  }

  const doLeave = () => {
    if (confirm(t('이 가족 지도 연결을 해제할까요? (기기에서만 나가며, 데이터는 클라우드에 남아요)', 'この家族マップの接続を解除しますか？（端末から抜けるだけで、データはクラウドに残ります）'))) {
      leaveFamily(); onClose()
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" {...dragProps}><div className="sheet__grab" /></div>
        <h3 className="sheet__title"><UiIcon name="gear" size={20} /> {t('설정', '設定')}</h3>

        <div className="set-section">
          <div className="set-section__head"><span>{t('앱 언어', '言語')}</span></div>
          <div className="lang-toggle">
            <button className={'lang-opt' + (lang === 'ko' ? ' on' : '')} onClick={() => setLang('ko')}>한국어</button>
            <button className={'lang-opt' + (lang === 'ja' ? ' on' : '')} onClick={() => setLang('ja')}>日本語</button>
          </div>
        </div>

        <div className="set-section">
          <div className="set-section__head">
            <span>{t('가족 구성원', '家族メンバー')}</span>
            <button className="add-member" onClick={add}>＋ {t('추가', '追加')}</button>
          </div>
          <ul className="member-edit-list">
            {draft.map((m) => (
              <li key={m.id} className="member-edit">
                <div className="member-edit__row">
                  <input className="member-name" value={m.label} onChange={(e) => patch(m.id, { label: e.target.value })}
                    placeholder={t('이름 (예: 아빠, 김밀리)', '名前（例: 夫、ミリ）')} maxLength={12} />
                  <button className="member-del" onClick={() => remove(m.id)} disabled={draft.length <= 1}
                    aria-label={t('삭제', '削除')} title={draft.length <= 1 ? t('최소 1명은 있어야 해요', '最低1人は必要です') : t('삭제', '削除')}>
                    <UiIcon name="trash" size={18} />
                  </button>
                </div>
                <div className="ava-pick">
                  {AVATAR_CHOICES.map((a) => (
                    <button type="button" key={a.key}
                      className={'ava-opt' + (m.avatar === a.key ? ' on' : '')}
                      onClick={() => patch(m.id, { avatar: a.key })} title={a.label}>
                      <img src={faceRoundSrc(a.key)} alt={a.label} />
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <p className="hint-sm">{t('구성원은 가족이 함께 공유해요. 삭제한 사람이 남긴 기록은 "누군가"로 표시됩니다.', 'メンバーは家族で共有します。削除した人の記録は「誰か」と表示されます。')}</p>
        </div>

        {cloud && (
          <div className="set-section">
            <div className="set-section__head"><span>{t('가족 공유', '家族で共有')}</span></div>
            <p className="hint-sm">
              {t('가족 코드', '家族コード')} <b className="code">{familyCode}</b> — {t('이 코드를 가족에게 알려주면 같은 지도를 봐요.', 'このコードを家族に伝えると同じ地図を見られます。')}
            </p>
            <button className="ghost leave-btn" onClick={doLeave}>{t('이 기기에서 연결 해제', 'この端末で接続を解除')}</button>
          </div>
        )}

        <div className="sheet__actions">
          <button className="ghost" onClick={onClose}>{t('취소', 'キャンセル')}</button>
          <button className="primary" onClick={save} disabled={saving}>{saving ? t('저장 중…', '保存中…') : t('저장', '保存')}</button>
        </div>
      </div>
    </div>
  )
}
