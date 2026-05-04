import { Link } from 'react-router'
import { PageHeading } from '../components/PageHeading'
import type { GalleryTag } from '../types'

export function TagsPage({ tags }: { tags: GalleryTag[] }) {
  return (
    <main className="max-w-[900px]">
      <PageHeading eyebrow="Browse by subject" title="Tags" />
      <div className="flex flex-wrap gap-2.5">
        {tags.map((tag) => (
          <Link
            className="inline-flex min-w-[150px] items-center justify-between gap-3 rounded-full border border-[var(--border)] bg-[var(--soft)] px-3.5 py-3 text-[var(--ink)] no-underline"
            key={tag.slug}
            to={`/tags/${tag.slug}`}
          >
            <span>#{tag.tag}</span>
            <small className="text-[var(--muted)]">{tag.count}</small>
          </Link>
        ))}
      </div>
    </main>
  )
}
