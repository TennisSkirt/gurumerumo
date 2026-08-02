import { useMemo, useState } from 'react'
import { AVATAR_CHOICES } from '../lib/members.js'
import { faceRoundSrc } from '../lib/asset.js'
import { storageUsage, fmtBytes, fmtPct } from '../lib/usage.js'
import { UiIcon } from './Icon.jsx'
import { useSheetDrag } from '../lib/useSheetDrag.js'
import { usePlaces } from '../store/PlacesContext.jsx'

export default function SettingsSheet({ onClose }) {
  const { places, members, saveMembers, newMemberId, familyCode, cloud, leaveFamily, lang, setLang, t } = usePlaces()
  const usage = useMemo(() => storageUsage(places), [places])
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

        {cloud && (
          <div className="set-section">
            <div className="set-section__head">
              <span>{t('저장 공간 (Firebase)', 'ストレージ（Firebase）')}</span>
              <span className={'usage-chip usage-chip--' + usage.level}>
                {usage.level === 'ok' ? t('여유', '余裕') : usage.level === 'warn' ? t('주의', '注意') : t('경고', '警告')}
              </span>
            </div>
            <div className="usage">
              <div className="usage__row">
                <b>{t(`사진 ${usage.photos}장`, `写真 ${usage.photos}枚`)} · {t(`기록 ${usage.count}곳`, `記録 ${usage.count}件`)}</b>
                <span>{fmtBytes(usage.total)} <em>/ 1 GB</em></span>
              </div>
              <div className="usage__bar">
                <span className={'usage__fill usage__fill--' + usage.level} style={{ width: `${Math.min(100, Math.max(1.5, usage.freePct * 100))}%` }} />
              </div>
              <p className="usage__note">
                {t(`무료 저장 한도의 약 ${fmtPct(usage.freePct)}를 쓰고 있어요.`, `無料ストレージの約 ${fmtPct(usage.freePct)} を使用中です。`)}
                {' '}
                {usage.nearFree
                  ? t('한도에 가까워요 — 오래된 사진을 정리해보세요.', '上限に近づいています — 古い写真を整理しましょう。')
                  : t('아직 아주 넉넉해서 요금 걱정은 없어요.', 'まだ十分に余裕があり、料金の心配はありません。')}
              </p>

              {usage.largest && (
                <div className="usage__doc">
                  <div className="usage__row usage__row--sm">
                    <span>{t('가장 큰 기록', '最大の記録')}: <b>{usage.largest.name}</b></span>
                    <span>{fmtBytes(usage.largestSize)} <em>/ 1 MB</em></span>
                  </div>
                  <div className="usage__bar usage__bar--sm">
                    <span className={'usage__fill usage__fill--' + (usage.nearDoc ? 'danger' : usage.largestPct >= 0.5 ? 'warn' : 'ok')} style={{ width: `${Math.min(100, Math.max(2, usage.largestPct * 100))}%` }} />
                  </div>
                  {usage.nearDoc && (
                    <p className="usage__warn">⚠️ {t('이 기록은 사진이 많아 한 기록 한도(1MB)에 곧 닿아요. 사진을 줄이거나 새 기록으로 나눠주세요.', 'この記録は写真が多く、1記録の上限(1MB)に近づいています。写真を減らすか、記録を分けてください。')}</p>
                  )}
                </div>
              )}

              <p className="hint-sm">
                {t('사진은 Firebase(Firestore)에 저장돼요. 위 숫자는 앱이 계산한 추정치이고, 실제 요금 초과 여부는 설정해둔 예산 알림 메일이 정확해요.', '写真は Firebase(Firestore) に保存されます。上の数値はアプリの推定値で、実際の超過はメールの予算アラートが正確です。')}
              </p>
            </div>
          </div>
        )}

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
