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

const SymptomEntryCreateSchema = z.object({
  symptom_name: z.string().min(1, 'Symptom name required').max(100),
  severity: z.number().int().min(1).max(10),
  duration: z.string().max(100).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  recorded_at: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date').optional(),
  cycle_day: z.number().int().min(1).max(40).nullable().optional(),
})

const SymptomEntryUpdateSchema = SymptomEntryCreateSchema.partial()

// GET /api/symptoms
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('symptom_entries')
    .select('*')
    .eq('user_id', req.userId!)
    .order('recorded_at', { ascending: false })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// POST /api/symptoms
router.post('/', requireAuth, validateBody(SymptomEntryCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('symptom_entries')
    .insert({ ...req.body, user_id: req.userId! })
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

// PATCH /api/symptoms/:id
router.patch('/:id', requireAuth, validateBody(SymptomEntryUpdateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('symptom_entries')
    .update(req.body)
    .eq('id', id)
    .eq('user_id', req.userId!)
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  if (!data) { res.status(404).json({ error: 'Entry not found' }); return }
  res.json(data)
})

// DELETE /api/symptoms/:id
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const { error } = await supabase
    .from('symptom_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', req.userId!)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ success: true })
})

export default router
