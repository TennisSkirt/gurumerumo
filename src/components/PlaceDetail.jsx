import { categoryOf } from '../lib/categories.js'
import StarRating from './StarRating.jsx'
import { usePlaces } from '../store/PlacesContext.jsx'

// 장소 상세 바텀시트
export default function PlaceDetail({ place, onClose }) {
  const { deletePlace, resolveMember } = usePlaces()
  if (!place) return null
  const c = categoryOf(place.category)
  const m = resolveMember(place.author)

  const remove = async () => {
    if (!confirm(`"${place.name}" 기록을 삭제할까요?`)) return
    await deletePlace(place.id)
    onClose()
  }

  const openInMaps = () => {
    // OSM 지도로 열기(외부). 원하면 나중에 카카오/구글 링크로 교체 가능.
    window.open(`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`, '_blank')
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grab" />
        {place.photo && <img className="sheet__photo" src={place.photo} alt="" />}
        <div className="sheet__head">
          <h3>{place.name}</h3>
          <span className="card__cat" style={{ background: c.color }}>{c.emoji} {c.label}</span>
        </div>
        {place.rating > 0 && <StarRating value={place.rating} readOnly size={20} />}
        {place.memo && <p className="sheet__memo">{place.memo}</p>}
        <div className="sheet__meta">
          <span>{m.emoji} {m.label} 기록</span>
          {place.visitedAt && <span>📅 {place.visitedAt}</span>}
        </div>
        <div className="sheet__actions">
          <button className="ghost" onClick={openInMaps}>🧭 지도앱에서 열기</button>
          <button className="danger" onClick={remove}>🗑 삭제</button>
        </div>
        <button className="sheet__close" onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
