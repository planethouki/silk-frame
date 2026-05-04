import { Link } from 'react-router'
import type { GalleryImage, GalleryThumbSettings } from '../types'

export function GalleryGrid({
  images,
  thumbSettings,
}: {
  images: GalleryImage[]
  thumbSettings: GalleryThumbSettings
}) {
  const tileClassName = [
    'group relative block overflow-hidden bg-[var(--soft)] p-0 no-underline',
    thumbSettings.frame === 'portrait' ? 'aspect-[3/4]' : 'aspect-square',
  ].join(' ')
  const imageClassName = [
    'h-full w-full object-center transition-[scale,filter] duration-[220ms] ease-in-out group-hover:scale-[1.035] group-hover:saturate-[1.08] group-focus-visible:scale-[1.035] group-focus-visible:saturate-[1.08]',
    thumbSettings.fit === 'contain' ? 'object-contain' : 'object-cover',
    thumbSettings.verticalAlign === 'top'
      ? 'object-top'
      : thumbSettings.verticalAlign === 'bottom'
        ? 'object-bottom'
        : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section
      aria-label="Image gallery"
      className="grid grid-cols-3 gap-[3px] max-[760px]:gap-0.5"
    >
      {images.map((image) => (
        <Link className={tileClassName} key={image.id} to={`/images/${image.id}`}>
          <img
            className={imageClassName}
            src={image.thumbUrl}
            alt={image.title}
            loading="lazy"
          />
          <span className="absolute bottom-0 left-0 box-border w-full bg-gradient-to-b from-transparent to-black/70 px-3 pb-3 pt-[42px] text-left text-sm text-white opacity-0 transition-opacity duration-[180ms] group-hover:opacity-100 group-focus-visible:opacity-100">
            {image.title}
          </span>
        </Link>
      ))}
    </section>
  )
}
