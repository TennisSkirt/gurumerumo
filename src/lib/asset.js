// public/assets 경로 헬퍼 (GitHub Pages base 경로 반영)
const BASE = import.meta.env.BASE_URL // '/gurumerumo/'
export const asset = (p) => BASE + p

// 에셋은 WebP(q90, 알파 유지) — PNG 대비 ~83% 작음. (PWA 매니페스트 아이콘 icon-*.png 는 별개로 PNG 유지)
export const catIconSrc = (id) => asset(`assets/categories/${id}.webp`)
export const faceRoundSrc = (key) => asset(`assets/faces/${key}_round.webp`)
export const characterSrc = (key) => asset(`assets/characters/${key}.webp`)
export const tabIconSrc = (id, on) => asset(`assets/tabs/${id}_${on ? 'on' : 'off'}.webp`)
export const uiIconSrc = (name) => asset(`assets/ui/${name}.webp`)
export const splashSrc = () => asset('assets/splash.webp')
