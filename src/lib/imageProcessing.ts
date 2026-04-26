export type PreparedImageUpload = {
  original: File
  display: Blob
  thumb: Blob
  width: number
  height: number
}

const DISPLAY_MAX_SIZE = 1800
const THUMB_MAX_SIZE = 640
const DISPLAY_WEBP_QUALITY = 0.72
const THUMB_WEBP_QUALITY = 0.64

function readImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('画像を読み込めませんでした。'))
    }
    image.src = url
  })
}

function targetSize(width: number, height: number, maxSize: number) {
  const ratio = Math.min(1, maxSize / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

function renderWebp(image: HTMLImageElement, maxSize: number, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    const size = targetSize(image.naturalWidth, image.naturalHeight, maxSize)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      reject(new Error('画像変換に失敗しました。'))
      return
    }

    canvas.width = size.width
    canvas.height = size.height
    context.drawImage(image, 0, 0, size.width, size.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('WebP 画像を生成できませんでした。'))
          return
        }

        resolve(blob)
      },
      'image/webp',
      quality,
    )
  })
}

export async function prepareImageUpload(file: File): Promise<PreparedImageUpload> {
  const image = await readImage(file)
  const [display, thumb] = await Promise.all([
    renderWebp(image, DISPLAY_MAX_SIZE, DISPLAY_WEBP_QUALITY),
    renderWebp(image, THUMB_MAX_SIZE, THUMB_WEBP_QUALITY),
  ])

  return {
    original: file,
    display,
    thumb,
    width: image.naturalWidth,
    height: image.naturalHeight,
  }
}
