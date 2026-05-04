import { Link, useNavigate, useParams } from 'react-router'
import { useMemo, useState, type FormEvent } from 'react'
import {
  InformationCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ContentNotice } from '../components/ContentNotice'
import { RatingControl } from '../components/RatingControl'
import { TouchImageViewer } from '../components/TouchImageViewer'
import { deleteImage } from '../lib/deleteImageApi'
import { slugify } from '../lib/gallery'
import { getHighResolutionImageUrl } from '../lib/highResolutionApi'
import { updateImageMetadata } from '../lib/metadataApi'
import { updateImageRating } from '../lib/ratingsApi'
import { PlaceholderPage } from './PlaceholderPage'
import type { GalleryImage, ImageRating } from '../types'
import type { User } from 'firebase/auth'

const iconActionClass =
  'inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--ink)] hover:bg-[var(--soft)] focus-visible:bg-[var(--soft)] focus-visible:outline-none disabled:cursor-wait disabled:opacity-[0.62] [&_svg]:h-[17px] [&_svg]:w-[17px]'
const iconActionDangerClass = `${iconActionClass} text-[#a13d2d] hover:border-[#e7b7aa] hover:bg-[#f9e5df] focus-visible:border-[#e7b7aa] focus-visible:bg-[#f9e5df]`
const primaryActionClass =
  'justify-self-start rounded-full border-0 bg-[var(--ink)] px-[18px] py-2.5 font-[inherit] text-[var(--surface)] disabled:cursor-wait disabled:opacity-[0.62]'
const secondaryActionClass =
  'justify-self-start rounded-full border border-[var(--border)] bg-[var(--soft)] px-3.5 py-2 font-[inherit] text-[var(--ink)] disabled:cursor-wait disabled:opacity-[0.62]'
const dangerActionClass =
  'rounded-full border-0 bg-[#a13d2d] px-4 py-2.5 font-[inherit] text-[var(--surface)] disabled:cursor-wait disabled:opacity-[0.62]'
const formInputClass =
  'w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 py-2.5 font-[inherit] text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none disabled:cursor-wait disabled:opacity-70'

