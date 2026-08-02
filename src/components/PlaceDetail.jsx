import { useState } from 'react'
import { CATEGORIES, categoryOf } from '../lib/categories.js'
import { sortedVisits, participantsOf, visitPhotos } from '../lib/places.js'
import { compressImage } from '../lib/image.js'
import { CatIcon, MemberAvatar, UiIcon } from './Icon.jsx'
import StarRating from './StarRating.jsx'
import { usePlaces } from '../store/PlacesContext.jsx'

function todayStr() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 방문 기록 폼 (추가 겸 수정) — initial 있으면 수정 모드
function VisitForm({ place, initial, onDone, onCancel }) {
  const { addVisit, updateVisit, me, members } = usePlaces()
  const [rating, setRating] = useState(initial?.rating || 0)
  const [photos, setPhotos] = useState(initial ? visitPhotos(initial) : [])
  const [visitedAt, setVisitedAt] = useState(initial?.visitedAt || todayStr())
  const [memo, setMemo] = useState(initial?.memo || '')
  const [participants, setParticipants] = useState(
    () => (initial ? participantsOf(initial) : (me ? [me] : (members[0] ? [members[0].id] : []))),
  )
  const [saving, setSaving] = useState(false)

  const toggleWho = (id) =>
    setParticipants((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const onPhotos = async (e) => {
    const files = [...(e.target.files || [])]
    if (!files.length) return
    try {
      const imgs = await Promise.all(files.map((f) => compressImage(f)))
      setPhotos((prev) => [...prev, ...imgs].slice(0, 10))
    } catch { alert('사진을 불러오지 못했어요.') }
    e.target.value = ''
  }
  const removePhoto = (i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))

  const submit = async () => {
    if (participants.length === 0) { alert('누가 갔는지 골라주세요.'); return }
    setSaving(true)
    try {
      const data = { rating, photos, visitedAt, memo: memo.trim(), participants }
      if (initial) await updateVisit(place, initial.createdAt, data)
      else await addVisit(place, data)
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
      <div className="field">
        <span>사진 <em className="hint-inline">여러 장 가능</em></span>
        <input type="file" accept="image/*" multiple onChange={onPhotos} />
        {photos.length > 0 && (
          <div className="photo-grid">
            {photos.map((p, i) => (
              <div key={i} className="photo-thumb">
                <img src={p} alt="" />
                <button type="button" className="photo-x" onClick={() => removePhoto(i)} aria-label="삭제">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
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
        <button className="primary" onClick={submit} disabled={saving}>
          {saving ? '저장 중…' : (initial ? '수정 저장' : '방문 기록 추가')}
        </button>
      </div>
    </div>
  )
}

// 장소(이름·카테고리) 수정 폼
function PlaceEditForm({ place, onDone, onCancel }) {
  const { updatePlace } = usePlaces()
  const [name, setName] = useState(place.name)
  const [category, setCategory] = useState(place.category)
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!name.trim()) { alert('이름을 입력해주세요.'); return }
    setSaving(true)
    try { await updatePlace(place.id, { name: name.trim(), category }); onDone() }
    catch (e) { console.error(e); alert('저장 중 문제가 생겼어요.'); setSaving(false) }
  }
  return (
    <div className="visit-form">
      <label className="field">
        <span>장소 이름</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="field">
        <span>카테고리</span>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.id}
              className={'chip' + (category === c.id ? ' on' : '')}
              style={category === c.id ? { '--chip': c.color } : undefined}
              onClick={() => setCategory(c.id)}>
              <CatIcon category={c.id} size={20} className="chip__ic" />{c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="sheet__actions">
        <button className="ghost" onClick={onCancel}>취소</button>
        <button className="primary" onClick={save} disabled={saving}>{saving ? '저장 중…' : '수정 저장'}</button>
      </div>
    </div>
  )
}

// 코멘트 작성 폼
function CommentForm({ place, onDone }) {
  const { addComment, me, members } = usePlaces()
  const [message, setMessage] = useState('')
  const [photo, setPhoto] = useState(null)
  const [author, setAuthor] = useState(me || members[0]?.id)
  const [saving, setSaving] = useState(false)
  const onPhoto = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    try { setPhoto(await compressImage(f)) } catch { alert('사진을 불러오지 못했어요.') }
  }
  const submit = async () => {
    if (!message.trim() && !photo) { alert('메시지나 사진을 남겨주세요.'); return }
    setSaving(true)
    try { await addComment(place, { author, message: message.trim(), photo }); setMessage(''); setPhoto(null); setSaving(false); onDone?.() }
    catch (e) { console.error(e); alert('저장 중 문제가 생겼어요.'); setSaving(false) }
  }
  return (
    <div className="comment-form">
      <div className="chips">
        {members.map((m) => (
          <button type="button" key={m.id}
            className={'chip' + (author === m.id ? ' on' : '')}
            onClick={() => setAuthor(m.id)}>
            <MemberAvatar member={m} size={22} className="chip__ava" />{m.label}
          </button>
        ))}
      </div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="코멘트를 남겨보세요 :)" />
      {photo && <div className="photo-grid"><div className="photo-thumb"><img src={photo} alt="" /><button type="button" className="photo-x" onClick={() => setPhoto(null)}>×</button></div></div>}
      <div className="comment-form__row">
        <label className="mini-file">📷 사진<input type="file" accept="image/*" onChange={onPhoto} hidden /></label>
        <button className="primary" onClick={submit} disabled={saving}>{saving ? '…' : '남기기'}</button>
      </div>
    </div>
  )
}

export default function PlaceDetail({ place, onClose }) {
  const { places, deletePlace, deleteVisit, deleteComment, resolveMember } = usePlaces()
  const [adding, setAdding] = useState(false)
  const [editingPlace, setEditingPlace] = useState(false)
  const [editVisit, setEditVisit] = useState(null) // createdAt of visit being edited
  if (!place) return null

  const live = places.find((p) => p.id === place.id) || place
  const c = categoryOf(live.category)
  const visits = sortedVisits(live)
  const cover = visits.flatMap((v) => visitPhotos(v))[0] || null
  const comments = [...(live.comments || [])].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))

  const remove = async () => {
    if (!confirm(`"${live.name}" 기록을 통째로 삭제할까요? (방문 ${visits.length}건 모두)`)) return
    await deletePlace(live.id)
    onClose()
  }
  const removeVisit = async (v) => {
    if (visits.length <= 1) { alert('마지막 방문은 삭제할 수 없어요. 장소를 삭제하려면 아래 🗑 삭제를 눌러주세요.'); return }
    if (!confirm('이 방문 기록을 삭제할까요?')) return
    await deleteVisit(live, v.createdAt)
  }
  const openInMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${live.lat},${live.lng}`, '_blank')
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grab" />
        {cover && <img className="sheet__photo" src={cover} alt="" />}

        {editingPlace ? (
          <PlaceEditForm place={live} onDone={() => setEditingPlace(false)} onCancel={() => setEditingPlace(false)} />
        ) : (
          <div className="sheet__head">
            <h3>{live.name}</h3>
            <span className="card__cat" style={{ background: c.color }}><CatIcon category={c.id} size={15} /> {c.label}</span>
            <button className="icon-btn" onClick={() => setEditingPlace(true)} title="이름·카테고리 수정" aria-label="수정">✏️</button>
          </div>
        )}

        <div className="visit-hd">
          <b>방문 이력 {visits.length > 1 && <span className="count">{visits.length}</span>}</b>
          {!adding && <button className="add-member" onClick={() => setAdding(true)}>＋ 재방문 기록</button>}
        </div>

        {adding && <VisitForm place={live} onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />}

        <ul className="visits">
          {visits.map((v) => {
            const who = participantsOf(v).map((id) => resolveMember(id))
            const ps = visitPhotos(v)
            const isEdit = editVisit === v.createdAt
            if (isEdit) {
              return (
                <li key={v.createdAt} className="visit visit--editing">
                  <VisitForm place={live} initial={v} onDone={() => setEditVisit(null)} onCancel={() => setEditVisit(null)} />
                </li>
              )
            }
            return (
              <li key={v.createdAt} className="visit">
                <div className="visit__body">
                  <div className="visit__top">
                    {v.rating > 0 ? <StarRating value={v.rating} readOnly size={16} /> : <span className="visit__norate">별점 없음</span>}
                    <span className="visit__date">{v.visitedAt || ''}</span>
                  </div>
                  {ps.length > 0 && (
                    <div className="visit__photos">
                      {ps.map((p, j) => <img key={j} src={p} alt="" />)}
                    </div>
                  )}
                  {v.memo && <p className="visit__memo">{v.memo}</p>}
                  <div className="visit__foot">
                    <span className="visit__who">
                      {who.map((m, j) => <MemberAvatar key={j} member={m} size={18} />)}
                      <span>{who.map((m) => m.label).join('·')}</span>
                    </span>
                    <span className="visit__acts">
                      <button className="link-btn" onClick={() => setEditVisit(v.createdAt)}>수정</button>
                      {visits.length > 1 && <button className="link-btn danger-link" onClick={() => removeVisit(v)}>삭제</button>}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="comments-hd"><b>💬 코멘트 {comments.length > 0 && <span className="count">{comments.length}</span>}</b></div>
        <ul className="comments">
          {comments.map((cm) => {
            const m = resolveMember(cm.author)
            return (
              <li key={cm.id} className="comment">
                <MemberAvatar member={m} size={30} />
                <div className="comment__body">
                  <div className="comment__top"><b>{m.label}</b><button className="comment__x" onClick={() => deleteComment(live, cm.id)} aria-label="삭제">×</button></div>
                  {cm.message && <p className="comment__msg">{cm.message}</p>}
                  {cm.photo && <img className="comment__photo" src={cm.photo} alt="" />}
                </div>
              </li>
            )
          })}
        </ul>
        <CommentForm place={live} />

        <div className="sheet__actions">
          <button className="ghost" onClick={openInMaps}><UiIcon name="compass" size={16} /> 지도앱에서 열기</button>
          <button className="danger" onClick={remove}><UiIcon name="trash" size={16} /> 삭제</button>
        </div>
        <button className="sheet__close" onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
