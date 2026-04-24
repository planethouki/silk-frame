import type { User } from 'firebase/auth'

export function PlaceholderPage({
  title,
  user,
}: {
  title: string
  user: User | null
}) {
  return (
    <main className="placeholder-page">
      <p className="eyebrow">{user ? 'Admin route' : 'Protected route'}</p>
      <h1>{title}</h1>
      <p>This route is reserved for the next implementation phase.</p>
    </main>
  )
}
