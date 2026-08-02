import { useMemo } from 'react'
import { CATEGORIES, categoryOf } from '../lib/categories.js'
import { visitsOf } from '../lib/places.js'
import { usePlaces } from '../store/PlacesContext.jsx'

export default function FamilyPage({ onSelect, onOpenSettings }) {
  const { places, me, setMe, members, resolveMember, cloud, familyCode } = usePlaces()

  const stats = useMemo(() => {
    const byCat = {}
    const byMember = {}
    let best = null // { place, rating } — 가장 높은 별점의 방문
    let totalVisits = 0
    for (const p of places) {
      byCat[p.category] = (byCat[p.category] || 0) + 1
      for (const v of visitsOf(p)) {
        totalVisits++
        if (v.author) byMember[v.author] = (byMember[v.author] || 0) + 1
        if (v.rating && (!best || v.rating > best.rating)) best = { place: p, rating: v.rating }
      }
    }
    const ranking = Object.entries(byMember)
      .map(([id, n]) => ({ id, n }))
      .sort((a, b) => b.n - a.n)
    return { byCat, ranking, best, total: places.length, totalVisits }
  }, [places])

  return (
    <div className="family">
      <h2 className="screen-title">👨‍👩‍👧 우리 가족</h2>

      <section className="panel">
        <div className="panel__title">나는 누구?</div>
        <div className="chips">
          {members.map((m) => (
            <button
              key={m.id}
              className={'chip' + (me === m.id ? ' on' : '')}
              onClick={() => setMe(m.id)}
            >
              <span className="chip__emoji">{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
        <p className="hint-sm">
          기록할 때 기본으로 이 사람이 선택돼요.{' '}
          <button className="link-btn" onClick={onOpenSettings}>구성원 추가·편집 ⚙️</button>
        </p>
      </section>

      <section className="panel">
        <div className="panel__title">한눈에 보기</div>
        <div className="stat-grid">
          <div className="stat"><b>{stats.total}</b><span>기록한 장소</span></div>
          <div className="stat"><b>{stats.totalVisits}</b><span>총 방문</span></div>
          <div className="stat"><b>{stats.ranking.length}</b><span>참여 가족</span></div>
        </div>
      </section>

      {stats.best && (
        <section className="panel">
          <div className="panel__title">⭐ 우리 가족 최애</div>
          <button className="fav" onClick={() => onSelect(stats.best.place)}>
            <span className="fav__emoji">{categoryOf(stats.best.place.category).emoji}</span>
            <span className="fav__name">{stats.best.place.name}</span>
            <span className="fav__star">{'★'.repeat(stats.best.rating)}</span>
          </button>
        </section>
      )}

      {stats.total > 0 && (
        <section className="panel">
          <div className="panel__title">카테고리별</div>
          <ul className="bars">
            {CATEGORIES.filter((c) => stats.byCat[c.id]).map((c) => {
              const n = stats.byCat[c.id]
              const pct = Math.round((n / stats.total) * 100)
              return (
                <li key={c.id}>
                  <span className="bars__label">{c.emoji} {c.label}</span>
                  <span className="bars__track"><span className="bars__fill" style={{ width: pct + '%', background: c.color }} /></span>
                  <span className="bars__n">{n}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {stats.ranking.length > 0 && (
        <section className="panel">
          <div className="panel__title">🏆 기록 랭킹</div>
          <ol className="ranking">
            {stats.ranking.map((r, i) => {
              const m = resolveMember(r.id)
              return (
                <li key={r.id}>
                  <span className="ranking__medal">{['🥇', '🥈', '🥉'][i] || `${i + 1}`}</span>
                  <span className="ranking__who">{m.emoji} {m.label}</span>
                  <span className="ranking__n">{r.n}곳</span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="panel">
        <div className="panel__title">가족 공유</div>
        {cloud ? (
          <p className="hint-sm">
            가족 코드 <b className="code">{familyCode}</b> 로 연결됨. 가족에게 이 코드를 알려주면 같은 지도를 봐요.
            연결 해제·구성원 관리는 <button className="link-btn" onClick={onOpenSettings}>설정 ⚙️</button> 에서.
          </p>
        ) : (
          <p className="hint-sm">지금은 <b>이 기기에만</b> 저장돼요. Firebase를 연결하면 가족이 실시간으로 같은 지도를 볼 수 있어요.</p>
        )}
      </section>
    </div>
  )
}
