import { z } from 'zod'

export const SymptomInputSchema = z.object({
  input: z.string().trim().min(3, 'Please describe at least one symptom').max(2000, 'Description too long'),
  // user_id intentionally removed — server uses req.userId from verified JWT
})

export const AIResponseSchema = z.object({
  symptoms_identified: z.array(z.string()),
  duration: z.string().nullable(),
  plain_language_explanation: z.string(),
  possible_associations: z.array(z.string()),
  pcos_education: z.string(),
  suggested_tracking: z.array(z.string()),
  care_urgency: z.enum(['routine', 'prompt', 'urgent']),
  care_guidance: z.string(),
  missing_information: z.array(z.string()),
  disclaimer: z.string(),
})

export type SymptomInput = z.infer<typeof SymptomInputSchema>
export type AIResponse = z.infer<typeof AIResponseSchema>
