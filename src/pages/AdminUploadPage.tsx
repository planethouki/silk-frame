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

function currentDateTimeLocal() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function AdminUploadPage({ user }: { user: User | null }) {
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

    await Promise.all(
      uploadableItems.map(async (item) => {
        if (!item.prepared) return

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
        } catch (caughtError) {
          updateBatchItem(item.id, {
            status: 'error',
            error:
              caughtError instanceof Error ? caughtError.message : 'Upload failed.',
          })
        }
      }),
    )
  }

  if (!user) {
    return (
      <main className="placeholder-page">
        <p className="eyebrow">Protected route</p>
        <h1>Upload</h1>
        <p>管理者ログイン後に画像をアップロードできます。</p>
        <Link className="text-link" to="/admin">
          Admin login
        </Link>
      </main>
    )
  }

  return (
    <main className="upload-page">
      <section>
        <p className="eyebrow">Admin upload</p>
        <h1>Upload</h1>
        <p>
          原本画像を選択すると、ブラウザ上で表示用画像とサムネイルを WebP
          生成して S3 へ直接アップロードします。
        </p>
      </section>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-picker">
          <span>Image</span>
          <input
            accept="image/*"
            onChange={(event) =>
              void handleFileChange(event.currentTarget.files?.[0] ?? null)
            }
            required
            type="file"
          />
        </label>

        {previewUrl ? (
          <div className="upload-preview">
            <img src={previewUrl} alt="" />
            {prepared ? (
              <dl>
                <div>
                  <dt>Original</dt>
                  <dd>
                    {prepared.width} x {prepared.height}
                  </dd>
                </div>
                <div>
                  <dt>Display</dt>
                  <dd>{Math.round(prepared.display.size / 1024)} KB</dd>
                </div>
                <div>
                  <dt>Thumb</dt>
                  <dd>{Math.round(prepared.thumb.size / 1024)} KB</dd>
                </div>
              </dl>
            ) : null}
          </div>
        ) : null}

        <div className="form-grid">
          <label>
            <span>Title</span>
            <input
              onChange={(event) => setTitle(event.target.value)}
              required
              type="text"
              value={title}
            />
          </label>
          <label>
            <span>Visibility</span>
            <select
              onChange={(event) =>
                setVisibility(event.target.value === 'private' ? 'private' : 'public')
              }
              value={visibility}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className="wide-field">
            <span>Description</span>
            <textarea
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              value={description}
            />
          </label>
          <label>
            <span>Tags</span>
            <input
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="city, night, texture"
              type="text"
              value={tagsText}
            />
          </label>
          <label>
            <span>Sort at</span>
            <input
              onChange={(event) => setSortAt(event.target.value)}
              type="datetime-local"
              value={sortAt}
            />
          </label>
          <label>
            <span>Taken at</span>
            <input
              onChange={(event) => setTakenAt(event.target.value)}
              type="datetime-local"
              value={takenAt}
            />
          </label>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {status === 'done' ? (
          <p className="form-success">
            アップロードしました。Image ID: {createdImageId}
          </p>
        ) : null}

        <button
          className="primary-action"
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
        <p className="eyebrow">Batch upload</p>
        <h2>Multiple images</h2>
        <p>
          Select several images, confirm each title, and upload them together with
          shared metadata.
        </p>
      </section>

      <form className="upload-form batch-upload-form" onSubmit={handleBatchSubmit}>
        <label className="file-picker">
          <span>Images</span>
          <input
            accept="image/*"
            multiple
            onChange={(event) => void handleBatchFileChange(event.currentTarget.files)}
            type="file"
          />
        </label>

        {batchItems.length > 0 ? (
          <div className="batch-upload-list" aria-label="Selected images">
            {batchItems.map((item) => (
              <article className="batch-upload-item" key={item.id}>
                <img src={item.previewUrl} alt="" />
                <div>
                  <label>
                    <span>Title</span>
                    <input
                      disabled={item.status === 'uploading' || item.status === 'done'}
                      onChange={(event) =>
                        handleBatchTitleChange(item.id, event.target.value)
                      }
                      required
                      type="text"
                      value={item.title}
                    />
                  </label>
                  <dl>
                    <div>
                      <dt>Status</dt>
                      <dd>{item.status}</dd>
                    </div>
                    {item.prepared ? (
                      <>
                        <div>
                          <dt>Original</dt>
                          <dd>
                            {item.prepared.width} x {item.prepared.height}
                          </dd>
                        </div>
                        <div>
                          <dt>Display</dt>
                          <dd>{Math.round(item.prepared.display.size / 1024)} KB</dd>
                        </div>
                      </>
                    ) : null}
                    {item.imageId ? (
                      <div>
                        <dt>Image ID</dt>
                        <dd>{item.imageId}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {item.error ? <p className="form-error">{item.error}</p> : null}
                  <button
                    className="secondary-action"
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

        <div className="form-grid">
          <label>
            <span>Visibility</span>
            <select
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
          <label>
            <span>Tags</span>
            <input
              onChange={(event) => setBatchTagsText(event.target.value)}
              placeholder="city, night, texture"
              type="text"
              value={batchTagsText}
            />
          </label>
          <label className="wide-field">
            <span>Description</span>
            <textarea
              onChange={(event) => setBatchDescription(event.target.value)}
              rows={4}
              value={batchDescription}
            />
          </label>
          <label>
            <span>Sort at</span>
            <input
              onChange={(event) => setBatchSortAt(event.target.value)}
              type="datetime-local"
              value={batchSortAt}
            />
          </label>
          <label>
            <span>Taken at</span>
            <input
              onChange={(event) => setBatchTakenAt(event.target.value)}
              type="datetime-local"
              value={batchTakenAt}
            />
          </label>
        </div>

        {batchError ? <p className="form-error">{batchError}</p> : null}
        <button
          className="primary-action"
          disabled={batchReadyCount === 0 || batchIsBusy}
          type="submit"
        >
          {batchIsBusy ? 'Working' : `Upload ${batchReadyCount} images`}
        </button>
      </form>
    </main>
  )
}
