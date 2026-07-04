import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'
import { supabase } from './lib/supabase'
import { requestSignupCode, verifySignupCode, signInWithGoogle, authMessage } from './lib/auth'
import CodeInput from './CodeInput'

interface AuthProps {
  mode: 'sign-in' | 'sign-up'
}

const RESEND_COOLDOWN = 45

export default function Auth({ mode }: AuthProps) {
  const [step, setStep] = useState<'credentials' | 'code'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setError('Couldn’t start Google sign-in. Make sure the provider is enabled in Supabase.')
      setGoogleLoading(false)
    }
  }

  async function handleCredentials(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'sign-in') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (!signInError) return // session change navigates away
      const unconfirmed =
        (signInError as { code?: string }).code === 'email_not_confirmed' ||
        /not confirmed/i.test(signInError.message)
      if (unconfirmed) {
        const res = await requestSignupCode(email, password)
        setLoading(false)
        if (res.ok) {
          setStep('code')
          setResendIn(RESEND_COOLDOWN)
        } else {
          setError(authMessage(res.code))
        }
        return
      }
      setLoading(false)
      setError(/invalid login/i.test(signInError.message) ? 'Wrong email or password.' : signInError.message)
      return
    }

    const res = await requestSignupCode(email, password)
    setLoading(false)
    if (res.ok) {
      setCode('')
      setStep('code')
      setResendIn(RESEND_COOLDOWN)
    } else {
      setError(authMessage(res.code))
    }
  }

  async function handleVerify(value: string) {
    setError(null)
    setLoading(true)
    const res = await verifySignupCode(email, value)
    if (!res.ok) {
      setLoading(false)
      setCode('')
      setError(authMessage(res.code))
      return
    }
    // Email confirmed — sign in with the credentials we already have.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (signInError) setError('Verified! Please sign in with your password.')
    // On success the session listener redirects.
  }

  async function handleResend() {
    if (resendIn > 0) return
    setError(null)
    const res = await requestSignupCode(email, password)
    if (res.ok) {
      setResendIn(RESEND_COOLDOWN)
    } else {
      setError(authMessage(res.code))
    }
  }

  return (
    <div className="auth">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-glow" aria-hidden="true" />

      <motion.div
        className="auth-panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-brand">
          <span className="auth-mark">B</span>
          <span className="auth-wordmark">Board</span>
        </div>

        <div className="auth-card">
          <AnimatePresence mode="wait" initial={false}>
            {step === 'credentials' ? (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="auth-title">
                  {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="auth-sub">
                  {mode === 'sign-in'
                    ? 'Sign in to open your boards.'
                    : 'Start sketching in seconds — no clutter.'}
                </p>

                <button
                  type="button"
                  className="auth-google"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                >
                  <GoogleIcon />
                  {googleLoading ? 'Connecting…' : 'Continue with Google'}
                </button>

                <div className="auth-divider">
                  <span>or with email</span>
                </div>

                <form onSubmit={handleCredentials} className="auth-form">
                  <label className="auth-field">
                    <Mail className="auth-field-icon" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </label>

                  <label className="auth-field">
                    <Lock className="auth-field-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      className="auth-field-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <Eye /> : <EyeOff />}
                    </button>
                  </label>

                  {error && <p className="auth-error">{error}</p>}

                  <button type="submit" className="auth-submit" disabled={loading}>
                    {loading ? (
                      <span className="auth-spinner" />
                    ) : (
                      <>
                        {mode === 'sign-in' ? 'Sign in' : 'Continue'}
                        <ArrowRight className="auth-submit-arrow" />
                      </>
                    )}
                  </button>
                </form>

                <p className="auth-switch-line">
                  {mode === 'sign-in' ? 'New to Board? ' : 'Already have an account? '}
                  <Link className="auth-switch" to={mode === 'sign-in' ? '/sign-up' : '/sign-in'}>
                    {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  type="button"
                  className="auth-back"
                  onClick={() => {
                    setStep('credentials')
                    setError(null)
                  }}
                >
                  <ArrowLeft />
                  Back
                </button>

                <h1 className="auth-title">Check your inbox</h1>
                <p className="auth-sub">
                  We sent a 6-digit code to <strong>{email}</strong>. Enter it below to confirm your
                  account.
                </p>

                <CodeInput
                  value={code}
                  onChange={setCode}
                  onComplete={handleVerify}
                  disabled={loading}
                />

                {error && <p className="auth-error auth-error-center">{error}</p>}

                <button
                  type="button"
                  className="auth-submit"
                  disabled={loading || code.length < 6}
                  onClick={() => handleVerify(code)}
                >
                  {loading ? <span className="auth-spinner" /> : 'Verify & continue'}
                </button>

                <p className="auth-switch-line">
                  Didn’t get it?{' '}
                  {resendIn > 0 ? (
                    <span className="auth-resend-wait">Resend in {resendIn}s</span>
                  ) : (
                    <button type="button" className="auth-switch" onClick={handleResend}>
                      Resend code
                    </button>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="auth-legal">Boards autosave to the cloud. One canvas, every device.</p>
      </motion.div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}
