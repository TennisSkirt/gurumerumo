import L from 'leaflet'
import { categoryOf } from './categories.js'

// 카테고리 색 물방울 핀(divIcon) — 기본 Leaflet 마커 이미지 깨짐 문제도 회피
export function makePin(categoryId, { selected = false } = {}) {
  const cat = categoryOf(categoryId)
  const html =
    `<div class="gm-pin${selected ? ' gm-pin--sel' : ''}" style="--pin:${cat.color}">` +
    `<span class="gm-pin__emoji">${cat.emoji}</span></div>`
  return L.divIcon({
    html,
    className: 'gm-pin-wrap',
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40],
  })
}
