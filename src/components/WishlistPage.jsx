import { useState } from 'react'
import LocationPicker from './LocationPicker.jsx'
import { CatIcon, MemberAvatar } from './Icon.jsx'
import { characterSrc } from '../lib/asset.js'
import { CATEGORIES, categoryOf } from '../lib/categories.js'
import { usePlaces } from '../store/PlacesContext.jsx'

function WishForm({ onDone, onCancel }) {
  const { addWish, me, members, t } = usePlaces()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('food')
  const [coords, setCoords] = useState(null)
  const [memo, setMemo] = useState('')
  const [participants, setParticipants] = useState(() => (me ? [me] : (members[0] ? [members[0].id] : [])))
  const [saving, setSaving] = useState(false)

  const toggleWho = (id) =>
    setParticipants((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submit = async () => {
    if (!name.trim()) { alert(t('가게 이름을 입력해주세요.', 'お店の名前を入力してください。')); return }
    if (!coords) { alert(t('위치를 검색하거나 지도에서 찍어주세요.', '場所を検索するか、地図をタップして指定してください。')); return }
    setSaving(true)
    try {
      await addWish({ name: name.trim(), category, lat: coords.lat, lng: coords.lng, memo: memo.trim(), participants })
      onDone()
    } catch (e) { console.error(e); alert(t('저장 중 문제가 생겼어요.', '保存中に問題が発生しました。')); setSaving(false) }
  }

  return (
    <div className="visit-form">
      <label className="field">
        <span>{t('가게 이름', 'お店の名前')} *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('예: 성수동 베이글', '例: 銀座 寿司')} />
      </label>

      <div className="field">
        <span>{t('카테고리', 'カテゴリー')}</span>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.id}
              className={'chip' + (category === c.id ? ' on' : '')}
              style={category === c.id ? { '--chip': c.color } : undefined}
              onClick={() => setCategory(c.id)}>
              <CatIcon category={c.id} size={20} className="chip__ic" />{t(c.label, c.ja)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>{t('위치', '場所')} * <em className="hint-inline">{t('검색하거나 지도를 눌러 찍기', '検索または地図をタップ')}</em></span>
        <LocationPicker coords={coords} onPick={(lat, lng) => setCoords({ lat, lng })} onName={(n) => !name && setName(n)} />
        {coords && <div className="coords-ok">✓ {t('위치 지정됨', '場所を指定しました')}</div>}
      </div>

      <div className="field">
        <span>{t('누가 가고 싶어?', '誰が行きたい？')} <em className="hint-inline">{t('여러 명 선택 가능', '複数選択OK')}</em></span>
        <div className="chips">
          {members.map((m) => (
            <button type="button" key={m.id}
              className={'chip chip--who' + (participants.includes(m.id) ? ' on' : '')}
              onClick={() => toggleWho(m.id)}>
              <MemberAvatar member={m} size={24} className="chip__ava" />{m.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>{t('메모', 'メモ')} <em className="hint-inline">{t('가고 싶은 이유·먹고 싶은 메뉴 등', '理由・食べたいメニューなど')}</em></span>
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder={t('왜 가고 싶어? 뭐가 유명해?', 'なぜ行きたい？何が有名？')} />
      </label>

      <div className="sheet__actions">
        <button className="ghost" onClick={onCancel}>{t('취소', 'キャンセル')}</button>
        <button className="primary" onClick={submit} disabled={saving}>{saving ? t('저장 중…', '保存中…') : t('담아두기', '追加する')}</button>
      </div>
    </div>
  )
}

export default function WishlistPage() {
  const { wishes, deleteWish, convertWish, resolveMember, t } = usePlaces()
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(null)

  const onGo = async (w) => {
    if (!confirm(t(`"${w.name}"에 다녀왔어요? 방문 기록으로 옮길게요.`, `「${w.name}」に行きましたか？訪問記録に移します。`))) return
    setBusy(w.id)
    try { await convertWish(w) }
    catch (e) { console.error(e); alert(t('전환 중 문제가 생겼어요.', '変換中に問題が発生しました。')) }
    finally { setBusy(null) }
  }
  const onDel = async (w) => {
    if (!confirm(t(`"${w.name}"을(를) 목록에서 지울까요?`, `「${w.name}」を削除しますか？`))) return
    setBusy(w.id)
    try { await deleteWish(w.id) }
    catch (e) { console.error(e); alert(t('삭제 중 문제가 생겼어요.', '削除中に問題が発生しました。')) }
    finally { setBusy(null) }
  }

  return (
    <div className="wishlist">
      <img className="family-hero" src={characterSrc('couple')} alt="" />
      <h2 className="screen-title">{t('가고 싶은 곳', '行きたい場所')} {wishes.length > 0 && <span className="count">{wishes.length}</span>}</h2>

      {!adding && (
        <button className="wish-add-btn" onClick={() => setAdding(true)}>＋ {t('가고 싶은 가게 담기', '行きたいお店を追加')}</button>
      )}
      {adding && <WishForm onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />}

      {wishes.length === 0 && !adding ? (
        <div className="empty-note">{t('아직 담아둔 곳이 없어요.\n가보고 싶은 가게를 담아보세요!', 'まだありません。\n行きたいお店を追加しましょう！')}</div>
      ) : (
        <ul className="wish-list">
          {wishes.map((w) => {
            const c = categoryOf(w.category)
            const who = (w.participants || []).map(resolveMember)
            return (
              <li key={w.id} className={'wish-card' + (busy === w.id ? ' is-busy' : '')}>
                <div className="wish-card__cat" style={{ background: c.color }}><CatIcon category={c.id} size={24} /></div>
                <div className="wish-card__body">
                  <b className="wish-card__name">{w.name}</b>
                  <span className="wish-card__badge" style={{ color: c.color }}>{t(c.label, c.ja)}</span>
                  {w.memo && <p className="wish-card__memo">{w.memo}</p>}
                  {who.length > 0 && (
                    <div className="wish-card__who">
                      {who.map((m, i) => <MemberAvatar key={i} member={m} size={18} />)}
                      <span>{who.map((m) => m.label).join('·')} {t('가고 싶어함', 'が行きたい')}</span>
                    </div>
                  )}
                </div>
                <div className="wish-card__acts">
                  <button className="wish-go" disabled={busy === w.id} onClick={() => onGo(w)}>{t('가봤어요', '行った')}</button>
                  <button className="wish-del" disabled={busy === w.id} onClick={() => onDel(w)} aria-label={t('삭제', '削除')}>×</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
