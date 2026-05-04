import type { User } from 'firebase/auth'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { Link, Outlet } from 'react-router'

export function MainLayout({ user }: { user: User | null }) {
  return (
    <div className="min-h-[100svh]">
      <header className="sticky top-0 z-10 grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-7 max-[760px]:static max-[760px]:grid-cols-[1fr_auto] max-[760px]:gap-2.5 max-[760px]:p-4">
        <Link
          className="bg-transparent py-2 font-[var(--serif)] text-[23px] leading-none text-[var(--ink)] no-underline"
          to="/"
        >
          Silk Frame
        </Link>
        <nav
          className="flex justify-center gap-1 max-[760px]:order-2 max-[760px]:col-span-full max-[760px]:justify-start"
          aria-label="Primary navigation"
        >
          <Link
            className="rounded-full px-3 py-2 text-[var(--muted)] no-underline hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:bg-[var(--soft)] focus-visible:text-[var(--ink)] focus-visible:outline-none"
            to="/"
          >
            Gallery
          </Link>
          <Link
            className="rounded-full px-3 py-2 text-[var(--muted)] no-underline hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:bg-[var(--soft)] focus-visible:text-[var(--ink)] focus-visible:outline-none"
            to="/tags"
          >
            Tags
          </Link>
        </nav>
        <div className="flex items-center justify-end gap-1">
          {user ? (
            <Link
              className="rounded-full px-3 py-2 text-[var(--muted)] no-underline hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:bg-[var(--soft)] focus-visible:text-[var(--ink)] focus-visible:outline-none"
              to="/admin/upload"
            >
              Upload
            </Link>
          ) : null}
          <Link
            className="inline-flex h-9 w-9 items-center justify-center rounded-full p-0 text-[var(--muted)] no-underline hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:bg-[var(--soft)] focus-visible:text-[var(--ink)] focus-visible:outline-none [&_svg]:h-[18px] [&_svg]:w-[18px]"
            to="/admin"
            aria-label="Admin"
          >
            <Cog6ToothIcon />
          </Link>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
