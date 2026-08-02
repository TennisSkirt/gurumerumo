import { useMemo } from 'react'
import { CATEGORIES, categoryOf } from '../lib/categories.js'
import { visitsOf, participantsOf } from '../lib/places.js'
import { CatIcon, MemberAvatar, UiIcon } from './Icon.jsx'
import { usePlaces } from '../store/PlacesContext.jsx'

export default function FamilyPage({ onSelect, onOpenSettings }) {
  const { places, me, setMe, members, resolveMember, cloud, familyCode, t } = usePlaces()

  const stats = useMemo(() => {
    const byCat = {}
    const byMember = {}
    let best = null
    let totalVisits = 0
    for (const p of places) {
      byCat[p.category] = (byCat[p.category] || 0) + 1
      for (const v of visitsOf(p)) {
        totalVisits++
        for (const pid of participantsOf(v)) byMember[pid] = (byMember[pid] || 0) + 1
        if (v.rating && (!best || v.rating > best.rating)) best = { place: p, rating: v.rating }
      }
    }
    const ranking = Object.entries(byMember).map(([id, n]) => ({ id, n })).sort((a, b) => b.n - a.n)
    return { byCat, ranking, best, total: places.length, totalVisits }
  }, [places])

  return (
    <div className="family">
      <h2 className="screen-title">{t('우리 가족', '家族')}</h2>

      <section className="panel">
        <div className="panel__title">{t('나는 누구?', 'あなたは誰？')}</div>
        <div className="chips">
          {members.map((m) => (
            <button key={m.id} className={'chip' + (me === m.id ? ' on' : '')} onClick={() => setMe(m.id)}>
              <MemberAvatar member={m} size={24} className="chip__ava" />{m.label}
            </button>
          ))}
        </div>
        <p className="hint-sm">
          {t('기록할 때 기본으로 이 사람이 선택돼요.', '記録するとき、この人が既定で選ばれます。')}{' '}
          <button className="link-btn" onClick={onOpenSettings}>{t('구성원 추가·편집', 'メンバー追加・編集')}</button>
        </p>
      </section>

      <section className="panel">
        <div className="panel__title">{t('한눈에 보기', 'ひと目でわかる')}</div>
        <div className="stat-grid">
          <div className="stat"><b>{stats.total}</b><span>{t('기록한 장소', '記録した場所')}</span></div>
          <div className="stat"><b>{stats.totalVisits}</b><span>{t('총 방문', '訪問回数')}</span></div>
          <div className="stat"><b>{stats.ranking.length}</b><span>{t('참여 가족', '参加人数')}</span></div>
        </div>
      </section>

      {stats.best && (
        <section className="panel">
          <div className="panel__title"><UiIcon name="star" size={18} /> {t('우리 가족 최애', '家族のお気に入り')}</div>
          <button className="fav" onClick={() => onSelect(stats.best.place)}>
            <CatIcon category={stats.best.place.category} size={26} className="fav__emoji" />
            <span className="fav__name">{stats.best.place.name}</span>
            <span className="fav__star">{'★'.repeat(stats.best.rating)}</span>
          </button>
        </section>
      )}

      {stats.total > 0 && (
        <section className="panel">
          <div className="panel__title">{t('카테고리별', 'カテゴリー別')}</div>
          <ul className="bars">
            {CATEGORIES.filter((c) => stats.byCat[c.id]).map((c) => {
              const n = stats.byCat[c.id]
              const pct = Math.round((n / stats.total) * 100)
              return (
                <li key={c.id}>
                  <span className="bars__label"><CatIcon category={c.id} size={18} /> {t(c.label, c.ja)}</span>
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
          <div className="panel__title">🏆 {t('기록 랭킹', '記録ランキング')}</div>
          <ol className="ranking">
            {stats.ranking.map((r, i) => {
              const m = resolveMember(r.id)
              return (
                <li key={r.id}>
                  <span className="ranking__medal">{['🥇', '🥈', '🥉'][i] || `${i + 1}`}</span>
                  <span className="ranking__who"><MemberAvatar member={m} size={22} /> {m.label}</span>
                  <span className="ranking__n">{t(`${r.n}회`, `${r.n}回`)}</span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="panel">
        <div className="panel__title">{t('가족 공유', '家族で共有')}</div>
        {cloud ? (
          <p className="hint-sm">
            {t('가족 코드', '家族コード')} <b className="code">{familyCode}</b> {t('로 연결됨. 가족에게 이 코드를 알려주면 같은 지도를 봐요.', 'で接続中。家族にこのコードを伝えると同じ地図を見られます。')}{' '}
            {t('연결 해제·구성원 관리는', '接続解除・メンバー管理は')} <button className="link-btn" onClick={onOpenSettings}>{t('설정', '設定')}</button> {t('에서.', 'から。')}
          </p>
        ) : (
          <p className="hint-sm">{t('지금은 이 기기에만 저장돼요.', '今はこの端末にのみ保存されます。')}</p>
        )}
      </section>
    </div>
  )
}
