import { supabase } from './supabase'

export type AuthCode =
  | 'already_registered'
  | 'invalid_email'
  | 'weak_password'
  | 'rate_limited'
  | 'email_not_configured'
  | 'email_send_failed'
  | 'invalid_code'
  | 'expired'
  | 'too_many_attempts'
  | 'network'
  | 'unknown'

type FnResult = { ok: true } | { ok: false; code: AuthCode }

async function callFn(fn: string, body: Record<string, unknown>): Promise<FnResult> {
  try {
    const { data, error } = await supabase.functions.invoke(fn, { body })
    if (error) {
      let code: AuthCode = 'unknown'
      const ctx = (error as { context?: Response }).context
      if (ctx && typeof ctx.json === 'function') {
        try {
          const parsed = await ctx.json()
          if (parsed?.error) code = parsed.error as AuthCode
        } catch {
          /* non-JSON body */
        }
      }
      return { ok: false, code }
    }
    if (data?.error) return { ok: false, code: data.error as AuthCode }
    return { ok: true }
  } catch {
    return { ok: false, code: 'network' }
  }
}

/** Create an unconfirmed account and email a 6-digit verification code. */
export function requestSignupCode(email: string, password: string) {
  return callFn('auth-signup', { email, password })
}

/** Check the code; on success the account's email is marked confirmed. */
export function verifySignupCode(email: string, code: string) {
  return callFn('auth-verify', { email, code })
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

const MESSAGES: Record<AuthCode, string> = {
  already_registered: 'This email is already registered — try signing in instead.',
  invalid_email: 'That email address looks invalid.',
  weak_password: 'Password must be at least 6 characters.',
  rate_limited: 'A code was just sent. Wait a few seconds before requesting another.',
  email_not_configured: 'Email delivery isn’t configured yet. Add your Resend API key in Supabase.',
  email_send_failed: 'We couldn’t send the email just now. Please try again shortly.',
  invalid_code: 'That code isn’t right. Double-check your inbox and try again.',
  expired: 'That code has expired. Request a fresh one.',
  too_many_attempts: 'Too many attempts. Request a new code to continue.',
  network: 'Network error — check your connection and try again.',
  unknown: 'Something went wrong. Please try again.',
}

export function authMessage(code: AuthCode): string {
  return MESSAGES[code] ?? MESSAGES.unknown
}