export function ImageDetailPage({
  images,
  user,
  onImageChange,
  onImageDelete,
}: {
  images: GalleryImage[]
  user: User | null
  onImageChange: (image: GalleryImage) => void
  onImageDelete: (imageId: string) => void
}) {
  const navigate = useNavigate()
  const { imageId } = useParams()
  const currentIndex = images.findIndex((item) => item.id === imageId)
  const image = currentIndex >= 0 ? images[currentIndex] : undefined
  const [highResRequest, setHighResRequest] = useState<{
    imageId: string
    status: 'loading' | 'ready' | 'error'
    url?: string
    expiresAt?: string
  } | null>(null)
  const [ratingStatus, setRatingStatus] = useState<
    'idle' | 'saving-heart' | 'saving-star' | 'error'
  >('idle')
  const [isEditingRatings, setIsEditingRatings] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isEditingMetadata, setIsEditingMetadata] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'error'>(
    'idle',
  )
  const [metadataDraftImageId, setMetadataDraftImageId] = useState('')
  const [metadataTitle, setMetadataTitle] = useState('')
  const [metadataDescription, setMetadataDescription] = useState('')
  const [metadataTagsText, setMetadataTagsText] = useState('')
  const [metadataStatus, setMetadataStatus] = useState<'idle' | 'saving' | 'error'>(
    'idle',
  )
  const viewerSlides = useMemo(
    () =>
      images.map((item) => ({
        alt: item.title,
        height: item.height,
        src: item.displayUrl,
        width: item.width,
      })),
    [images],
  )

  if (!image) {
    return <PlaceholderPage title="Image not found" user={user} />
  }

  const isMetadataDraftCurrent = metadataDraftImageId === image.id
  const metadataFormTitle = isMetadataDraftCurrent ? metadataTitle : image.title
  const metadataFormDescription = isMetadataDraftCurrent
    ? metadataDescription
    : image.description
  const metadataFormTagsText = isMetadataDraftCurrent
    ? metadataTagsText
    : image.tags.join(', ')

  const changeViewerIndex = (nextIndex: number) => {
    const nextImage = images[nextIndex]
    if (!nextImage || nextImage.id === image.id) return
    navigate(`/images/${nextImage.id}`)
  }

  const goBackToList = () => {
    window.requestAnimationFrame(() => {
      navigate('/')
    })
  }

  const currentHighRes =
    highResRequest?.imageId === image.id ? highResRequest : null
  const highResState = currentHighRes?.status ?? 'idle'
  const highResUrl = currentHighRes?.url ?? ''

  const requestHighResolutionImage = async () => {
    setHighResRequest({ imageId: image.id, status: 'loading' })

    try {
      const result = await getHighResolutionImageUrl(image.id)
      setHighResRequest({
        imageId: image.id,
        status: 'ready',
        url: result.url,
        expiresAt: result.expiresAt,
      })
    } catch {
      setHighResRequest({ imageId: image.id, status: 'error' })
    }
  }

  const highResExpiresText = currentHighRes?.expiresAt
    ? new Date(currentHighRes.expiresAt).toLocaleTimeString()
    : ''

  const saveRating = async (ratingKind: 'heart' | 'star', value: ImageRating) => {
    const previousImage = image
    const nextImage = {
      ...image,
      [ratingKind === 'heart' ? 'heartRating' : 'starRating']: value,
    }

    onImageChange(nextImage)
    setRatingStatus(ratingKind === 'heart' ? 'saving-heart' : 'saving-star')

    try {
      await updateImageRating(image.id, ratingKind, value)
      setRatingStatus('idle')
    } catch {
      onImageChange(previousImage)
      setRatingStatus('error')
    }
  }

  const saveMetadata = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const title = metadataFormTitle.trim()
    const description = metadataFormDescription.trim()
    const tags = metadataFormTagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (!title) {
      setMetadataStatus('error')
      return
    }

    const previousImage = image
    const nextImage = {
      ...image,
      title,
      description,
      tags,
    }

    onImageChange(nextImage)
    setMetadataStatus('saving')

    try {
      await updateImageMetadata({
        imageId: image.id,
        title,
        description,
        tags,
      })
      setMetadataStatus('idle')
      setIsEditingMetadata(false)
    } catch {
      onImageChange(previousImage)
      setMetadataStatus('error')
    }
  }

  const confirmDeleteImage = async () => {
    setDeleteStatus('deleting')

    try {
      await deleteImage(image.id)
      onImageDelete(image.id)
      navigate('/')
    } catch {
      setDeleteStatus('error')
    }
  }

  return (
    <main className="max-w-[980px] max-[760px]:px-0">
      <button
        className="mb-[18px] rounded-full bg-[var(--soft)] px-[13px] py-2 text-[var(--ink)] max-[760px]:mx-3"
        type="button"
        onClick={goBackToList}
      >
        Back
      </button>
      <ContentNotice />
      <article className="grid grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-7 max-[760px]:block">
        <TouchImageViewer
          currentIndex={currentIndex}
          key={image.id}
          onIndexChange={changeViewerIndex}
          slides={viewerSlides}
        />
        <div className="min-w-0 self-end pb-2.5 max-[760px]:mx-3 max-[760px]:pt-[22px]">
          {user ? (
            <>
              <div className="mb-3 flex gap-2">
                <button
                  aria-expanded={isInfoOpen}
                  aria-label={
                    isInfoOpen ? 'Hide image information' : 'Show image information'
                  }
                  className={iconActionClass}
                  onClick={() => setIsInfoOpen((current) => !current)}
                  type="button"
                >
                  {isInfoOpen ? <XMarkIcon /> : <InformationCircleIcon />}
                </button>
              <button
                aria-expanded={isEditingMetadata}
                aria-label={
                  isEditingMetadata ? 'Close metadata editor' : 'Edit metadata'
                }
                className={iconActionClass}
                onClick={() =>
                  setIsEditingMetadata((current) => {
                    const next = !current
                    if (next) {
                      setMetadataStatus('idle')
                      setMetadataDraftImageId(image.id)
                      setMetadataTitle(image.title)
                      setMetadataDescription(image.description)
                      setMetadataTagsText(image.tags.join(', '))
                    }
                    return next
                  })
                }
                type="button"
              >
                {isEditingMetadata ? <XMarkIcon /> : <PencilSquareIcon />}
              </button>
              <button
                aria-expanded={isConfirmingDelete}
                aria-label={
                  isConfirmingDelete ? 'Close delete confirmation' : 'Delete image'
                }
                className={iconActionDangerClass}
                disabled={deleteStatus === 'deleting'}
                onClick={() => {
                  setDeleteStatus('idle')
                  setIsConfirmingDelete((current) => !current)
                }}
                type="button"
              >
                {isConfirmingDelete ? <XMarkIcon /> : <TrashIcon />}
              </button>
              </div>
              {isInfoOpen ? (
                <div className="mb-[18px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5">
                  <dl className="m-0 grid min-w-0 gap-3">
                    <div className="grid min-w-0 gap-[3px]">
                      <dt className="text-xs uppercase text-[var(--muted)]">Title</dt>
                      <dd className="m-0 break-words text-[var(--ink)] [overflow-wrap:anywhere]">
                        {image.title}
                      </dd>
                    </div>
                    <div className="grid min-w-0 gap-[3px]">
                      <dt className="text-xs uppercase text-[var(--muted)]">
                        Description
                      </dt>
                      <dd className="m-0 break-words text-[var(--ink)] [overflow-wrap:anywhere]">
                        {image.description || '-'}
                      </dd>
                    </div>
                    <div className="grid min-w-0 gap-[3px]">
                      <dt className="text-xs uppercase text-[var(--muted)]">Date</dt>
                      <dd className="m-0 break-words text-[var(--ink)] [overflow-wrap:anywhere]">
                        {image.sortAt.toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : null}
              {isConfirmingDelete ? (
                <div
                  className="mb-[18px] grid gap-3 rounded-lg border border-[#e7b7aa] bg-[#fff1ed] p-4 text-[var(--ink)]"
                  role="alertdialog"
                >
                  <p className="m-0">
                    Delete this image from the gallery? Public display and thumb
                    files in S3 will also be deleted.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={dangerActionClass}
                      disabled={deleteStatus === 'deleting'}
                      onClick={confirmDeleteImage}
                      type="button"
                    >
                      {deleteStatus === 'deleting' ? 'Deleting' : 'Delete'}
                    </button>
                    <button
                      className={secondaryActionClass}
                      disabled={deleteStatus === 'deleting'}
                      onClick={() => {
                        setDeleteStatus('idle')
                        setIsConfirmingDelete(false)
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                  {deleteStatus === 'error' ? (
                    <p className="m-0 text-[#a13d2d]" role="alert">
                      Could not delete the image.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
          {user && isEditingMetadata ? (
            <form
              className="mb-[18px] grid min-w-0 gap-3 rounded-lg border border-[#ead3a6] bg-[#fff7e8] p-3"
              onSubmit={saveMetadata}
            >
              <label className="grid min-w-0 gap-1.5 text-[var(--ink)]">
                <span className="text-[13px] text-[var(--muted)]">Title</span>
                <input
                  className={formInputClass}
                  disabled={metadataStatus === 'saving'}
                  onChange={(event) => {
                    setMetadataDraftImageId(image.id)
                    setMetadataTitle(event.target.value)
                  }}
                  required
                  type="text"
                  value={metadataFormTitle}
                />
              </label>
              <label className="grid min-w-0 gap-1.5 text-[var(--ink)]">
                <span className="text-[13px] text-[var(--muted)]">Description</span>
                <textarea
                  className={`${formInputClass} resize-y`}
                  disabled={metadataStatus === 'saving'}
                  onChange={(event) => {
                    setMetadataDraftImageId(image.id)
                    setMetadataDescription(event.target.value)
                  }}
                  rows={4}
                  value={metadataFormDescription}
                />
              </label>
              <label className="grid min-w-0 gap-1.5 text-[var(--ink)]">
                <span className="text-[13px] text-[var(--muted)]">Tags</span>
                <input
                  className={formInputClass}
                  disabled={metadataStatus === 'saving'}
                  onChange={(event) => {
                    setMetadataDraftImageId(image.id)
                    setMetadataTagsText(event.target.value)
                  }}
                  placeholder="city, night, texture"
                  type="text"
                  value={metadataFormTagsText}
                />
              </label>
              {metadataStatus === 'error' ? (
                <p className="m-0 text-[#a13d2d]" role="alert">
                  Could not update the image information. Title is required.
                </p>
              ) : null}
              <button
                className={primaryActionClass}
                disabled={metadataStatus === 'saving'}
                type="submit"
              >
                {metadataStatus === 'saving' ? 'Saving' : 'Save changes'}
              </button>
            </form>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-2">
            {image.tags.map((tag) => (
              <Link
                className="rounded-full border border-[var(--border)] bg-[var(--soft)] px-[11px] py-[7px] text-[var(--ink)] no-underline"
                key={tag}
                to={`/tags/${slugify(tag)}`}
              >
                #{tag}
              </Link>
            ))}
          </div>
          {user ? (
            <>
              <div
                className="mt-[18px] grid items-start gap-2.5 rounded-lg border-0 bg-transparent p-0"
                aria-label="Admin ratings"
              >
                <div className="inline-flex items-center gap-2 text-[var(--muted)]">
                  <span
                    className="min-w-[42px] rounded-full border border-[var(--border)] bg-[var(--soft)] px-2 py-[5px] text-center text-[13px]"
                    aria-label="Heart rating"
                  >
                    ♥ {image.heartRating ?? '-'}
                  </span>
                  <span
                    className="min-w-[42px] rounded-full border border-[var(--border)] bg-[var(--soft)] px-2 py-[5px] text-center text-[13px]"
                    aria-label="Star rating"
                  >
                    ★ {image.starRating ?? '-'}
                  </span>
                  <button
                    aria-label={
                      isEditingRatings ? 'Close rating editor' : 'Edit ratings'
                    }
                    className={iconActionClass}
                    onClick={() => setIsEditingRatings((current) => !current)}
                    type="button"
                  >
                    {isEditingRatings ? <XMarkIcon /> : <PencilSquareIcon />}
                  </button>
                </div>
                {isEditingRatings ? (
                  <div className="grid gap-3 rounded-lg border border-[#ead3a6] bg-[#fff7e8] p-3">
                    <RatingControl
                      activeSymbol="♥"
                      disabled={ratingStatus === 'saving-heart'}
                      inactiveSymbol="♡"
                      label="Heart rating"
                      onChange={(value) => void saveRating('heart', value)}
                      value={image.heartRating}
                    />
                    <RatingControl
                      activeSymbol="★"
                      disabled={ratingStatus === 'saving-star'}
                      inactiveSymbol="☆"
                      label="Star rating"
                      onChange={(value) => void saveRating('star', value)}
                      value={image.starRating}
                    />
                    {ratingStatus === 'error' ? (
                      <p className="m-0 text-[#a13d2d]" role="alert">
                        Could not update the rating.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2.5 rounded-lg border border-[#bfdacf] bg-[#eef6f2] p-3.5">
                <button
                  className={primaryActionClass}
                  type="button"
                  onClick={requestHighResolutionImage}
                  disabled={highResState === 'loading'}
                >
                  {highResState === 'loading' ? 'Loading high-res' : 'View high-res'}
                </button>
                {highResState === 'ready' ? (
                  <>
                    <a
                      className="text-[var(--ink)]"
                      href={highResUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open original
                    </a>
                    <small className="text-[var(--muted)]">
                      Signed URL expires at {highResExpiresText}
                    </small>
                  </>
                ) : null}
                {highResState === 'error' ? (
                  <p className="m-0 basis-full text-[#a13d2d]" role="alert">
                    Could not load the high-resolution image. Check your admin role
                    and Functions configuration.
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </article>
      {highResUrl ? (
        <section
          className="mt-7 max-[760px]:mx-3"
          aria-label="High-resolution preview"
        >
          <img
            className="max-h-[88svh] w-full bg-[var(--soft)] object-contain"
            src={highResUrl}
            alt={`${image.title} high resolution`}
          />
        </section>
      ) : null}
    </main>
  )
}
