// 사진을 캔버스로 리사이즈/압축 → dataURL(JPEG)
// Firestore 문서 1MB 한도 안에 넉넉히 들도록, 한 장이 목표 용량(base64) 이하가 될 때까지
// 품질/크기를 자동으로 낮춘다. (사진 여러 장 + 재방문이 쌓여도 문서가 잘 안 커지게)
const TARGET_BYTES = 180 * 1024 // 사진 1장 목표 상한(약 180KB) — base64 문자열 기준

// base64 dataURL 의 실제 바이트 수(≈ Firestore 저장 크기)
function dataUrlBytes(url) {
  const i = url.indexOf(',')
  const b64 = i >= 0 ? url.slice(i + 1) : url
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.floor((b64.length * 3) / 4) - pad
}

export function compressImage(file, { maxSize = 1000, quality = 0.72, maxBytes = TARGET_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = () => { img.src = reader.result }
    reader.onerror = reject
    img.onload = () => {
      let { width, height } = img
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width)
        width = maxSize
      } else if (height >= width && height > maxSize) {
        width = Math.round((width * maxSize) / height)
        height = maxSize
      }

      const draw = (w, h, q) => {
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, w, h)
        return canvas.toDataURL('image/jpeg', q)
      }

      let q = quality
      let url = draw(width, height, q)
      // 목표 용량을 넘으면 품질을 먼저 낮추고, 그래도 크면 크기를 줄여 재시도
      let guard = 0
      while (dataUrlBytes(url) > maxBytes && guard < 7) {
        guard++
        if (q > 0.45) {
          q = Math.max(0.45, q - 0.1)
        } else {
          width = Math.round(width * 0.85)
          height = Math.round(height * 0.85)
        }
        url = draw(width, height, q)
      }
      resolve(url)
    }
    img.onerror = reject
    reader.readAsDataURL(file)
  })
}
