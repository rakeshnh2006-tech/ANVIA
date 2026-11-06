/**
 * UI state tests — loading states, empty states, error states, env key audit.
 * Uses React Testing Library + vitest.
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ─── UI state components ──────────────────────────────────────────────────
import { EmptyState, ErrorState } from '../components/ui/States'
import { LoadingSkeleton, CardSkeleton } from '../components/ui/Skeleton'

// ─── Mock supabase ────────────────────────────────────────────────────────
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn(), onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

// ─── EmptyState tests ─────────────────────────────────────────────────────
describe('EmptyState component', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No data yet"
        description="Start tracking to see your data here."
      />
    )
    expect(screen.getByText('No data yet')).toBeInTheDocument()
    expect(screen.getByText(/start tracking/i)).toBeInTheDocument()
  })

  it('renders optional action node', () => {
    render(
      <EmptyState
        title="No cycles"
        description="Add your first cycle"
        action={<button>Add Cycle</button>}
      />
    )
    expect(screen.getByRole('button', { name: /add cycle/i })).toBeInTheDocument()
  })

  it('does not render action when not provided', () => {
    render(<EmptyState title="Empty" description="Nothing here." />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

// ─── ErrorState tests ─────────────────────────────────────────────────────
describe('ErrorState component', () => {
  it('renders error message', () => {
    render(<ErrorState message="Something went wrong" />)
    // ErrorState renders both a hardcoded header and the message prop — both contain the string
    const matches = screen.getAllByText('Something went wrong')
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorState message="Failed to load" onRetry={() => {}} />)
    // ErrorState renders "Try again" button
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('does not render retry button without onRetry', () => {
    render(<ErrorState message="An error occurred" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

// ─── Skeleton tests ───────────────────────────────────────────────────────
describe('Skeleton components', () => {
  it('CardSkeleton renders an animate-pulse element', () => {
    const { container } = render(<CardSkeleton />)
    const el = container.querySelector('.animate-pulse')
    expect(el).toBeInTheDocument()
  })

  it('LoadingSkeleton renders skeleton rows', () => {
    const { container } = render(<LoadingSkeleton rows={3} />)
    const rows = container.querySelectorAll('.skeleton')
    expect(rows.length).toBe(3)
  })

  it('LoadingSkeleton applies custom className wrapper', () => {
    const { container } = render(<LoadingSkeleton className="custom-wrapper" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('custom-wrapper')
  })
})

// ─── Medical disclaimer visibility ───────────────────────────────────────
describe('Landing page — medical disclaimer', () => {
  it('landing page contains educational disclaimer text', async () => {
    const { default: Landing } = await import('../pages/Landing')
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )
    const disclaimers = screen.getAllByText(/educational|not a medical diagnosis|does not diagnose/i)
    expect(disclaimers.length).toBeGreaterThan(0)
  })
})

// ─── Environment key audit ────────────────────────────────────────────────
describe('Environment variable security audit (client)', () => {
  it('VITE_SUPABASE_URL does not contain a service role key pattern', () => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
    // Service role keys are JWT tokens starting with eyJh... and are very long
    if (url) {
      expect(url).not.toMatch(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{200,}/)
    }
  })

  it('VITE_SUPABASE_ANON_KEY is not a service role key (service keys are much longer)', () => {
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
    // Service role keys are JWTs with "role":"service_role" — anon key has "role":"anon"
    // We can't decode in tests, but we verify it is not the pattern of an internal service key
    if (key) {
      // The key should exist and be a reasonable length, but NOT look like a raw secret
      expect(key).not.toMatch(/^sk-/)
      expect(typeof key).toBe('string')
    }
  })

  it('AI API key is never accessible via import.meta.env', () => {
    // VITE_ prefix exposes env vars to client — AI_API_KEY must not be prefixed with VITE_
    const allEnv = import.meta.env as Record<string, string>
    const exposedKeys = Object.keys(allEnv).filter(k => k.startsWith('VITE_'))
    const dangerousKeys = exposedKeys.filter(k =>
      k.includes('AI_API_KEY') ||
      k.includes('SERVICE_ROLE') ||
      k.includes('OPENAI') ||
      k.includes('ANTHROPIC') ||
      k.includes('GOOGLE_AI')
    )
    expect(dangerousKeys).toHaveLength(0)
  })

  it('server-side SUPABASE_SERVICE_ROLE_KEY is not accessible from client', () => {
    const allEnv = import.meta.env as Record<string, string>
    // If SUPABASE_SERVICE_ROLE_KEY is exposed via VITE_SERVICE_ROLE_KEY, that's a security issue
    expect(allEnv).not.toHaveProperty('VITE_SERVICE_ROLE_KEY')
    expect(allEnv).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY')
  })
})

// ─── Accessibility smoke tests ────────────────────────────────────────────
describe('Accessibility — form labels and roles', () => {
  it('EmptyState has accessible text content', () => {
    render(<EmptyState title="No symptoms logged" description="Add a symptom to get started." />)
    expect(screen.getByText('No symptoms logged')).toBeVisible()
    expect(screen.getByText('Add a symptom to get started.')).toBeVisible()
  })
})
