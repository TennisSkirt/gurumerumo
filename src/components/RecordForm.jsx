import { useState } from 'react'
import LocationPicker from './LocationPicker.jsx'
import StarRating from './StarRating.jsx'
import { CatIcon, MemberAvatar } from './Icon.jsx'
import { CATEGORIES } from '../lib/categories.js'
import { compressImage } from '../lib/image.js'
import { usePlaces } from '../store/PlacesContext.jsx'

function todayStr() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function RecordForm({ onDone }) {
  const { addPlace, me, members, t, lang } = usePlaces()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('food')
  const [rating, setRating] = useState(0)
  const [coords, setCoords] = useState(null)
  const [photos, setPhotos] = useState([])
  const [visitedAt, setVisitedAt] = useState(todayStr())
  const [memo, setMemo] = useState('')
  const [participants, setParticipants] = useState(() => (me ? [me] : (members[0] ? [members[0].id] : [])))
  const [saving, setSaving] = useState(false)

  const pick = (lat, lng) => setCoords({ lat, lng })
  const toggleWho = (id) =>
    setParticipants((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const onPhotos = async (e) => {
    const files = [...(e.target.files || [])]
    if (!files.length) return
    try {
      const imgs = await Promise.all(files.map((f) => compressImage(f)))
      setPhotos((prev) => [...prev, ...imgs].slice(0, 10))
    } catch { alert(t('사진을 불러오지 못했어요.', '写真を読み込めませんでした。')) }
    e.target.value = ''
  }
  const removePhoto = (i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))

  const canSave = name.trim() && coords && participants.length > 0 && !saving

  const submit = async (e) => {
    e.preventDefault()
    if (!canSave) {
      if (!coords) alert(t('위치를 검색하거나 지도에서 찍어주세요.', '場所を検索するか、地図をタップして指定してください。'))
      else if (participants.length === 0) alert(t('누가 갔는지 한 명 이상 골라주세요.', '誰が行ったか、1人以上選んでください。'))
      return
    }
    setSaving(true)
    try {
      await addPlace({ name: name.trim(), category, rating, lat: coords.lat, lng: coords.lng, photos, visitedAt, memo: memo.trim(), participants })
      onDone?.()
    } catch (err) {
      console.error(err); alert(t('저장 중 문제가 생겼어요.', '保存中に問題が発生しました。')); setSaving(false)
    }
  }

  return (
    <form className="record" onSubmit={submit}>
      <h2 className="screen-title">{t('새 장소 기록', '新しい場所を記録')}</h2>

      <label className="field">
        <span>{t('장소 이름', '場所の名前')} *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('예: 연남동 김밥천국', '例: 道頓堀 たこ焼き')} />
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
        <LocationPicker coords={coords} onPick={pick} onName={(n) => !name && setName(n)} />
        {coords && (
          <div className="coords-ok">✓ {t('위치 지정됨', '場所を指定しました')} ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})</div>
        )}
      </div>

      <div className="field">
        <span>{t('별점', '評価')}</span>
        <StarRating value={rating} onChange={setRating} size={40} />
      </div>

      <div className="field">
        <span>{t('사진', '写真')} <em className="hint-inline">{t('여러 장 가능', '複数枚OK')}</em></span>
        <input type="file" accept="image/*" multiple onChange={onPhotos} />
        {photos.length > 0 && (
          <div className="photo-grid">
            {photos.map((p, i) => (
              <div key={i} className="photo-thumb">
                <img src={p} alt="" />
                <button type="button" className="photo-x" onClick={() => removePhoto(i)} aria-label={t('삭제', '削除')}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="field">
        <span>{t('방문일', '訪問日')}</span>
        <input type="date" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} />
      </label>

      <div className="field">
        <span>{t('누가 갔나요?', '誰が行きましたか？')} <em className="hint-inline">{t('같이 가면 둘 다 선택', '一緒なら両方選択')}</em></span>
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
        <span>{t('한줄 메모', 'ひとことメモ')}</span>
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3}
          placeholder={t('맛·분위기·다음에 또 올지…', '味・雰囲気・また来たいか…')} />
      </label>

      <button className="save-btn" type="submit" disabled={!canSave}>
        {saving ? t('저장 중…', '保存中…') : t('이 장소 기록하기', 'この場所を記録する')}
      </button>
    </form>
  )
}
