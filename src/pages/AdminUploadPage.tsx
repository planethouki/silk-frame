import type { User } from 'firebase/auth'
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { prepareImageUpload, type PreparedImageUpload } from '../lib/imageProcessing'
import { uploadImage } from '../lib/uploadApi'

type UploadStatus = 'idle' | 'processing' | 'uploading' | 'done' | 'error'

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

  const previewUrl = useMemo(() => {
    if (!file) return ''
    return URL.createObjectURL(file)
  }, [file])

  const tags = tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

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
    </main>
  )
}
