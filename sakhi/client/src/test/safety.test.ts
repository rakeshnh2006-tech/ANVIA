import { describe, it, expect } from 'vitest'

// Safety check logic duplicated here for client-side testing
// (avoids server cross-workspace imports in vitest)

interface SafetyResult {
  level: 'safe' | 'prompt' | 'urgent'
  triggers: string[]
  message: string
}

const URGENT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /severe\s+(pelvic|abdominal|stomach)\s+pain/i, label: 'Severe pelvic or abdominal pain' },
  { pattern: /sudden\s+(pelvic|abdominal)\s+pain/i, label: 'Sudden abdominal pain' },
  { pattern: /faint(ing|ed|ness)?|lost?\s+consciousness|pass(ed|ing)\s+out/i, label: 'Fainting or loss of consciousness' },
  { pattern: /heavy\s+bleed(ing)?.*?(dizzy|dizziness|faint|weak|weakness)/i, label: 'Heavy bleeding with faintness' },
  { pattern: /(dizzy|faint|weak).*?heavy\s+bleed(ing)?/i, label: 'Heavy bleeding with faintness' },
  { pattern: /chest\s+pain|breathing\s+difficult|can.?t\s+breathe/i, label: 'Chest pain or breathing difficulty' },
]

const PROMPT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /irreg(ular)?\s+period/i, label: 'Irregular periods' },
  { pattern: /miss(ed|ing)\s+period/i, label: 'Missed periods' },
  { pattern: /hair\s+(loss|thinning|fall)/i, label: 'Hair loss' },
]

function runSafetyCheck(input: string): SafetyResult {
  for (const { pattern, label } of URGENT_PATTERNS) {
    if (pattern.test(input)) {
      return { level: 'urgent', triggers: [label], message: 'Urgent: seek immediate medical care' }
    }
  }
  const promptTriggers = PROMPT_PATTERNS.filter(p => p.pattern.test(input)).map(p => p.label)
  if (promptTriggers.length >= 2) {
    return { level: 'prompt', triggers: promptTriggers, message: 'Seek prompt medical assessment' }
  }
  return { level: 'safe', triggers: [], message: '' }
}

function enforceMinimumUrgency(
  aiUrgency: 'routine' | 'prompt' | 'urgent',
  safetyLevel: 'safe' | 'prompt' | 'urgent'
): 'routine' | 'prompt' | 'urgent' {
  const rank: Record<string, number> = { routine: 0, safe: 0, prompt: 1, urgent: 2 }
  if (rank[safetyLevel] > rank[aiUrgency]) return safetyLevel as 'prompt' | 'urgent'
  return aiUrgency
}

describe('Safety service', () => {
  it('returns urgent for severe pelvic pain', () => {
    const result = runSafetyCheck('I am experiencing severe pelvic pain')
    expect(result.level).toBe('urgent')
    expect(result.triggers.length).toBeGreaterThan(0)
  })

  it('returns urgent for heavy bleeding with faintness', () => {
    const result = runSafetyCheck('I have heavy bleeding and I feel faint and dizzy')
    expect(result.level).toBe('urgent')
  })

  it('returns urgent for fainting', () => {
    const result = runSafetyCheck('I lost consciousness suddenly')
    expect(result.level).toBe('urgent')
  })

  it('returns urgent for chest pain', () => {
    const result = runSafetyCheck('I have severe chest pain and difficulty breathing')
    expect(result.level).toBe('urgent')
  })

  it('returns prompt for multiple concerning symptoms', () => {
    const result = runSafetyCheck('I have irregular periods and hair loss')
    expect(result.level).toBe('prompt')
  })

  it('returns safe for minor symptoms', () => {
    const result = runSafetyCheck('I have a mild headache today')
    expect(result.level).toBe('safe')
  })

  it('enforceMinimumUrgency does not downgrade urgent to routine', () => {
    expect(enforceMinimumUrgency('routine', 'urgent')).toBe('urgent')
  })

  it('enforceMinimumUrgency does not downgrade urgent to prompt', () => {
    expect(enforceMinimumUrgency('prompt', 'urgent')).toBe('urgent')
  })

  it('enforceMinimumUrgency allows AI to upgrade from routine', () => {
    expect(enforceMinimumUrgency('prompt', 'safe')).toBe('prompt')
  })
})
