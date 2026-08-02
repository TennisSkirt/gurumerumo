import { useState } from 'react'
import { usePlaces } from '../store/PlacesContext.jsx'

// Firebase 연결 후, 가족 코드로 같은 지도에 참여하는 화면
export default function FamilyCodeScreen() {
  const { createFamily, joinFamily, t } = usePlaces()
  const [code, setCode] = useState('')

  return (
    <div className="gate">
      <div className="gate__logo">ぐるめるも</div>
      <p className="gate__lead">{t('우리 가족의 미식 지도에 참여하세요.', '家族のグルメ地図に参加しましょう。')}</p>
      <button className="save-btn" onClick={createFamily}>{t('새 가족 지도 만들기', '新しい家族マップを作る')}</button>
      <div className="gate__or">{t('또는', 'または')}</div>
      <form
        className="gate__join"
        onSubmit={(e) => { e.preventDefault(); if (code.trim()) joinFamily(code) }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t('가족 코드 입력 (예: AB3K9Z)', '家族コードを入力（例: AB3K9Z）')}
          maxLength={6}
        />
        <button type="submit">{t('참여', '参加')}</button>
      </form>
    </div>
  )
}
