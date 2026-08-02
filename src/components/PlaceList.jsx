import { useMemo, useState } from 'react'
import { CATEGORIES, categoryOf } from '../lib/categories.js'
import { latestVisit, latestRating, placePhoto, visitCount, participantsOf } from '../lib/places.js'
import { CatIcon, MemberAvatar, UiIcon } from './Icon.jsx'
import StarRating from './StarRating.jsx'
import { characterSrc } from '../lib/asset.js'
import { usePlaces } from '../store/PlacesContext.jsx'

export default function PlaceList({ onSelect }) {
  const { places, resolveMember, t } = usePlaces()
  const [cat, setCat] = useState('all')
  const [minStar, setMinStar] = useState(0)

  const filtered = useMemo(() => {
    return places
      .filter((p) => (cat === 'all' ? true : p.category === cat))
      .filter((p) => latestRating(p) >= minStar)
  }, [places, cat, minStar])

  return (
    <div className="list">
      <div className="list-mascot"><img src={characterSrc('wife')} alt="" /></div>
      <h2 className="screen-title">{t('우리가족 기록', '家族の記録')} {places.length > 0 && <span className="count">{places.length}</span>}</h2>

      <div className="filters">
        <div className="chips">
          <button className={'chip' + (cat === 'all' ? ' on' : '')} onClick={() => setCat('all')}>{t('전체', 'すべて')}</button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={'chip' + (cat === c.id ? ' on' : '')}
              style={cat === c.id ? { '--chip': c.color } : undefined}
              onClick={() => setCat(c.id)}
            >
              <CatIcon category={c.id} size={20} className="chip__ic" />{t(c.label, c.ja)}
            </button>
          ))}
        </div>
        <label className="minstar">
          {t('별점', '評価')} <select value={minStar} onChange={(e) => setMinStar(Number(e.target.value))}>
            <option value={0}>{t('전체', 'すべて')}</option>
            <option value={3}>{t('3★ 이상', '3★以上')}</option>
            <option value={4}>{t('4★ 이상', '4★以上')}</option>
            <option value={5}>{t('5★만', '5★のみ')}</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-note">{t('조건에 맞는 장소가 없어요.', '条件に合う場所がありません。')}</div>
      ) : (
        <ul className="cards">
          {filtered.map((p) => {
            const c = categoryOf(p.category)
            const lv = latestVisit(p)
            const who = participantsOf(lv).map((id) => resolveMember(id))
            const photo = placePhoto(p)
            const visits = visitCount(p)
            return (
              <li key={p.id}>
                <button className="card" onClick={() => onSelect(p)}>
                  {photo ? (
                    <img className="card__thumb" src={photo} alt="" />
                  ) : (
                    <div className="card__thumb card__thumb--ph" style={{ background: c.color + '22' }}>
                      <CatIcon category={c.id} size={44} />
                    </div>
                  )}
                  <div className="card__body">
                    <div className="card__top">
                      <b className="card__name">{p.name}</b>
                      <span className="card__cat" style={{ background: c.color }}><CatIcon category={c.id} size={14} /> {t(c.label, c.ja)}</span>
                    </div>
                    {lv.rating > 0 && <StarRating value={lv.rating} readOnly size={15} />}
                    {lv.memo && <p className="card__memo">{lv.memo}</p>}
                    <div className="card__meta">
                      <span className="who-inline">
                        {who.map((m, i) => <MemberAvatar key={i} member={m} size={18} />)}
                        {who.map((m) => m.label).join('·')}
                      </span>
                      {lv.visitedAt && <span>· {lv.visitedAt}</span>}
                      {visits > 1 && <span className="visit-badge"><UiIcon name="revisit" size={13} /> {t(`${visits}번`, `${visits}回`)}</span>}
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
