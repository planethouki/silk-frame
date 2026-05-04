import type { User } from 'firebase/auth'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { prepareImageUpload, type PreparedImageUpload } from '../lib/imageProcessing'
import { uploadImage } from '../lib/uploadApi'

type UploadStatus = 'idle' | 'processing' | 'uploading' | 'done' | 'error'
type BatchItemStatus = 'processing' | 'ready' | 'uploading' | 'done' | 'error'

type BatchUploadItem = {
  id: string
  file: File
  previewUrl: string
  prepared: PreparedImageUpload | null
  title: string
  status: BatchItemStatus
  error: string
  imageId: string
}

const pageClass = 'grid max-w-[760px] gap-6 max-[760px]:block'
const eyebrowClass =
  'mb-2 mt-0 text-[13px] font-[650] uppercase text-[var(--muted)]'
const pageTextClass = 'mb-0 mt-3.5 text-[var(--text)]'
const uploadFormClass =
  'grid gap-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5'
const fieldLabelClass = 'grid gap-[7px] text-[var(--ink)]'
const fieldHintClass = 'text-[13px] text-[var(--muted)]'
const fieldControlClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 py-2.5 font-[inherit] text-[var(--ink)]'
const primaryActionClass =
  'justify-self-start rounded-full border-0 bg-[var(--ink)] px-[18px] py-2.5 font-[inherit] text-[var(--surface)] disabled:cursor-wait disabled:opacity-[0.62]'
const secondaryActionClass =
  'justify-self-start rounded-full border border-[var(--border)] bg-[var(--soft)] px-3.5 py-2 font-[inherit] text-[var(--ink)] disabled:cursor-wait disabled:opacity-[0.62]'
const formGridClass =
  'grid grid-cols-2 gap-3.5 max-[760px]:grid-cols-1'
const formErrorClass = 'm-0 text-[#a13d2d]'
const formSuccessClass = 'm-0 text-[#286343]'

