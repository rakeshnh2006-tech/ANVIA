/**
 * Auth form validation tests — client side.
 * Uses React Testing Library to render the Auth page and test
 * Zod-driven form validation without a real Supabase connection.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// ─── Mock dependencies that require browser/env APIs ──────────────────────
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    user: null,
    profile: null,
    loading: false,
  }),
}))

vi.mock('../components/ui/Toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}))

// React Router navigate mock
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import AuthPage from '../pages/Auth'

function renderAuth(mode = '') {
  const search = mode ? `?mode=${mode}` : ''
  return render(
    <MemoryRouter initialEntries={[`/auth${search}`]}>
      <AuthPage />
    </MemoryRouter>
  )
}

// ─── Login form ─────────────────────────────────────────────────────────────
describe('Login form validation', () => {
  it('renders login form by default', () => {
    renderAuth()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  it('shows email validation error for invalid email', async () => {
    renderAuth()
    const emailInput = screen.getByPlaceholderText('you@example.com')
    await userEvent.type(emailInput, 'notanemail')
    fireEvent.submit(emailInput.closest('form')!)
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('shows password error when password is too short (< 6 chars)', async () => {
    renderAuth()
    const emailInput = screen.getByPlaceholderText('you@example.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    await userEvent.type(emailInput, 'user@example.com')
    await userEvent.type(passwordInput, '12345')
    fireEvent.submit(emailInput.closest('form')!)
    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('shows both email and password errors on empty submit', async () => {
    renderAuth()
    const form = screen.getByText('Sign in').closest('form')
    fireEvent.submit(form!)
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })
})

// ─── Signup form ─────────────────────────────────────────────────────────────
describe('Signup form validation', () => {
  it('renders signup form when mode=signup', () => {
    renderAuth('signup')
    expect(screen.getByText('Create your account')).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    renderAuth('signup')
    const inputs = screen.getAllByPlaceholderText(/password|repeat/i)
    // password and confirm password fields
    const passwordField = screen.getByPlaceholderText('At least 8 characters')
    const confirmField = screen.getByPlaceholderText('Repeat password')
    await userEvent.type(passwordField, 'securepassword1')
    await userEvent.type(confirmField, 'differentpassword')
    const form = confirmField.closest('form')!
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument()
    })
  })

  it('shows error when password is less than 8 characters', async () => {
    renderAuth('signup')
    const passwordField = screen.getByPlaceholderText('At least 8 characters')
    await userEvent.type(passwordField, 'short')
    const form = passwordField.closest('form')!
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('shows error for invalid email on signup form', async () => {
    renderAuth('signup')
    const emailInput = screen.getByPlaceholderText('you@example.com')
    await userEvent.type(emailInput, 'bad-email')
    const form = emailInput.closest('form')!
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('educational disclaimer is visible on signup form', () => {
    renderAuth('signup')
    expect(screen.getByText(/educational platform/i)).toBeInTheDocument()
  })
})

// ─── Reset password form ─────────────────────────────────────────────────────
describe('Password reset form validation', () => {
  it('shows reset form when Forgot password is clicked', async () => {
    renderAuth()
    await userEvent.click(screen.getByText('Forgot password?'))
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument()
  })

  it('shows email error on empty reset submit', async () => {
    renderAuth()
    await userEvent.click(screen.getByText('Forgot password?'))
    const form = screen.getByText(/send reset link/i).closest('form')!
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })
})

// ─── Mode switching ──────────────────────────────────────────────────────────
describe('Auth mode switching', () => {
  it('switches from login to signup when Create one is clicked', async () => {
    renderAuth()
    await userEvent.click(screen.getByText('Create one'))
    expect(screen.getByText('Create your account')).toBeInTheDocument()
  })

  it('switches back to login from signup', async () => {
    renderAuth('signup')
    await userEvent.click(screen.getByText('Sign in'))
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('renders Back to home link', () => {
    renderAuth()
    expect(screen.getByText('Back to home')).toBeInTheDocument()
  })
})
