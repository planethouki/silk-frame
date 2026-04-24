import { Link } from 'react-router'
import { PageHeading } from '../components/PageHeading'
import type { GalleryTag } from '../types'

export function TagsPage({ tags }: { tags: GalleryTag[] }) {
  return (
    <main className="tags-page">
      <PageHeading eyebrow="Browse by subject" title="Tags" />
      <div className="tag-list">
        {tags.map((tag) => (
          <Link key={tag.slug} to={`/tags/${tag.slug}`}>
            <span>#{tag.tag}</span>
            <small>{tag.count}</small>
          </Link>
        ))}
      </div>
    </main>
  )
}
