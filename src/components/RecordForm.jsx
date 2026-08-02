import { useState } from 'react'
import LocationPicker from './LocationPicker.jsx'
import StarRating from './StarRating.jsx'
import { CATEGORIES } from '../lib/categories.js'
import { MEMBERS, memberOf } from '../lib/members.js'
import { compressImage } from '../lib/image.js'
import { usePlaces } from '../store/PlacesContext.jsx'

function todayStr() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function RecordForm({ onDone }) {
  const { addPlace, me } = usePlaces()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('food')
  const [rating, setRating] = useState(0)
  const [coords, setCoords] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [visitedAt, setVisitedAt] = useState(todayStr())
  const [memo, setMemo] = useState('')
  const [author, setAuthor] = useState(me || MEMBERS[0].id)
  const [saving, setSaving] = useState(false)

  const pick = (lat, lng) => setCoords({ lat, lng })

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setPhoto(await compressImage(file))
    } catch {
      alert('사진을 불러오지 못했어요.')
    }
  }

  const canSave = name.trim() && coords && !saving

  const submit = async (e) => {
    e.preventDefault()
    if (!canSave) {
      if (!coords) alert('위치를 검색하거나 지도에서 찍어주세요.')
      return
    }
    setSaving(true)
    try {
      await addPlace({
        name: name.trim(),
        category,
        rating,
        lat: coords.lat,
        lng: coords.lng,
        photo: photo || null,
        visitedAt,
        memo: memo.trim(),
        author,
      })
      onDone?.()
    } catch (err) {
      console.error(err)
      alert('저장 중 문제가 생겼어요.')
      setSaving(false)
    }
  }

  return (
    <form className="record" onSubmit={submit}>
      <h2 className="screen-title">➕ 새 장소 기록</h2>

      <label className="field">
        <span>장소 이름 *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 연남동 김밥천국" />
      </label>

      <div className="field">
        <span>카테고리</span>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              className={'chip' + (category === c.id ? ' on' : '')}
              style={category === c.id ? { '--chip': c.color } : undefined}
              onClick={() => setCategory(c.id)}
            >
              <span className="chip__emoji">{c.emoji}</span>{c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>위치 * (검색하거나 지도를 눌러 찍기)</span>
        <LocationPicker coords={coords} onPick={pick} onName={(n) => !name && setName(n)} />
        {coords && (
          <div className="coords-ok">✓ 위치 지정됨 ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})</div>
        )}
      </div>

      <div className="field">
        <span>별점</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <label className="field">
        <span>사진</span>
        <input type="file" accept="image/*" onChange={onPhoto} />
        {photo && <img className="photo-preview" src={photo} alt="미리보기" />}
      </label>

      <label className="field">
        <span>방문일</span>
        <input type="date" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} />
      </label>

      <div className="field">
        <span>누가 기록하나요?</span>
        <div className="chips">
          {MEMBERS.map((m) => (
            <button
              type="button"
              key={m.id}
              className={'chip' + (author === m.id ? ' on' : '')}
              onClick={() => setAuthor(m.id)}
            >
              <span className="chip__emoji">{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>한줄 메모</span>
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder="맛·분위기·다음에 또 올지…" />
      </label>

      <button className="save-btn" type="submit" disabled={!canSave}>
        {saving ? '저장 중…' : `${memberOf(author).emoji} 이 장소 기록하기`}
      </button>
    </form>
  )
}
