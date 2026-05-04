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
    <main className="grid max-w-[760px] gap-6 max-[760px]:block">
      <section>
        <p className="mb-2 mt-0 text-[13px] font-[650] uppercase text-[var(--muted)]">
          Owner area
        </p>
        <h1>Admin</h1>
        <p className="mb-0 mt-3.5 text-[var(--text)]">
          Sign in with Firebase Authentication to unlock protected gallery operations.
        </p>
      </section>
      <div className="flex justify-between gap-[18px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 max-[760px]:flex-col max-[760px]:items-stretch">
        {hasFirebaseConfig ? (
          user ? (
            <>
              <div className="grid gap-1">
                <strong>{user.displayName ?? user.email}</strong>
                <span className="text-[var(--muted)]">Signed in</span>
              </div>
              <div className="flex items-center gap-2.5 max-[760px]:flex-col max-[760px]:items-stretch">
                <Link
                  className="rounded-full border border-[var(--border)] bg-[var(--soft)] px-4 py-2.5 text-[var(--ink)] no-underline"
                  to="/admin/upload"
                >
                  Upload image
                </Link>
                <button
                  className="rounded-full border-0 bg-[var(--ink)] px-4 py-2.5 font-[inherit] text-[var(--surface)] disabled:cursor-wait disabled:opacity-[0.62]"
                  type="button"
                  onClick={signOutAdmin}
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <form className="grid w-[min(100%,360px)] gap-3.5" onSubmit={handleSubmit}>
              <label className="grid gap-1.5 text-[var(--ink)]">
                <span className="text-[13px] text-[var(--muted)]">Email</span>
                <input
                  autoComplete="email"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 py-2.5 font-[inherit] text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label className="grid gap-1.5 text-[var(--ink)]">
                <span className="text-[13px] text-[var(--muted)]">Password</span>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 py-2.5 font-[inherit] text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
              {error ? (
                <p className="m-0 text-sm text-[#a13d2d]">{error}</p>
              ) : null}
              <button
                className="rounded-full border-0 bg-[var(--ink)] px-4 py-2.5 font-[inherit] text-[var(--surface)] disabled:cursor-wait disabled:opacity-[0.62]"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in' : 'Sign in'}
              </button>
            </form>
          )
        ) : (
          <p className="m-0 text-[var(--text)]">
            Add Firebase environment variables to enable Authentication and live
            Firestore reads.
          </p>
        )}
      </div>
    </main>
  )
}
