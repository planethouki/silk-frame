import type { User } from 'firebase/auth'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { Link, Outlet } from 'react-router'

export function MainLayout({ user }: { user: User | null }) {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <Link className="brand-button" to="/">
          Silk Frame
        </Link>
        <nav className="main-nav" aria-label="Primary navigation">
          <Link to="/">Gallery</Link>
          <Link to="/tags">Tags</Link>
        </nav>
        <div className="header-actions">
          {user ? <Link to="/admin/upload">Upload</Link> : null}
          <Link className="admin-icon-link" to="/admin" aria-label="Admin">
            <Cog6ToothIcon />
          </Link>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
