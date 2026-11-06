import { Router, Response } from 'express'
import { z } from 'zod'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'
import { validateBody } from '../middleware/validation.middleware'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'
)

const CycleEntrySchema = z.object({
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  flow_intensity: z.enum(['spotting', 'light', 'moderate', 'heavy']).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
}).refine(data => {
  if (data.period_end && data.period_start) {
    return new Date(data.period_end) >= new Date(data.period_start)
  }
  return true
}, { message: 'End date must be on or after start date' })

// Partial schema for PATCH — all fields optional, same validation rules
const CycleUpdateSchema = z.object({
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  flow_intensity: z.enum(['spotting', 'light', 'moderate', 'heavy']).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

// GET /api/cycles
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('cycle_entries')
    .select('*')
    .eq('user_id', req.userId!)
    .order('period_start', { ascending: false })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// POST /api/cycles
router.post('/', requireAuth, validateBody(CycleEntrySchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('cycle_entries')
    .insert({ ...req.body, user_id: req.userId! })
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

// PATCH /api/cycles/:id
router.patch('/:id', requireAuth, validateBody(CycleUpdateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('cycle_entries')
    .update(req.body)
    .eq('id', id)
    .eq('user_id', req.userId!)
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  if (!data) { res.status(404).json({ error: 'Entry not found' }); return }
  res.json(data)
})

// DELETE /api/cycles/:id
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const { error } = await supabase
    .from('cycle_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', req.userId!)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ success: true })
})

export default router
