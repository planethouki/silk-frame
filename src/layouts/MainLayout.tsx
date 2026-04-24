import { Link, Outlet } from 'react-router'

export function MainLayout() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <Link className="brand-button" to="/">
          silk-frame
        </Link>
        <nav className="main-nav" aria-label="Primary navigation">
          <Link to="/">Gallery</Link>
          <Link to="/tags">Tags</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
