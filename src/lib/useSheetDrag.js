import { useCallback, useState } from 'react'

// 바텀시트 위쪽을 아래로 끌어내리면 닫히도록 (핸들에 dragProps, 시트에 sheetStyle 적용)
export function useSheetDrag(onClose) {
  const [dy, setDy] = useState(0)
  const [dragging, setDragging] = useState(false)

  const onPointerDown = useCallback((e) => {
    const startY = e.clientY
    setDragging(true)
    setDy(0)
    const move = (ev) => setDy(Math.max(0, ev.clientY - startY))
    const up = (ev) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setDragging(false)
      const d = Math.max(0, ev.clientY - startY)
      if (d > 90) onClose()
      else setDy(0)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [onClose])

  return {
    dragProps: { onPointerDown, style: { touchAction: 'none', cursor: 'grab' } },
    sheetStyle: {
      transform: dy ? `translateY(${dy}px)` : undefined,
      transition: dragging ? 'none' : 'transform .25s ease',
    },
  }
}
