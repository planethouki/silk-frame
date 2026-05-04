import type { User } from 'firebase/auth'

export function PlaceholderPage({
  title,
  user,
}: {
  title: string
  user: User | null
}) {
  return (
    <main className="grid max-w-[760px] gap-6 max-[760px]:block">
      <p className="mb-2 mt-0 text-[13px] font-[650] uppercase text-[var(--muted)]">
        {user ? 'Admin route' : 'Protected route'}
      </p>
      <h1>{title}</h1>
      <p className="mb-0 mt-3.5 text-[var(--text)]">
        This route is reserved for the next implementation phase.
      </p>
    </main>
  )
}
