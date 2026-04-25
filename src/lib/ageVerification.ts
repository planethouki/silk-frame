const ageCookieName = 'silk_frame_age_verified'
const verifiedValue = '18plus'
const maxAgeSeconds = 60 * 60 * 24 * 365

export function hasAgeVerificationCookie() {
  if (typeof document === 'undefined') return false

  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie === `${ageCookieName}=${verifiedValue}`)
}

export function saveAgeVerificationCookie() {
  if (typeof document === 'undefined') return

  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${ageCookieName}=${verifiedValue}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secureFlag}`
}