function currentDateTimeLocal() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function AdminUploadPage({
  user,
  onUploadComplete,
}: {
  user: User | null
  onUploadComplete: () => void
}) {
  const initialDateTime = useMemo(() => currentDateTimeLocal(), [])
  const [file, setFile] = useState<File | null>(null)
  const [prepared, setPrepared] = useState<PreparedImageUpload | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [takenAt, setTakenAt] = useState(initialDateTime)
  const [sortAt, setSortAt] = useState(initialDateTime)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState('')
  const [createdImageId, setCreatedImageId] = useState('')
  const [batchItems, setBatchItems] = useState<BatchUploadItem[]>([])
  const [batchDescription, setBatchDescription] = useState('')
  const [batchTagsText, setBatchTagsText] = useState('')
  const [batchVisibility, setBatchVisibility] = useState<'public' | 'private'>('public')
  const [batchTakenAt, setBatchTakenAt] = useState(initialDateTime)
  const [batchSortAt, setBatchSortAt] = useState(initialDateTime)
  const [batchError, setBatchError] = useState('')
  const batchItemsRef = useRef<BatchUploadItem[]>([])

  const previewUrl = useMemo(() => {
    if (!file) return ''
    return URL.createObjectURL(file)
  }, [file])

  const tags = tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  const batchTags = batchTagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  const batchIsBusy = batchItems.some(
    (item) => item.status === 'processing' || item.status === 'uploading',
  )
  const batchReadyCount = batchItems.filter((item) => item.prepared).length

  useEffect(() => {
    batchItemsRef.current = batchItems
  }, [batchItems])

  useEffect(() => {
    return () => {
      batchItemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [])

  const updateBatchItem = (id: string, nextItem: Partial<BatchUploadItem>) => {
    setBatchItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, ...nextItem } : item)),
    )
  }

  const handleFileChange = async (nextFile: File | null) => {
    setFile(nextFile)
    setPrepared(null)
    setCreatedImageId('')
    setError('')

    if (!nextFile) return

    setStatus('processing')
    try {
      const nextPrepared = await prepareImageUpload(nextFile)
      setPrepared(nextPrepared)
      setStatus('idle')
      if (!title) {
        setTitle(nextFile.name.replace(/\.[^.]+$/, ''))
      }
    } catch (caughtError) {
      setStatus('error')
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : '画像変換に失敗しました。',
      )
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!prepared) return

    setStatus('uploading')
    setError('')
    setCreatedImageId('')

    try {
      const imageId = await uploadImage({
        prepared,
        title,
        description,
        tags,
        visibility,
        takenAt,
        sortAt,
      })
      setCreatedImageId(imageId)
      setStatus('done')
      onUploadComplete()
    } catch (caughtError) {
      setStatus('error')
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'アップロードに失敗しました。',
      )
    }
  }

  const handleBatchFileChange = async (files: FileList | null) => {
    const imageFiles = Array.from(files ?? []).filter((nextFile) =>
      nextFile.type.startsWith('image/'),
    )

    batchItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setBatchItems([])
    setBatchError('')

    if (imageFiles.length === 0) return

    const nextItems = imageFiles.map((nextFile, index) => ({
      id: `${Date.now()}-${index}-${nextFile.name}`,
      file: nextFile,
      previewUrl: URL.createObjectURL(nextFile),
      prepared: null,
      title: nextFile.name.replace(/\.[^.]+$/, ''),
      status: 'processing' as const,
      error: '',
      imageId: '',
    }))

    setBatchItems(nextItems)

    await Promise.all(
      nextItems.map(async (item) => {
        try {
          const nextPrepared = await prepareImageUpload(item.file)
          updateBatchItem(item.id, {
            prepared: nextPrepared,
            status: 'ready',
          })
        } catch (caughtError) {
          updateBatchItem(item.id, {
            status: 'error',
            error:
              caughtError instanceof Error
                ? caughtError.message
                : 'Image processing failed.',
          })
        }
      }),
    )
  }

  const handleBatchTitleChange = (id: string, title: string) => {
    updateBatchItem(id, { title })
  }

  const removeBatchItem = (id: string) => {
    setBatchItems((currentItems) => {
      const item = currentItems.find((currentItem) => currentItem.id === id)
      if (item) {
        URL.revokeObjectURL(item.previewUrl)
      }
      return currentItems.filter((currentItem) => currentItem.id !== id)
    })
  }

  const handleBatchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const uploadableItems = batchItems.filter((item) => item.prepared)

    if (uploadableItems.length === 0) {
      setBatchError('Uploadable images are not ready yet.')
      return
    }

    setBatchError('')
    uploadableItems.forEach((item) => {
      updateBatchItem(item.id, { status: 'uploading', error: '', imageId: '' })
    })

    const results = await Promise.all(
      uploadableItems.map(async (item) => {
        if (!item.prepared) return false

        try {
          const imageId = await uploadImage({
            prepared: item.prepared,
            title: item.title,
            description: batchDescription,
            tags: batchTags,
            visibility: batchVisibility,
            takenAt: batchTakenAt,
            sortAt: batchSortAt,
          })
          updateBatchItem(item.id, { status: 'done', imageId })
          return true
        } catch (caughtError) {
          updateBatchItem(item.id, {
            status: 'error',
            error:
              caughtError instanceof Error ? caughtError.message : 'Upload failed.',
          })
          return false
        }
      }),
    )

    if (results.some(Boolean)) {
      onUploadComplete()
    }
  }

  if (!user) {
    return (
      <main className={pageClass}>
        <p className={eyebrowClass}>Protected route</p>
        <h1>Upload</h1>
        <p className={pageTextClass}>管理者ログイン後に画像をアップロードできます。</p>
        <Link className="mt-[18px] inline-flex text-[var(--ink)]" to="/admin">
          Admin login
        </Link>
      </main>
    )
  }

  return (
    <main className={pageClass}>
      <section>
        <p className={eyebrowClass}>Admin upload</p>
        <h1>Upload</h1>
        <p className={pageTextClass}>
          原本画像を選択すると、ブラウザ上で表示用画像とサムネイルを WebP
          生成して S3 へ直接アップロードします。
        </p>
      </section>

      <form className={uploadFormClass} onSubmit={handleSubmit}>
        <label className={fieldLabelClass}>
          <span className={fieldHintClass}>Image</span>
          <input
            accept="image/*"
            className={fieldControlClass}
            onChange={(event) =>
              void handleFileChange(event.currentTarget.files?.[0] ?? null)
            }
            required
            type="file"
          />
        </label>

        {previewUrl ? (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(180px,0.45fr)] gap-3.5 max-[760px]:grid-cols-1">
            <img
              className="aspect-[4/3] w-full bg-[var(--soft)] object-cover"
              src={previewUrl}
              alt=""
            />
            {prepared ? (
              <dl className="m-0 overflow-hidden rounded-lg border border-[var(--border)]">
                <div className="grid gap-1 p-3">
                  <dt className="text-[13px] text-[var(--muted)]">Original</dt>
                  <dd className="m-0 text-[var(--ink)]">
                    {prepared.width} x {prepared.height}
                  </dd>
                </div>
                <div className="grid gap-1 border-t border-[var(--border)] p-3">
                  <dt className="text-[13px] text-[var(--muted)]">Display</dt>
                  <dd className="m-0 text-[var(--ink)]">
                    {Math.round(prepared.display.size / 1024)} KB
                  </dd>
                </div>
                <div className="grid gap-1 border-t border-[var(--border)] p-3">
                  <dt className="text-[13px] text-[var(--muted)]">Thumb</dt>
                  <dd className="m-0 text-[var(--ink)]">
                    {Math.round(prepared.thumb.size / 1024)} KB
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>
        ) : null}

        <div className={formGridClass}>
          <label className={fieldLabelClass}>
            <span className={fieldHintClass}>Title</span>
            <input
              className={fieldControlClass}
              onChange={(event) => setTitle(event.target.value)}
              required
              type="text"
              value={title}
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={fieldHintClass}>Visibility</span>
            <select
              className={fieldControlClass}
              onChange={(event) =>
                setVisibility(event.target.value === 'private' ? 'private' : 'public')
              }
              value={visibility}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className={`${fieldLabelClass} col-span-full`}>
            <span className={fieldHintClass}>Description</span>
            <textarea
              className={`${fieldControlClass} resize-y`}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              value={description}
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={fieldHintClass}>Tags</span>
            <input
              className={fieldControlClass}
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="city, night, texture"
              type="text"
              value={tagsText}
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={fieldHintClass}>Sort at</span>
            <input
              className={fieldControlClass}
              onChange={(event) => setSortAt(event.target.value)}
              type="datetime-local"
              value={sortAt}
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={fieldHintClass}>Taken at</span>
            <input
              className={fieldControlClass}
              onChange={(event) => setTakenAt(event.target.value)}
              type="datetime-local"
              value={takenAt}
            />
          </label>
        </div>

        {error ? <p className={formErrorClass}>{error}</p> : null}
        {status === 'done' ? (
          <p className={formSuccessClass}>
            アップロードしました。Image ID: {createdImageId}
          </p>
        ) : null}

        <button
          className={primaryActionClass}
          disabled={!prepared || status === 'processing' || status === 'uploading'}
          type="submit"
        >
          {status === 'processing'
            ? 'Processing'
            : status === 'uploading'
              ? 'Uploading'
              : 'Upload image'}
        </button>
      </form>

      <section>
        <p className={eyebrowClass}>Batch upload</p>
        <h2>Multiple images</h2>
        <p className={pageTextClass}>
          Select several images, confirm each title, and upload them together with
          shared metadata.
        </p>
      </section>

      <form className={`${uploadFormClass} -mt-1.5`} onSubmit={handleBatchSubmit}>
        <label className={fieldLabelClass}>
          <span className={fieldHintClass}>Images</span>
          <input
            accept="image/*"
            className={fieldControlClass}
            multiple
            onChange={(event) => void handleBatchFileChange(event.currentTarget.files)}
            type="file"
          />
        </label>

        {batchItems.length > 0 ? (
          <div className="grid gap-3" aria-label="Selected images">
            {batchItems.map((item) => (
              <article
                className="grid grid-cols-[150px_minmax(0,1fr)] gap-3.5 rounded-lg border border-[var(--border)] p-3 max-[760px]:grid-cols-1"
                key={item.id}
              >
                <img
                  className="aspect-square w-full bg-[var(--soft)] object-cover"
                  src={item.previewUrl}
                  alt=""
                />
                <div className="grid min-w-0 gap-2.5">
                  <label className={fieldLabelClass}>
                    <span className={fieldHintClass}>Title</span>
                    <input
                      className={`${fieldControlClass} min-w-0`}
                      disabled={item.status === 'uploading' || item.status === 'done'}
                      onChange={(event) =>
                        handleBatchTitleChange(item.id, event.target.value)
                      }
                      required
                      type="text"
                      value={item.title}
                    />
                  </label>
                  <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-2 max-[760px]:grid-cols-1">
                    <div className="min-w-0">
                      <dt className="text-xs uppercase text-[var(--muted)]">
                        Status
                      </dt>
                      <dd className="m-0 break-words text-[var(--ink)] [overflow-wrap:anywhere]">
                        {item.status}
                      </dd>
                    </div>
                    {item.prepared ? (
                      <>
                        <div className="min-w-0">
                          <dt className="text-xs uppercase text-[var(--muted)]">
                            Original
                          </dt>
                          <dd className="m-0 break-words text-[var(--ink)] [overflow-wrap:anywhere]">
                            {item.prepared.width} x {item.prepared.height}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs uppercase text-[var(--muted)]">
                            Display
                          </dt>
                          <dd className="m-0 break-words text-[var(--ink)] [overflow-wrap:anywhere]">
                            {Math.round(item.prepared.display.size / 1024)} KB
                          </dd>
                        </div>
                      </>
                    ) : null}
                    {item.imageId ? (
                      <div className="min-w-0">
                        <dt className="text-xs uppercase text-[var(--muted)]">
                          Image ID
                        </dt>
                        <dd className="m-0 break-words text-[var(--ink)] [overflow-wrap:anywhere]">
                          {item.imageId}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  {item.error ? <p className={formErrorClass}>{item.error}</p> : null}
                  <button
                    className={secondaryActionClass}
                    disabled={item.status === 'uploading'}
                    onClick={() => removeBatchItem(item.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div className={formGridClass}>
          <label className={fieldLabelClass}>
            <span className={fieldHintClass}>Visibility</span>
            <select
              className={fieldControlClass}
              onChange={(event) =>
                setBatchVisibility(
                  event.target.value === 'private' ? 'private' : 'public',
                )
              }
              value={batchVisibility}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className={fieldLabelClass}>
            <span className={fieldHintClass}>Tags</span>
            <input
              className={fieldControlClass}
              onChange={(event) => setBatchTagsText(event.target.value)}
              placeholder="city, night, texture"
              type="text"
              value={batchTagsText}
            />
          </label>
          <label className={`${fieldLabelClass} col-span-full`}>
            <span className={fieldHintClass}>Description</span>
            <textarea
              className={`${fieldControlClass} resize-y`}
              onChange={(event) => setBatchDescription(event.target.value)}
              rows={4}
              value={batchDescription}
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={fieldHintClass}>Sort at</span>
            <input
              className={fieldControlClass}
              onChange={(event) => setBatchSortAt(event.target.value)}
              type="datetime-local"
              value={batchSortAt}
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={fieldHintClass}>Taken at</span>
            <input
              className={fieldControlClass}
              onChange={(event) => setBatchTakenAt(event.target.value)}
              type="datetime-local"
              value={batchTakenAt}
            />
          </label>
        </div>

        {batchError ? <p className={formErrorClass}>{batchError}</p> : null}
        <button
          className={primaryActionClass}
          disabled={batchReadyCount === 0 || batchIsBusy}
          type="submit"
        >
          {batchIsBusy ? 'Working' : `Upload ${batchReadyCount} images`}
        </button>
      </form>
    </main>
  )
}
