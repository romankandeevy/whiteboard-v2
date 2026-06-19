import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from './lib/supabase'

interface AuthProps {
  mode: 'sign-in' | 'sign-up'
}

export default function Auth({ mode }: AuthProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8])
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8])

  function handleMouseMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  function handleMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    if (mode === 'sign-up') {
      setNotice('Check your email to confirm your account.')
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-bg-gradient" />
      <div className="auth-bg-noise" />
      <div className="auth-bg-glow auth-bg-glow-top" />
      <motion.div
        className="auth-bg-glow auth-bg-glow-top-soft"
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        className="auth-bg-glow auth-bg-glow-bottom"
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', delay: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="auth-card-wrap"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="auth-card-tilt"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="auth-card-group">
            <div className="auth-beams">
              <motion.div
                className="auth-beam auth-beam-top"
                animate={{ left: ['-50%', '100%'], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  left: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror' },
                }}
              />
              <motion.div
                className="auth-beam auth-beam-right"
                animate={{ top: ['-50%', '100%'], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  top: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 0.6 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 0.6 },
                }}
              />
              <motion.div
                className="auth-beam auth-beam-bottom"
                animate={{ right: ['-50%', '100%'], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  right: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 1.2 },
                }}
              />
              <motion.div
                className="auth-beam auth-beam-left"
                animate={{ bottom: ['-50%', '100%'], opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  bottom: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.8 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 1.8 },
                }}
              />
            </div>

            <div className="auth-card">
              <div className="auth-card-pattern" />

              <div className="auth-card-header">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="auth-logo"
                >
                  <span>B</span>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="auth-heading"
                >
                  {mode === 'sign-in' ? 'Welcome back' : 'Create an account'}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="auth-subheading"
                >
                  {mode === 'sign-in' ? 'Sign in to continue to Board' : 'Sign up to start on Board'}
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                <div
                  className={`auth-field ${focusedInput === 'email' ? 'is-focused' : ''}`}
                >
                  <Mail className="auth-field-icon" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div
                  className={`auth-field ${focusedInput === 'password' ? 'is-focused' : ''}`}
                >
                  <Lock className="auth-field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="auth-field-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <Eye /> : <EyeOff />}
                  </button>
                </div>

                {error && <p className="auth-error">{error}</p>}
                {notice && <p className="auth-notice">{notice}</p>}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="auth-submit"
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="auth-spinner"
                      />
                    ) : (
                      <motion.span
                        key="text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="auth-submit-label"
                      >
                        {mode === 'sign-in' ? 'Sign in' : 'Create account'}
                        <ArrowRight className="auth-submit-arrow" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <motion.p
                  className="auth-switch-line"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {mode === 'sign-in' ? "Don't have an account? " : 'Already have an account? '}
                  <Link className="auth-switch" to={mode === 'sign-in' ? '/sign-up' : '/sign-in'}>
                    {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
                  </Link>
                </motion.p>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
