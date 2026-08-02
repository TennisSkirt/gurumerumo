// 사진을 캔버스로 리사이즈/압축 → dataURL(JPEG)
// Firestore 문서 1MB 한도 안에 들도록 넉넉히 줄임(가족 앱 수준엔 충분).
export function compressImage(file, { maxSize = 1000, quality = 0.7 } = {}) {
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
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    reader.readAsDataURL(file)
  })
}
