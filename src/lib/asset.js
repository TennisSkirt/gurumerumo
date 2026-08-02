// public/assets 경로 헬퍼 (GitHub Pages base 경로 반영)
const BASE = import.meta.env.BASE_URL // '/gurumerumo/'
export const asset = (p) => BASE + p

export const catIconSrc = (id) => asset(`assets/categories/${id}.png`)
export const faceRoundSrc = (key) => asset(`assets/faces/${key}_round.png`)
export const characterSrc = (key) => asset(`assets/characters/${key}.png`)
export const tabIconSrc = (id, on) => asset(`assets/tabs/${id}_${on ? 'on' : 'off'}.png`)
export const uiIconSrc = (name) => asset(`assets/ui/${name}.png`)
export const splashSrc = () => asset('assets/splash.png')
