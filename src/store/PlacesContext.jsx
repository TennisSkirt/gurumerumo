import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { firebaseReady, db } from '../lib/firebase.js'

// ─────────────────────────────────────────────────────────────
// 이중 모드 저장소
//   cloud  = firebaseReady && familyCode  → Firestore places/{code}/spots 실시간
//   local  = 그 외                         → localStorage (기기별)
// me / familyCode 는 항상 로컬(기기별 정체성).
// ─────────────────────────────────────────────────────────────
const PlacesContext = createContext(null)

const LS = {
  places: 'gurumerumo.places',
  me: 'gurumerumo.me',
  code: 'gurumerumo.familyCode',
}

function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v == null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}

export function generateFamilyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export function PlacesProvider({ children }) {
  const [places, setPlaces] = useState(() => loadLocal(LS.places, []))
  const [me, setMeState] = useState(() => loadLocal(LS.me, null))
  const [familyCode, setFamilyCode] = useState(() => loadLocal(LS.code, null))

  const cloud = firebaseReady && Boolean(familyCode)

  // me / familyCode 로컬 영속
  useEffect(() => { localStorage.setItem(LS.me, JSON.stringify(me)) }, [me])
  useEffect(() => {
    if (familyCode) localStorage.setItem(LS.code, JSON.stringify(familyCode))
    else localStorage.removeItem(LS.code)
  }, [familyCode])

  // 로컬 모드: places 영속
  useEffect(() => {
    if (!cloud) localStorage.setItem(LS.places, JSON.stringify(places))
  }, [places, cloud])

  // 클라우드 모드: Firestore 실시간 구독
  useEffect(() => {
    if (!cloud) return
    let unsub = () => {}
    ;(async () => {
      const { collection, onSnapshot, query, orderBy } = await import('firebase/firestore')
      const col = collection(db, 'places', familyCode, 'spots')
      const q = query(col, orderBy('createdAt', 'desc'))
      unsub = onSnapshot(q, (snap) => {
        setPlaces(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      })
    })()
    return () => unsub()
  }, [cloud, familyCode])

  const addPlace = useCallback(async (place) => {
    const entry = { ...place, createdAt: Date.now() }
    if (cloud) {
      const { collection, addDoc } = await import('firebase/firestore')
      await addDoc(collection(db, 'places', familyCode, 'spots'), entry)
    } else {
      setPlaces((prev) => [{ id: crypto.randomUUID(), ...entry }, ...prev])
    }
  }, [cloud, familyCode])

  const updatePlace = useCallback(async (id, patch) => {
    if (cloud) {
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'places', familyCode, 'spots', id), patch)
    } else {
      setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    }
  }, [cloud, familyCode])

  const deletePlace = useCallback(async (id) => {
    if (cloud) {
      const { doc, deleteDoc } = await import('firebase/firestore')
      await deleteDoc(doc(db, 'places', familyCode, 'spots', id))
    } else {
      setPlaces((prev) => prev.filter((p) => p.id !== id))
    }
  }, [cloud, familyCode])

  const setMe = useCallback((id) => setMeState(id), [])

  const createFamily = useCallback(() => {
    const code = generateFamilyCode()
    setFamilyCode(code)
    return code
  }, [])

  const joinFamily = useCallback((code) => {
    setFamilyCode(String(code).toUpperCase().trim())
  }, [])

  const leaveFamily = useCallback(() => {
    setFamilyCode(null)
    setPlaces(loadLocal(LS.places, []))
  }, [])

  const value = {
    places, me, familyCode,
    cloud, firebaseReady,
    addPlace, updatePlace, deletePlace,
    setMe, createFamily, joinFamily, leaveFamily,
  }
  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>
}

export function usePlaces() {
  const ctx = useContext(PlacesContext)
  if (!ctx) throw new Error('usePlaces must be used within PlacesProvider')
  return ctx
}
