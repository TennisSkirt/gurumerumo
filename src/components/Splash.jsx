import { useEffect, useState } from 'react'
import { splashSrc } from '../lib/asset.js'

// 첫 기동 스플래시 — 부부 캐릭터 + 로고, 잠깐 보여주고 페이드아웃
export default function Splash({ onDone }) {
  const [out, setOut] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 1700)
    const t2 = setTimeout(() => onDone(), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  return (
    <div className={'splash' + (out ? ' splash--out' : '')}>
      <img src={splashSrc()} alt="ぐるめるも" />
    </div>
  )
}
