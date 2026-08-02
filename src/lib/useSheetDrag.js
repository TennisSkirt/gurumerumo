import { useCallback, useState } from 'react'

// 바텀시트 위쪽 핸들을 아래로 끌어내리면 닫힘.
// 거리(70px 이상) 또는 아래로 빠르게 튕기면(속도) 닫힘 → 더 잘 먹히게.
export function useSheetDrag(onClose) {
  const [dy, setDy] = useState(0)
  const [dragging, setDragging] = useState(false)

  const onPointerDown = useCallback((e) => {
    e.preventDefault()
    const startY = e.clientY
    const startT = Date.now()
    let lastY = startY
    setDragging(true)
    setDy(0)

    const move = (ev) => {
      const d = Math.max(0, ev.clientY - startY)
      setDy(d)
      lastY = ev.clientY
    }
    const finish = (ev) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      setDragging(false)
      const endY = ev.clientY ?? lastY
      const d = Math.max(0, endY - startY)
      // 전체 평균 속도(px/ms) — 아래로 빠르게 튕기면 짧게 끌어도 닫힘
      const v = d / Math.max(1, Date.now() - startT)
      if (d > 60 || (d > 18 && v > 0.25)) onClose()
      else setDy(0)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
  }, [onClose])

  return {
    dragProps: { onPointerDown, style: { touchAction: 'none', cursor: 'grab' } },
    sheetStyle: {
      transform: dy ? `translateY(${dy}px)` : undefined,
      transition: dragging ? 'none' : 'transform .25s ease',
    },
  }
}
