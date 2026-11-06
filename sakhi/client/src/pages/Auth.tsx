import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
const signupSchema = loginSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type LoginForm = z.infer<typeof loginSchema>
type SignupForm = z.infer<typeof signupSchema>
type ResetForm = z.infer<typeof resetSchema>

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'confirm'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  )
  const [confirmedEmail, setConfirmedEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  const handleLogin = async (data: LoginForm) => {
    const { error } = await signIn(data.email, data.password)
    if (error) {
      toast('error', 'Sign in failed', error.message)
    } else {
      navigate('/dashboard')
    }
  }

  const handleSignup = async (data: SignupForm) => {
    const { error } = await signUp(data.email, data.password)
    if (error) {
      toast('error', 'Registration failed', error.message)
    } else {
      setConfirmedEmail(data.email)
      setMode('confirm')
    }
  }

  const handleReset = async (data: ResetForm) => {
    const { error } = await resetPassword(data.email)
    if (error) {
      toast('error', 'Reset failed', error.message)
    } else {
      setResetSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-sakhi-bg flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-lavender-600 to-purple-700 items-center justify-center p-12">
        <div className="text-white text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">SAKHI</h2>
          <p className="text-lavender-100 text-lg leading-relaxed mb-8">
            Your Health. Your Language. Your Understanding.
          </p>
          <p className="text-lavender-200 text-sm leading-relaxed">
            AI-powered women's health education platform with multilingual support for PCOS guidance, 
            cycle tracking and symptom understanding.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-sakhi-muted hover:text-sakhi-text mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          {mode === 'login' && (
            <>
              <h1 className="text-2xl font-bold text-sakhi-text mb-1">Welcome back</h1>
              <p className="text-sm text-sakhi-muted mb-6">Sign in to your SAKHI account</p>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-sakhi-muted" />
                    <input
                      {...loginForm.register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className="input-field pl-10"
                      autoComplete="email"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-sakhi-muted" />
                    <input
                      {...loginForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="input-field pl-10 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-sakhi-muted hover:text-sakhi-text"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode('reset')} className="text-xs text-lavender-600 hover:underline">
                    Forgot password?
                  </button>
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
              <p className="text-center text-sm text-sakhi-muted mt-6">
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-lavender-600 font-medium hover:underline">
                  Create one
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <>
              <h1 className="text-2xl font-bold text-sakhi-text mb-1">Create your account</h1>
              <p className="text-sm text-sakhi-muted mb-6">Join SAKHI — free, private and secure</p>
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-sakhi-muted" />
                    <input
                      {...signupForm.register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className="input-field pl-10"
                      autoComplete="email"
                    />
                  </div>
                  {signupForm.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-sakhi-muted" />
                    <input
                      {...signupForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      className="input-field pl-10 pr-10"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-sakhi-muted">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-sakhi-muted" />
                    <input
                      {...signupForm.register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat password"
                      className="input-field pl-10 pr-10"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-3.5 text-sakhi-muted">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <p className="text-xs text-sakhi-muted">
                  By creating an account, you agree that SAKHI is an educational platform and does not provide medical diagnosis.
                </p>
                <button type="submit" className="btn-primary w-full" disabled={signupForm.formState.isSubmitting}>
                  {signupForm.formState.isSubmitting ? 'Creating account…' : 'Create account'}
                </button>
              </form>
              <p className="text-center text-sm text-sakhi-muted mt-6">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-lavender-600 font-medium hover:underline">Sign in</button>
              </p>
            </>
          )}

          {mode === 'reset' && (
            <>
              <h1 className="text-2xl font-bold text-sakhi-text mb-1">Reset your password</h1>
              <p className="text-sm text-sakhi-muted mb-6">Enter your email and we'll send you a reset link.</p>
              {resetSent ? (
                <div className="card border-green-200 bg-green-50 text-center py-8">
                  <p className="text-green-700 font-medium mb-2">Reset email sent!</p>
                  <p className="text-sm text-green-600">Check your inbox and follow the link to reset your password.</p>
                </div>
              ) : (
                <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
                  <div>
                    <label className="label">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-sakhi-muted" />
                      <input
                        {...resetForm.register('email')}
                        type="email"
                        placeholder="you@example.com"
                        className="input-field pl-10"
                      />
                    </div>
                    {resetForm.formState.errors.email && (
                      <p className="text-xs text-red-500 mt-1">{resetForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={resetForm.formState.isSubmitting}>
                    {resetForm.formState.isSubmitting ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
              )}
              <p className="text-center text-sm text-sakhi-muted mt-6">
                <button onClick={() => setMode('login')} className="text-lavender-600 hover:underline">Back to sign in</button>
              </p>
            </>
          )}

          {mode === 'confirm' && (
            <>
              <h1 className="text-2xl font-bold text-sakhi-text mb-1">Check your email</h1>
              <p className="text-sm text-sakhi-muted mb-6">We've sent a confirmation link to your inbox.</p>
              <div className="card border-green-200 bg-green-50 text-center py-8 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-semibold text-green-800 mb-1">Confirmation email sent</p>
                <p className="text-sm text-green-700">
                  {confirmedEmail && <><strong>{confirmedEmail}</strong><br /></>}
                  Please check your inbox (and spam folder) and click the confirmation link to activate your account.
                </p>
              </div>
              <div className="bg-lavender-50 border border-lavender-200 rounded-xl p-4 text-sm text-lavender-700 mb-4">
                <p>Once confirmed, you can sign in below. If you don't receive the email within a few minutes, check your spam folder or try signing up again.</p>
              </div>
              <button onClick={() => setMode('login')} className="btn-primary w-full">
                Go to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
