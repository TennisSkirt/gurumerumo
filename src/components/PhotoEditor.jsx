import { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import { compressImage } from '../lib/image.js'
import { usePlaces } from '../store/PlacesContext.jsx'

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
function toRad(deg) { return (deg * Math.PI) / 180 }
function rotatedSize(w, h, rotation) {
  const r = toRad(rotation)
  return {
    width: Math.abs(Math.cos(r) * w) + Math.abs(Math.sin(r) * h),
    height: Math.abs(Math.sin(r) * w) + Math.abs(Math.cos(r) * h),
  }
}

// 자른 영역 + 회전을 적용해 정사각 Blob 생성 → File 로 감싸 compressImage 통과
async function cropToFile(imageSrc, pixelCrop, rotation) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const { width: bw, height: bh } = rotatedSize(image.width, image.height, rotation)
  canvas.width = bw
  canvas.height = bh
  ctx.translate(bw / 2, bh / 2)
  ctx.rotate(toRad(rotation))
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0)

  const out = document.createElement('canvas')
  out.width = pixelCrop.width
  out.height = pixelCrop.height
  const octx = out.getContext('2d')
  octx.imageSmoothingEnabled = true
  octx.imageSmoothingQuality = 'high'
  octx.drawImage(canvas, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)

  const blob = await new Promise((res) => out.toBlob(res, 'image/jpeg', 0.92))
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' })
}

// 단일 사진 편집창 (정사각 크롭 + 회전)
function PhotoEditor({ file, index, total, onDone, onCancel }) {
  const { t } = usePlaces()
  const [url] = useState(() => URL.createObjectURL(file))
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [areaPixels, setAreaPixels] = useState(null)
  const [busy, setBusy] = useState(false)

  const onComplete = useCallback((_area, pixels) => setAreaPixels(pixels), [])
  const rotate = (d) => setRotation((r) => (r + d + 360) % 360)

  const finish = async (useOriginal) => {
    setBusy(true)
    try {
      let dataUrl
      if (useOriginal) {
        dataUrl = await compressImage(file)
      } else {
        const cropped = await cropToFile(url, areaPixels, rotation)
        dataUrl = await compressImage(cropped)
      }
      URL.revokeObjectURL(url)
      onDone(dataUrl)
    } catch (e) {
      console.error(e)
      alert(t('사진 편집 중 문제가 생겼어요.', '写真の編集中に問題が発生しました。'))
      setBusy(false)
    }
  }
  const cancel = () => { URL.revokeObjectURL(url); onCancel() }

  return (
    <div className="photo-editor">
      <div className="photo-editor__bar">
        <span>{t('사진 편집', '写真を編集')}{total > 1 ? ` (${index + 1}/${total})` : ''}</span>
      </div>
      <div className="photo-editor__stage">
        <Cropper
          image={url}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="rect"
          showGrid
          zoomWithScroll
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onComplete}
        />
      </div>
      <div className="photo-editor__ctrl">
        <button type="button" className="pe-round" onClick={() => rotate(-90)} aria-label={t('왼쪽으로 회전', '左に回転')}>⟲</button>
        <input className="pe-zoom" type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label={t('확대', 'ズーム')} />
        <button type="button" className="pe-round" onClick={() => rotate(90)} aria-label={t('오른쪽으로 회전', '右に回転')}>⟳</button>
      </div>
      <div className="photo-editor__actions">
        <button type="button" className="ghost" onClick={cancel} disabled={busy}>{t('취소', 'キャンセル')}</button>
        <button type="button" className="pe-plain" onClick={() => finish(true)} disabled={busy}>{t('원본 그대로', '元のまま')}</button>
        <button type="button" className="primary" onClick={() => finish(false)} disabled={busy || !areaPixels}>{busy ? t('처리 중…', '処理中…') : t('사용', '使う')}</button>
      </div>
    </div>
  )
}

// 파일 인풋 → 고른 사진들을 한 장씩 편집창에 태워 결과 dataURL 을 onAdd 로 전달
export function usePhotoUpload(onAdd) {
  const [queue, setQueue] = useState([])
  const [startCount, setStartCount] = useState(0)

  const onFileInput = (e) => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (files.length) { setQueue(files); setStartCount(files.length) }
  }
  const handleDone = (dataUrl) => { onAdd(dataUrl); setQueue((q) => q.slice(1)) }
  const handleCancel = () => setQueue((q) => q.slice(1))

  const current = queue[0]
  const editorNode = current ? (
    <PhotoEditor
      key={queue.length}
      file={current}
      index={startCount - queue.length}
      total={startCount}
      onDone={handleDone}
      onCancel={handleCancel}
    />
  ) : null

  return { onFileInput, editorNode }
}
