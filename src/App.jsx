import { lazy, Suspense, useMemo, useState } from 'react'
import MapView from './components/MapView.jsx'
import Splash from './components/Splash.jsx'
import { UiIcon } from './components/Icon.jsx'
// 지도(첫 화면)를 뺀 나머지 화면은 처음 열 때만 로드 → 초기 번들 축소
const RecordForm = lazy(() => import('./components/RecordForm.jsx'))
const PlaceList = lazy(() => import('./components/PlaceList.jsx'))
const WishlistPage = lazy(() => import('./components/WishlistPage.jsx'))
const PlaceDetail = lazy(() => import('./components/PlaceDetail.jsx'))
const FamilyCodeScreen = lazy(() => import('./components/FamilyCodeScreen.jsx'))
const SettingsSheet = lazy(() => import('./components/SettingsSheet.jsx'))
import { tabIconSrc, uiIconSrc, characterSrc } from './lib/asset.js'
import { storageUsage } from './lib/usage.js'
import { usePlaces } from './store/PlacesContext.jsx'

const TABS = [
  { id: 'map', ko: '지도', ja: '地図' },
  { id: 'record', ko: '기록', ja: '記録' },
  { id: 'list', ko: '목록', ja: '一覧' },
  { id: 'wish', ko: '위시리스트', ja: 'ウィッシュ' },
]

export default function App() {
  const { firebaseReady, familyCode, cloud, places, t } = usePlaces()
  const storageWarn = useMemo(() => (cloud ? storageUsage(places).warn : false), [cloud, places])
  const [splashDone, setSplashDone] = useState(false)
  const [tab, setTab] = useState('map')
  const [selected, setSelected] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  if (!splashDone) return <Splash onDone={() => setSplashDone(true)} />

  // 클라우드 모드인데 아직 가족 코드가 없으면 참여 화면
  if (firebaseReady && !familyCode) {
    return <Suspense fallback={<div className="app-loading"><span className="spinner" /></div>}><FamilyCodeScreen /></Suspense>
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar__logo">ぐるめるも</span>
        <button className="topbar__gear" onClick={() => setShowSettings(true)} aria-label="설정">
          <UiIcon name="gear" size={20} />
          {storageWarn && <span className="warn-dot" aria-hidden="true" />}
        </button>
      </header>

      <main className="screen">
        {tab === 'map' && <MapView onSelect={setSelected} onWishClick={() => setTab('wish')} />}
        <Suspense fallback={<div className="tab-loading"><span className="spinner" /></div>}>
          {tab === 'record' && <RecordForm onDone={() => setTab('map')} />}
          {tab === 'list' && <PlaceList onSelect={setSelected} />}
          {tab === 'wish' && <WishlistPage />}
        </Suspense>
      </main>

      <nav className="tabbar">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            className={'tabbar__btn' + (tab === tb.id ? ' on' : '')}
            onClick={() => setTab(tb.id)}
          >
            <img className={'tabbar__ic' + (tb.id === 'wish' ? ' tabbar__ic--tint' : '')} src={tb.id === 'wish' ? uiIconSrc('star') : tabIconSrc(tb.id, tab === tb.id)} alt="" width={28} height={28} />
            <span className="tabbar__label">{t(tb.ko, tb.ja)}</span>
          </button>
        ))}
      </nav>

      {tab === 'list' && <img className="list-mascot" src={characterSrc('wife')} alt="" />}

      <Suspense fallback={null}>
        {selected && <PlaceDetail place={selected} onClose={() => setSelected(null)} />}
        {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
      </Suspense>
    </div>
  )
}
