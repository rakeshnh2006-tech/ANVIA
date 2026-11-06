import { Router, Response } from 'express'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'
import { validateBody } from '../middleware/validation.middleware'
import { SymptomInputSchema } from '../schemas/symptom.schema'
import { runSafetyCheck, enforceMinimumUrgency } from '../services/safety.service'
import { detectLanguage, getProcessingLanguage } from '../utils/language-detection'
import { processSymptoms } from '../services/ai.service'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'
)

// POST /api/symptom/analyze
router.post(
  '/analyze',
  requireAuth,
  validateBody(SymptomInputSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { input, preferred_language } = req.body as { input: string; preferred_language: string }
    const userId = req.userId!

    try {
      // 1. Deterministic safety check (runs first, always)
      const safety = runSafetyCheck(input)

      // 2. If urgent — return immediately without AI processing
      if (safety.level === 'urgent') {
        res.json({
          safety,
          ai_response: null,
          is_demo: false,
        })
        return
      }

      // 3. Language detection
      const detected = detectLanguage(input)
      const processingLang = getProcessingLanguage(detected, preferred_language)

      // 4. AI processing
      const aiResponse = await processSymptoms({
        originalInput: input,
        detectedLanguage: detected,
        preferredLanguage: processingLang,
        safetyLevel: safety.level,
      })

      // 5. Enforce minimum urgency — AI cannot downgrade safety result
      aiResponse.care_urgency = enforceMinimumUrgency(aiResponse.care_urgency, safety.level)

      // 6. Persist conversation
      await supabase.from('ai_conversations').insert({
        user_id: userId,
        original_input: input,
        detected_language: detected,
        preferred_language: processingLang,
        structured_response: aiResponse as unknown as Record<string, unknown>,
      })

      const isDemo = !process.env.AI_API_KEY || process.env.AI_PROVIDER === 'demo'

      res.json({
        safety,
        ai_response: aiResponse,
        is_demo: isDemo,
      })
    } catch (err) {
      console.error('[symptom route] error:', err)
      res.status(500).json({
        error: 'Analysis failed. Please try again.',
        details: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }
)

// GET /api/symptom/history
router.get('/history', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, original_input, detected_language, preferred_language, created_at')
    .eq('user_id', req.userId!)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json(data)
})

// DELETE /api/symptom/history
router.delete('/history', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('user_id', req.userId!)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ success: true })
})

export default router
