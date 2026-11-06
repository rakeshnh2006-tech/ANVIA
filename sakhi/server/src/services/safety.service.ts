/**
 * Deterministic safety check — runs BEFORE any LLM processing.
 * This must not depend on the AI provider's response.
 * The AI is NEVER allowed to downgrade an urgent result from this check.
 */

export interface SafetyResult {
  level: 'safe' | 'prompt' | 'urgent'
  triggers: string[]
  message: string
}

// ─── URGENT RED-FLAG PATTERNS ─────────────────────────────────────────────────
const URGENT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /severe\s+(pelvic|abdominal|stomach|belly)\s+pain/i, label: 'Severe pelvic or abdominal pain' },
  { pattern: /sudden\s+(pelvic|abdominal|stomach)\s+pain/i,       label: 'Sudden abdominal pain' },
  { pattern: /faint(ing|ed|ness)?|lost?\s+consciousness|pass(ed|ing)\s+out/i, label: 'Fainting or loss of consciousness' },
  { pattern: /heavy\s+bleed(ing)?.*?(dizzy|dizziness|faint|weak|weakness)/i,  label: 'Heavy bleeding with faintness or weakness' },
  { pattern: /(dizzy|faint|weak).*?heavy\s+bleed(ing)?/i,          label: 'Heavy bleeding with faintness or weakness' },
  { pattern: /heavy\s+bleed(ing)?.*?severe\s+(cramp|pain|pressure)/i, label: 'Heavy bleeding with severe pain' },
  { pattern: /severe\s+(cramp|pain|pressure).*?heavy\s+bleed(ing)?/i, label: 'Heavy bleeding with severe pain' },
  { pattern: /chest\s+pain|breathing\s+difficult|can(not|'t)?\s+breathe|shortness\s+of\s+breath/i, label: 'Chest pain or severe breathing difficulty' },
  { pattern: /preg(nant|nancy).*?(pain|bleed)/i,                   label: 'Possible pregnancy with pain or bleeding' },
  { pattern: /(pain|bleed).*?preg(nant|nancy)/i,                   label: 'Possible pregnancy with pain or bleeding' },
  { pattern: /blood\s+clot.*?(dizzy|faint|pain)/i,                 label: 'Blood clots with concerning symptoms' },
  { pattern: /uncontrolled?\s+bleed/i,                             label: 'Uncontrolled bleeding' },
  { pattern: /severe\s+(nausea|vomiting).*?(bleed|pain|faint)/i,   label: 'Severe nausea/vomiting with bleeding or pain' },
  { pattern: /unexplained\s+weight\s+loss.*?bleed|bleed.*?unexplained\s+weight\s+loss/i, label: 'Bleeding with unexplained weight loss' },
]

// ─── PROMPT ASSESSMENT PATTERNS ───────────────────────────────────────────────
const PROMPT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /irreg(ular)?\s+period/i,                  label: 'Irregular menstrual periods' },
  { pattern: /miss(ed|ing)\s+period/i,                  label: 'Missed periods' },
  { pattern: /no\s+period\s+for\s+\d+\s+month/i,       label: 'Absent periods for multiple months' },
  { pattern: /severe\s+acne/i,                          label: 'Severe acne' },
  { pattern: /hair\s+(loss|thinning|fall)/i,            label: 'Hair loss or thinning' },
  { pattern: /excess(ive)?\s+(hair|facial\s+hair|body\s+hair)/i, label: 'Excessive hair growth' },
  { pattern: /unexplained\s+weight\s+(gain|loss)/i,    label: 'Unexplained weight change' },
  { pattern: /extreme\s+fatigue/i,                      label: 'Extreme fatigue' },
  { pattern: /pcos/i,                                   label: 'PCOS mentioned' },
]

// ─── CORE FUNCTIONS ───────────────────────────────────────────────────────────

export function runSafetyCheck(input: string): SafetyResult {
  const urgentTriggers: string[] = []

  for (const { pattern, label } of URGENT_PATTERNS) {
    if (pattern.test(input)) urgentTriggers.push(label)
  }

  if (urgentTriggers.length > 0) {
    return {
      level: 'urgent',
      triggers: urgentTriggers,
      message:
        'Your description contains symptoms that need immediate in-person medical assessment. ' +
        'Please do not wait for an AI response. Call 112 or go to your nearest emergency facility now.',
    }
  }

  // Collect all matching prompt patterns
  const promptTriggers: string[] = []
  for (const { pattern, label } of PROMPT_PATTERNS) {
    if (pattern.test(input)) promptTriggers.push(label)
  }

  const hasHeavyBleeding = /heavy\s+bleed(ing)?/i.test(input)
  if (promptTriggers.length >= 2 || hasHeavyBleeding) {
    const allTriggers = hasHeavyBleeding && promptTriggers.length === 0
      ? ['Heavy bleeding']
      : promptTriggers
    return {
      level: 'prompt',
      triggers: allTriggers,
      message:
        'Based on your description, a consultation with a qualified healthcare professional is recommended. ' +
        'While this is not an emergency, please schedule an appointment soon.',
    }
  }

  return { level: 'safe', triggers: [], message: '' }
}

/**
 * Ensures the AI cannot downgrade a safety-system result.
 * urgency rank: routine=0, prompt=1, urgent=2
 */
export function enforceMinimumUrgency(
  aiUrgency: 'routine' | 'prompt' | 'urgent',
  safetyLevel: 'safe' | 'prompt' | 'urgent'
): 'routine' | 'prompt' | 'urgent' {
  const rank: Record<string, number> = { routine: 0, safe: 0, prompt: 1, urgent: 2 }
  if (rank[safetyLevel] > rank[aiUrgency]) {
    return safetyLevel as 'prompt' | 'urgent'
  }
  return aiUrgency
}
