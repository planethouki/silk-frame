import type { ReactNode } from 'react'
import type { LoadState } from '../types'

export function PageHeading({
  eyebrow,
  title,
  loadState,
  imageCount,
  actions,
}: {
  eyebrow: string
  title: string
  loadState?: LoadState
  imageCount?: number
  actions?: ReactNode
}) {
  return (
    <section className="mb-6 flex items-end justify-between max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-3.5">
      <div>
        <p className="mb-2 mt-0 text-[13px] font-[650] uppercase text-[var(--muted)]">
          {eyebrow}
        </p>
        <h1>{title}</h1>
      </div>
      <div className="flex items-center gap-2.5">
        {loadState ? (
          <p className="m-0 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--soft)] px-3 py-[7px] text-sm text-[var(--muted)]">
            {loadState === 'loading'
              ? 'Loading'
              : loadState === 'offline'
                ? 'Preview data'
                : `${imageCount ?? 0} images`}
          </p>
        ) : null}
        {actions}
      </div>
    </section>
  )
}
