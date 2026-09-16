/**
 * Draws page 1 of a PDF into a canvas using pdf.js, loaded on demand from the
 * CDN so the admin tool adds no dependency to the site bundle.
 */

const PDFJS_VERSION = '3.11.174'
const PDFJS_SRC = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`
const PDFJS_WORKER = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`

let loader: Promise<any> | null = null

function loadPdfJs(): Promise<any> {
  const w = window as any
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib)
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = PDFJS_SRC
      script.async = true
      script.onload = () => {
        const lib = (window as any).pdfjsLib
        if (!lib) return reject(new Error('The PDF viewer failed to start'))
        lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER
        resolve(lib)
      }
      script.onerror = () => {
        loader = null
        reject(new Error('Could not load the PDF viewer — check the internet connection'))
      }
      document.head.appendChild(script)
    })
  }
  return loader
}

const activeTasks = new WeakMap<HTMLCanvasElement, { cancel: () => void }>()

/**
 * Render page 1 at `cssWidth` CSS pixels wide. Returns the points→pixels scale,
 * or null if a newer render on the same canvas superseded this one.
 */
export async function renderFirstPage(
  canvas: HTMLCanvasElement,
  data: ArrayBuffer,
  cssWidth: number
): Promise<{ scale: number; cssHeight: number } | null> {
  const lib = await loadPdfJs()
  // pdf.js transfers (detaches) the buffer it is given, so always hand it a copy.
  const doc = await lib.getDocument({ data: new Uint8Array(data.slice(0)) }).promise
  try {
    const page = await doc.getPage(1)
    const scale = cssWidth / page.getViewport({ scale: 1 }).width
    const viewport = page.getViewport({ scale })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    activeTasks.get(canvas)?.cancel()
    canvas.width = Math.floor(viewport.width * dpr)
    canvas.height = Math.floor(viewport.height * dpr)
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`

    const task = page.render({
      canvasContext: canvas.getContext('2d'),
      viewport,
      transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0],
    })
    activeTasks.set(canvas, task)
    try {
      await task.promise
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException') return null
      throw err
    }
    return { scale, cssHeight: viewport.height }
  } finally {
    doc.destroy()
  }
}
