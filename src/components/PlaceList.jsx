import { useMemo, useState } from 'react'
import { CATEGORIES, categoryOf } from '../lib/categories.js'
import StarRating from './StarRating.jsx'
import { usePlaces } from '../store/PlacesContext.jsx'

export default function PlaceList({ onSelect }) {
  const { places, resolveMember } = usePlaces()
  const [cat, setCat] = useState('all')
  const [minStar, setMinStar] = useState(0)

  const filtered = useMemo(() => {
    return places
      .filter((p) => (cat === 'all' ? true : p.category === cat))
      .filter((p) => (p.rating || 0) >= minStar)
  }, [places, cat, minStar])

  return (
    <div className="list">
      <h2 className="screen-title">📋 우리 가족 장소 {places.length > 0 && <span className="count">{places.length}</span>}</h2>

      <div className="filters">
        <div className="chips">
          <button className={'chip' + (cat === 'all' ? ' on' : '')} onClick={() => setCat('all')}>전체</button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={'chip' + (cat === c.id ? ' on' : '')}
              style={cat === c.id ? { '--chip': c.color } : undefined}
              onClick={() => setCat(c.id)}
            >
              <span className="chip__emoji">{c.emoji}</span>{c.label}
            </button>
          ))}
        </div>
        <label className="minstar">
          별점 <select value={minStar} onChange={(e) => setMinStar(Number(e.target.value))}>
            <option value={0}>전체</option>
            <option value={3}>3★ 이상</option>
            <option value={4}>4★ 이상</option>
            <option value={5}>5★만</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-note">조건에 맞는 장소가 없어요.</div>
      ) : (
        <ul className="cards">
          {filtered.map((p) => {
            const c = categoryOf(p.category)
            const m = resolveMember(p.author)
            return (
              <li key={p.id}>
                <button className="card" onClick={() => onSelect(p)}>
                  {p.photo ? (
                    <img className="card__thumb" src={p.photo} alt="" />
                  ) : (
                    <div className="card__thumb card__thumb--ph" style={{ background: c.color + '22' }}>
                      <span>{c.emoji}</span>
                    </div>
                  )}
                  <div className="card__body">
                    <div className="card__top">
                      <b className="card__name">{p.name}</b>
                      <span className="card__cat" style={{ background: c.color }}>{c.emoji} {c.label}</span>
                    </div>
                    {p.rating > 0 && <StarRating value={p.rating} readOnly size={15} />}
                    {p.memo && <p className="card__memo">{p.memo}</p>}
                    <div className="card__meta">
                      <span>{m.emoji} {m.label}</span>
                      {p.visitedAt && <span>· {p.visitedAt}</span>}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
