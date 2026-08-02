import { useState } from 'react'
import MapView from './components/MapView.jsx'
import RecordForm from './components/RecordForm.jsx'
import PlaceList from './components/PlaceList.jsx'
import FamilyPage from './components/FamilyPage.jsx'
import PlaceDetail from './components/PlaceDetail.jsx'
import FamilyCodeScreen from './components/FamilyCodeScreen.jsx'
import SettingsSheet from './components/SettingsSheet.jsx'
import { usePlaces } from './store/PlacesContext.jsx'

const TABS = [
  { id: 'map', label: '지도', emoji: '🗺️' },
  { id: 'record', label: '기록', emoji: '➕' },
  { id: 'list', label: '목록', emoji: '📋' },
  { id: 'family', label: '가족', emoji: '👨‍👩‍👧' },
]

export default function App() {
  const { firebaseReady, familyCode } = usePlaces()
  const [tab, setTab] = useState('map')
  const [selected, setSelected] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  // 클라우드 모드인데 아직 가족 코드가 없으면 참여 화면
  if (firebaseReady && !familyCode) return <FamilyCodeScreen />

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar__logo">🗺️ ぐるめるも</span>
        <button className="topbar__gear" onClick={() => setShowSettings(true)} aria-label="설정">⚙️</button>
      </header>

      <main className="screen">
        {tab === 'map' && <MapView onSelect={setSelected} />}
        {tab === 'record' && <RecordForm onDone={() => setTab('map')} />}
        {tab === 'list' && <PlaceList onSelect={setSelected} />}
        {tab === 'family' && <FamilyPage onSelect={setSelected} onOpenSettings={() => setShowSettings(true)} />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'tabbar__btn' + (tab === t.id ? ' on' : '')}
            onClick={() => setTab(t.id)}
          >
            <span className="tabbar__emoji">{t.emoji}</span>
            <span className="tabbar__label">{t.label}</span>
          </button>
        ))}
      </nav>

      {selected && <PlaceDetail place={selected} onClose={() => setSelected(null)} />}
      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
  )
}
