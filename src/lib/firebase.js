// ─────────────────────────────────────────────────────────────
// Firebase 연결 (가족 공유 클라우드 = Firestore)
//
// [설정 방법 — 사용자]
// 1) https://console.firebase.google.com 에서 프로젝트 생성 (이름 예: gurumerumo)
// 2) 프로젝트 설정 → 내 앱 → 웹 앱 추가(</>) → firebaseConfig 값 복사
// 3) 아래 CONFIG 의 각 값을 붙여넣기 (웹 config 는 공개돼도 안전 — 보안은 Firestore 규칙으로)
// 4) 좌측 메뉴 Firestore Database → 데이터베이스 만들기
// 5) 규칙: places/{code}/spots 에 대해 read,write 허용 (가족 코드 기반)
//
// CONFIG.apiKey 가 채워지면 자동으로 클라우드(가족 공유) 모드로 전환됩니다.
// 비어 있으면 지금처럼 기기별 localStorage 로 동작합니다.
// ─────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { initializeFirestore } from 'firebase/firestore'

export const CONFIG = {
  apiKey: 'AIzaSyA4JkbNMD6GxEMp1-4W9QJN8Lc4hFui7cg',
  authDomain: 'gurumerumo.firebaseapp.com',
  projectId: 'gurumerumo',
  storageBucket: 'gurumerumo.firebasestorage.app',
  messagingSenderId: '912184586391',
  appId: '1:912184586391:web:08ec117d79b727e36ef9d2',
}

export const firebaseReady = Boolean(CONFIG.apiKey)
export const app = firebaseReady ? initializeApp(CONFIG) : null
// WebChannel(스트리밍) 전송을 막는 네트워크(일부 회사/공용 와이파이, 인앱 브라우저)에서도
// 안정적으로 동작하도록 long-polling 사용. 가족 앱 규모엔 성능 차이 무의미.
export const db = firebaseReady
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : null
