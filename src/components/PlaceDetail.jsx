import { useState } from 'react'
import { categoryOf } from '../lib/categories.js'
import { sortedVisits, participantsOf } from '../lib/places.js'
import { compressImage } from '../lib/image.js'
import { CatIcon, MemberAvatar, UiIcon } from './Icon.jsx'
import StarRating from './StarRating.jsx'
import { usePlaces } from '../store/PlacesContext.jsx'

function todayStr() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 재방문 기록 폼
function VisitForm({ place, onDone, onCancel }) {
  const { addVisit, me, members } = usePlaces()
  const [rating, setRating] = useState(0)
  const [photo, setPhoto] = useState(null)
  const [visitedAt, setVisitedAt] = useState(todayStr())
  const [memo, setMemo] = useState('')
  const [participants, setParticipants] = useState(() => (me ? [me] : (members[0] ? [members[0].id] : [])))
  const [saving, setSaving] = useState(false)

  const toggleWho = (id) =>
    setParticipants((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { setPhoto(await compressImage(file)) } catch { alert('사진을 불러오지 못했어요.') }
  }

  const submit = async () => {
    if (participants.length === 0) { alert('누가 갔는지 골라주세요.'); return }
    setSaving(true)
    try {
      await addVisit(place, { rating, photo, visitedAt, memo: memo.trim(), participants })
      onDone()
    } catch (e) {
      console.error(e); alert('저장 중 문제가 생겼어요.'); setSaving(false)
    }
  }

  return (
    <div className="visit-form">
      <label className="field">
        <span>방문일</span>
        <input type="date" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} />
      </label>
      <div className="field">
        <span>별점</span>
        <StarRating value={rating} onChange={setRating} size={40} />
      </div>
      <label className="field">
        <span>사진</span>
        <input type="file" accept="image/*" onChange={onPhoto} />
        {photo && <img className="photo-preview" src={photo} alt="미리보기" />}
      </label>
      <div className="field">
        <span>누가 갔나요? <em className="hint-inline">같이 가면 둘 다</em></span>
        <div className="chips">
          {members.map((mm) => (
            <button type="button" key={mm.id}
              className={'chip chip--who' + (participants.includes(mm.id) ? ' on' : '')}
              onClick={() => toggleWho(mm.id)}>
              <MemberAvatar member={mm} size={24} className="chip__ava" />{mm.label}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>한줄 메모</span>
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} placeholder="이번 방문은 어땠나요?" />
      </label>
      <div className="sheet__actions">
        <button className="ghost" onClick={onCancel}>취소</button>
        <button className="primary" onClick={submit} disabled={saving}>{saving ? '저장 중…' : '방문 기록 추가'}</button>
      </div>
    </div>
  )
}

export default function PlaceDetail({ place, onClose }) {
  const { places, deletePlace, resolveMember } = usePlaces()
  const [adding, setAdding] = useState(false)
  if (!place) return null

  const live = places.find((p) => p.id === place.id) || place
  const c = categoryOf(live.category)
  const visits = sortedVisits(live)
  const cover = visits.find((v) => v.photo)?.photo || null

  const remove = async () => {
    if (!confirm(`"${live.name}" 기록을 통째로 삭제할까요? (방문 ${visits.length}건 모두)`)) return
    await deletePlace(live.id)
    onClose()
  }

  const openInMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${live.lat},${live.lng}`, '_blank')
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grab" />
        {cover && <img className="sheet__photo" src={cover} alt="" />}
        <div className="sheet__head">
          <h3>{live.name}</h3>
          <span className="card__cat" style={{ background: c.color }}><CatIcon category={c.id} size={15} /> {c.label}</span>
        </div>

        <div className="visit-hd">
          <b>방문 이력 {visits.length > 1 && <span className="count">{visits.length}</span>}</b>
          {!adding && <button className="add-member" onClick={() => setAdding(true)}>＋ 재방문 기록</button>}
        </div>

        {adding && (
          <VisitForm place={live} onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />
        )}

        <ul className="visits">
          {visits.map((v, i) => {
            const who = participantsOf(v).map((id) => resolveMember(id))
            return (
              <li key={i} className="visit">
                {v.photo && <img className="visit__photo" src={v.photo} alt="" />}
                <div className="visit__body">
                  <div className="visit__top">
                    {v.rating > 0 ? <StarRating value={v.rating} readOnly size={16} /> : <span className="visit__norate">별점 없음</span>}
                    <span className="visit__date">{v.visitedAt || ''}</span>
                  </div>
                  {v.memo && <p className="visit__memo">{v.memo}</p>}
                  <div className="visit__who">
                    {who.map((m, j) => <MemberAvatar key={j} member={m} size={18} />)}
                    <span>{who.map((m) => m.label).join('·')}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="sheet__actions">
          <button className="ghost" onClick={openInMaps}><UiIcon name="compass" size={16} /> 지도앱에서 열기</button>
          <button className="danger" onClick={remove}><UiIcon name="trash" size={16} /> 삭제</button>
        </div>
        <button className="sheet__close" onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
