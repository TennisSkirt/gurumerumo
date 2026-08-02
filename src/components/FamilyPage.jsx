import { useMemo } from 'react'
import { CATEGORIES, categoryOf } from '../lib/categories.js'
import { MEMBERS, memberOf } from '../lib/members.js'
import { usePlaces } from '../store/PlacesContext.jsx'

export default function FamilyPage({ onSelect }) {
  const { places, me, setMe, cloud, familyCode, leaveFamily } = usePlaces()

  const stats = useMemo(() => {
    const byCat = {}
    const byMember = {}
    let rated = null
    for (const p of places) {
      byCat[p.category] = (byCat[p.category] || 0) + 1
      byMember[p.author] = (byMember[p.author] || 0) + 1
      if (p.rating && (!rated || p.rating > rated.rating)) rated = p
    }
    const ranking = Object.entries(byMember)
      .map(([id, n]) => ({ id, n }))
      .sort((a, b) => b.n - a.n)
    return { byCat, ranking, rated, total: places.length }
  }, [places])

  return (
    <div className="family">
      <h2 className="screen-title">👨‍👩‍👧 우리 가족</h2>

      <section className="panel">
        <div className="panel__title">나는 누구?</div>
        <div className="chips">
          {MEMBERS.map((m) => (
            <button
              key={m.id}
              className={'chip' + (me === m.id ? ' on' : '')}
              onClick={() => setMe(m.id)}
            >
              <span className="chip__emoji">{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
        <p className="hint-sm">기록할 때 기본으로 이 사람이 선택돼요.</p>
      </section>

      <section className="panel">
        <div className="panel__title">한눈에 보기</div>
        <div className="stat-grid">
          <div className="stat"><b>{stats.total}</b><span>기록한 장소</span></div>
          <div className="stat"><b>{Object.keys(stats.byCat).length}</b><span>카테고리</span></div>
          <div className="stat"><b>{stats.ranking.length}</b><span>참여 가족</span></div>
        </div>
      </section>

      {stats.rated && (
        <section className="panel">
          <div className="panel__title">⭐ 우리 가족 최애</div>
          <button className="fav" onClick={() => onSelect(stats.rated)}>
            <span className="fav__emoji">{categoryOf(stats.rated.category).emoji}</span>
            <span className="fav__name">{stats.rated.name}</span>
            <span className="fav__star">{'★'.repeat(stats.rated.rating)}</span>
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
              const m = memberOf(r.id)
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
          <>
            <p className="hint-sm">가족 코드 <b className="code">{familyCode}</b> 로 연결됨. 가족에게 이 코드를 알려주면 같은 지도를 봐요.</p>
            <button className="ghost" onClick={leaveFamily}>연결 해제</button>
          </>
        ) : (
          <p className="hint-sm">지금은 <b>이 기기에만</b> 저장돼요. Firebase를 연결하면 가족이 실시간으로 같은 지도를 볼 수 있어요.</p>
        )}
      </section>
    </div>
  )
}
