import type { LoadState } from '../types'

export function PageHeading({
  eyebrow,
  title,
  loadState,
  imageCount,
}: {
  eyebrow: string
  title: string
  loadState?: LoadState
  imageCount?: number
}) {
  return (
    <section className="gallery-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {loadState ? (
        <p className="status-pill">
          {loadState === 'loading'
            ? 'Loading'
            : loadState === 'offline'
              ? 'Preview data'
              : `${imageCount ?? 0} images`}
        </p>
      ) : null}
    </section>
  )
}
