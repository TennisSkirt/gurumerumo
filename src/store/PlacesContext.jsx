import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { firebaseReady, db } from '../lib/firebase.js'
import { DEFAULT_MEMBERS, fallbackMember, newMemberId } from '../lib/members.js'
import { visitsOf } from '../lib/places.js'

// ─────────────────────────────────────────────────────────────
// 이중 모드 저장소
//   cloud  = firebaseReady && familyCode  → Firestore places/{code}(가족문서)+/spots 실시간
//   local  = 그 외                         → localStorage (기기별)
// me 는 항상 로컬(이 기기의 사용자가 누구인지). familyCode 도 로컬.
// 구성원(members)은 가족이 공유해야 하므로 가족 문서 places/{code}.members 에 저장.
// ─────────────────────────────────────────────────────────────
const PlacesContext = createContext(null)

const LS = {
  places: 'gurumerumo.places',
  me: 'gurumerumo.me',
  code: 'gurumerumo.familyCode',
  members: 'gurumerumo.members',
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
  const [members, setMembers] = useState(() => loadLocal(LS.members, DEFAULT_MEMBERS))

  const cloud = firebaseReady && Boolean(familyCode)

  // me / familyCode 로컬 영속
  useEffect(() => { localStorage.setItem(LS.me, JSON.stringify(me)) }, [me])
  useEffect(() => {
    if (familyCode) localStorage.setItem(LS.code, JSON.stringify(familyCode))
    else localStorage.removeItem(LS.code)
  }, [familyCode])

  // 로컬 모드: places / members 영속
  useEffect(() => {
    if (!cloud) localStorage.setItem(LS.places, JSON.stringify(places))
  }, [places, cloud])
  useEffect(() => {
    if (!cloud) localStorage.setItem(LS.members, JSON.stringify(members))
  }, [members, cloud])

  // 클라우드 모드: spots 실시간 구독
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

  // 클라우드 모드: 가족 문서(구성원) 실시간 구독. members 필드 없으면 기본값 유지.
  useEffect(() => {
    if (!cloud) return
    let unsub = () => {}
    ;(async () => {
      const { doc, onSnapshot } = await import('firebase/firestore')
      unsub = onSnapshot(
        doc(db, 'places', familyCode),
        (snap) => {
          const data = snap.data()
          if (data?.members?.length) setMembers(data.members)
          else setMembers(DEFAULT_MEMBERS)
        },
        // 규칙이 아직 가족문서를 허용 안 하면 조용히 기본 구성원 유지
        () => setMembers(DEFAULT_MEMBERS),
      )
    })()
    return () => unsub()
  }, [cloud, familyCode])

  const membersById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  )
  const resolveMember = useCallback(
    (id) => membersById[id] || fallbackMember(id),
    [membersById],
  )

  // 새 장소 등록 — 입력 필드를 첫 방문(visits[0])으로 감싼다
  const addPlace = useCallback(async (place) => {
    const now = Date.now()
    const visit = {
      rating: place.rating || 0,
      photo: place.photo || null,
      memo: place.memo || '',
      visitedAt: place.visitedAt || '',
      author: place.author || null,
      createdAt: now,
    }
    const entry = {
      name: place.name,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
      createdAt: now,
      visits: [visit],
    }
    if (cloud) {
      const { collection, addDoc } = await import('firebase/firestore')
      await addDoc(collection(db, 'places', familyCode, 'spots'), entry)
    } else {
      setPlaces((prev) => [{ id: crypto.randomUUID(), ...entry }, ...prev])
    }
  }, [cloud, familyCode])

  // 재방문 — 기존 장소에 방문 기록 한 건 추가
  const addVisit = useCallback(async (place, visit) => {
    const v = {
      rating: visit.rating || 0,
      photo: visit.photo || null,
      memo: visit.memo || '',
      visitedAt: visit.visitedAt || '',
      author: visit.author || null,
      createdAt: Date.now(),
    }
    const nextVisits = [...visitsOf(place), v]
    if (cloud) {
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'places', familyCode, 'spots', place.id), { visits: nextVisits })
    } else {
      setPlaces((prev) => prev.map((p) => (p.id === place.id ? { ...p, visits: nextVisits } : p)))
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

  // 구성원 목록 통째로 저장(가족 문서에 공유). 설정 화면에서 편집 후 커밋.
  const saveMembers = useCallback(async (next) => {
    setMembers(next) // 즉시 반영(옵티미스틱)
    if (cloud) {
      const { doc, setDoc } = await import('firebase/firestore')
      await setDoc(doc(db, 'places', familyCode), { members: next }, { merge: true })
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
    setMembers(loadLocal(LS.members, DEFAULT_MEMBERS))
  }, [])

  const value = {
    places, me, familyCode, members,
    cloud, firebaseReady,
    membersById, resolveMember, saveMembers,
    addPlace, addVisit, updatePlace, deletePlace,
    setMe, createFamily, joinFamily, leaveFamily,
    newMemberId,
  }
  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>
}

export function usePlaces() {
  const ctx = useContext(PlacesContext)
  if (!ctx) throw new Error('usePlaces must be used within PlacesProvider')
  return ctx
}
