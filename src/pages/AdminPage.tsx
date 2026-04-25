import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { AdminSession } from '../types'

export function AdminPage({
  user,
  signIn,
  signOutAdmin,
  hasFirebaseConfig,
}: AdminSession) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await signIn(email, password)
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-page">
      <section>
        <p className="eyebrow">Owner area</p>
        <h1>Admin</h1>
        <p>
          Sign in with Firebase Authentication to unlock protected gallery operations.
        </p>
      </section>
      <div className="admin-panel">
        {hasFirebaseConfig ? (
          user ? (
            <>
              <div>
                <strong>{user.displayName ?? user.email}</strong>
                <span>Signed in</span>
              </div>
              <div className="admin-actions">
                <Link to="/admin/upload">Upload image</Link>
                <button type="button" onClick={signOutAdmin}>
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <form className="admin-login-form" onSubmit={handleSubmit}>
              <label>
                <span>Email</span>
                <input
                  autoComplete="email"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in' : 'Sign in'}
              </button>
            </form>
          )
        ) : (
          <p>
            Add Firebase environment variables to enable Authentication and live
            Firestore reads.
          </p>
        )}
      </div>
    </main>
  )
}
