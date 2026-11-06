import { Router, Response } from 'express'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'
)

// GET /api/report/generate?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/generate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { from, to } = req.query as { from?: string; to?: string }
  const userId = req.userId!

  const fromDate = from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const toDate = to || new Date().toISOString().split('T')[0]

  const [symptoms, cycles, conversations] = await Promise.all([
    supabase.from('symptom_entries').select('*').eq('user_id', userId)
      .gte('recorded_at', fromDate).lte('recorded_at', toDate + 'T23:59:59Z')
      .order('recorded_at', { ascending: true }),
    supabase.from('cycle_entries').select('*').eq('user_id', userId)
      .gte('period_start', fromDate).lte('period_start', toDate)
      .order('period_start', { ascending: true }),
    supabase.from('ai_conversations').select('original_input, structured_response, created_at').eq('user_id', userId)
      .gte('created_at', fromDate).lte('created_at', toDate + 'T23:59:59Z')
      .order('created_at', { ascending: true }),
  ])

  if (symptoms.error || cycles.error || conversations.error) {
    res.status(500).json({ error: 'Failed to fetch report data' })
    return
  }

  res.json({
    generated_at: new Date().toISOString(),
    period: { from: fromDate, to: toDate },
    symptom_entries: symptoms.data,
    cycle_entries: cycles.data,
    ai_conversations: conversations.data,
    disclaimer:
      'This report contains user-reported health information. ' +
      'AI-generated explanations are educational and do not constitute medical diagnosis. ' +
      'Present this to your healthcare provider as supporting information only.',
  })
})

export default router
