import { describe, it, expect } from '@jest/globals'
import { z } from 'zod'
import { SymptomInputSchema, AIResponseSchema } from '../schemas/symptom.schema'

describe('SymptomInputSchema validation', () => {
  it('accepts valid input', () => {
    const result = SymptomInputSchema.safeParse({
      input: 'I have irregular periods and fatigue',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty input', () => {
    const result = SymptomInputSchema.safeParse({ input: '' })
    expect(result.success).toBe(false)
  })

  it('rejects input shorter than 3 characters', () => {
    const result = SymptomInputSchema.safeParse({ input: 'ab' })
    expect(result.success).toBe(false)
  })

  it('rejects input longer than 2000 characters', () => {
    const result = SymptomInputSchema.safeParse({ input: 'a'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('accepts input with only the required field', () => {
    const result = SymptomInputSchema.safeParse({ input: 'I have headaches' })
    expect(result.success).toBe(true)
  })
})

describe('AIResponseSchema validation', () => {
  const validResponse = {
    symptoms_identified: ['Irregular periods', 'Fatigue'],
    duration: '3 months',
    plain_language_explanation: 'Your symptoms may have several causes.',
    possible_associations: ['Hormonal imbalance', 'PCOS'],
    pcos_education: 'PCOS is a common hormonal condition.',
    suggested_tracking: ['Period dates', 'Fatigue levels'],
    care_urgency: 'routine' as const,
    care_guidance: 'Schedule a doctor appointment.',
    missing_information: ['Duration of symptoms'],
    disclaimer: 'This is educational information, not a medical diagnosis.',
  }

  it('accepts a valid AI response', () => {
    expect(AIResponseSchema.safeParse(validResponse).success).toBe(true)
  })

  it('rejects invalid care_urgency', () => {
    const invalid = { ...validResponse, care_urgency: 'critical' }
    expect(AIResponseSchema.safeParse(invalid).success).toBe(false)
  })

  it('rejects missing symptoms_identified', () => {
    const { symptoms_identified, ...rest } = validResponse
    expect(AIResponseSchema.safeParse(rest).success).toBe(false)
  })

  it('accepts null duration', () => {
    const withNullDuration = { ...validResponse, duration: null }
    expect(AIResponseSchema.safeParse(withNullDuration).success).toBe(true)
  })

  it('rejects non-array possible_associations', () => {
    const invalid = { ...validResponse, possible_associations: 'PCOS' }
    expect(AIResponseSchema.safeParse(invalid).success).toBe(false)
  })
})
