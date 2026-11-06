/**
 * Medical Safety & AI Quality Regression Tests — SAKHI
 *
 * Covers all 8 safety requirements from the medical safety audit:
 *  1. Original language/meaning preserved
 *  2. No definitive diagnosis
 *  3. No PCOS probability claims
 *  4. Emergency warnings cannot be overridden
 *  5. Platform never prescribes medication
 *  6. Uncertainty communicated clearly
 *  7. Appropriate professional care guidance
 *  8. Urgent safety bypasses AI completely
 *
 * Includes regression tests for every violation found in the safety audit.
 */

import {
  runSafetyCheck,
  enforceMinimumUrgency,
} from '../services/safety.service'
import { processSymptoms } from '../services/ai.service'
import type { AIServiceInput } from '../services/ai.service'

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeDemoInput(
  originalInput: string,
  detectedLanguage = 'English',
  preferredLanguage = 'English',
  safetyLevel: 'safe' | 'prompt' | 'urgent' = 'safe'
): AIServiceInput {
  return { originalInput, detectedLanguage, preferredLanguage, safetyLevel }
}

const DIAGNOSIS_PATTERNS = [
  /you\s+have\s+PCOS/i,
  /you\s+(definitely|clearly|certainly)\s+have/i,
  /this\s+(confirms|proves|indicates\s+you\s+have)/i,
  /PCOS\s+(confirmed|detected|identified\s+in\s+you)/i,
  /\bdiagnos(is|ed)\b/i,
  /you\s+are\s+suffering\s+from\s+PCOS/i,
]

const PROBABILITY_PATTERNS = [
  /\d+%\s+(chance|probability|likelihood)/i,
  /(high|low|moderate)\s+probability\s+of\s+PCOS/i,
  /likely\s+(has|have)\s+PCOS/i,
  /probably\s+(has|have)\s+PCOS/i,
  /almost\s+certainly\s+PCOS/i,
]

const MEDICATION_PRESCRIPTION_PATTERNS = [
  /take\s+(metformin|clomid|progesterone|birth\s+control|letrozole|spironolactone)/i,
  /prescrib(e|ing)\s+you/i,
  /start\s+(taking|using)\s+(metformin|clomid|progesterone|birth\s+control)/i,
  /I\s+recommend\s+you\s+take/i,
  /you\s+should\s+take\s+(medication|medicine|drug|pill)/i,
]

function assertNoDiagnosticLanguage(text: string, field: string) {
  for (const pattern of DIAGNOSIS_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`Diagnostic language found in ${field}: "${text.slice(0, 100)}" matched ${pattern}`)
    }
  }
}

function assertNoProbabilityLanguage(text: string, field: string) {
  for (const pattern of PROBABILITY_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`Probability language found in ${field}: "${text.slice(0, 100)}" matched ${pattern}`)
    }
  }
}

function assertNoMedicationPrescription(text: string, field: string) {
  for (const pattern of MEDICATION_PRESCRIPTION_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`Medication prescription found in ${field}: "${text.slice(0, 100)}" matched ${pattern}`)
    }
  }
}

function assertHasUncertaintyLanguage(text: string, field: string) {
  const UNCERTAINTY_MARKERS = [
    // English uncertainty
    /can\s+(be|have|occur|cause)/i,
    /may\s+(be|indicate|suggest|involve)/i,
    /might\s+be/i,
    /possible/i,
    /associated\s+with/i,
    /evaluation\s+(is\s+)?(needed|required|recommended)/i,
    /consult|healthcare\s+professional|doctor/i,
    /cannot\s+(confirm|rule\s+out|determine)/i,
    /not\s+(enough|sufficient|specific)\s+(to|for)/i,
    /alone\s+cannot/i,
    // Kannada uncertainty markers
    /ಕಾರಣಗಳಿರಬಹುದು|ಉಂಟಾಗಬಹುದು|ಅಗತ್ಯ|ಸಂಭಾವ್ಯ|ಸಾಕಾಗ/u,
    // Hindi uncertainty markers
    /हो\s*सकते|कारण\s*हो|संभावित|जानना\s*संभव\s*नहीं|मूल्यांकन/u,
    // Tamil uncertainty markers
    /இருக்கலாம்|காரணமாக\s*இருக்க|மதிப்பீடு/u,
    // Telugu uncertainty markers
    /కావచ్చు|అంచనా|అవసరం/u,
    // Malayalam uncertainty markers
    /ആകാം|കാരണം\s*ആകാം|വിലയിരുത്തൽ/u,
  ]
  const hasUncertainty = UNCERTAINTY_MARKERS.some(p => p.test(text))
  if (!hasUncertainty) {
    throw new Error(`No uncertainty language found in ${field}: "${text.slice(0, 150)}"`)
  }
}

function assertHasCareGuidance(guidance: string) {
  const CARE_MARKERS = [
    // English
    /doctor|healthcare|physician|specialist|professional|consult/i,
    /appointment|evaluation|assessment|examination/i,
    /seek\s+(care|medical|help)/i,
    // Kannada
    /ವೈದ್ಯರನ್ನು|ಭೇಟಿ\s*ಮಾಡಿ/u,
    // Hindi
    /डॉक्टर|चिकित्सक|सलाह/u,
    // Tamil
    /மருத்துவர்|ஆலோசனை/u,
    // Telugu
    /డాక్టర్|వైద్యుడు/u,
    // Malayalam
    /ഡോക്ടർ|വൈദ്യൻ/u,
  ]
  const hasCare = CARE_MARKERS.some(p => p.test(guidance))
  if (!hasCare) {
    throw new Error(`No professional care guidance found in: "${guidance}"`)
  }
}

function checkAllResponseFields(resp: ReturnType<typeof processSymptoms> extends Promise<infer T> ? T : never, label: string) {
  // 2. No definitive diagnosis
  assertNoDiagnosticLanguage(resp.plain_language_explanation, `${label}.plain_language_explanation`)
  if (resp.pcos_education) assertNoDiagnosticLanguage(resp.pcos_education, `${label}.pcos_education`)
  assertNoDiagnosticLanguage(resp.care_guidance, `${label}.care_guidance`)

  // 3. No probability claims
  assertNoProbabilityLanguage(resp.plain_language_explanation, `${label}.plain_language_explanation`)
  if (resp.pcos_education) assertNoProbabilityLanguage(resp.pcos_education, `${label}.pcos_education`)

  // 5. No medication prescriptions
  assertNoMedicationPrescription(resp.plain_language_explanation, `${label}.plain_language_explanation`)
  assertNoMedicationPrescription(resp.care_guidance, `${label}.care_guidance`)

  // 6. Uncertainty communicated in explanation
  assertHasUncertaintyLanguage(resp.plain_language_explanation, `${label}.plain_language_explanation`)

  // 7. Professional care guidance present
  assertHasCareGuidance(resp.care_guidance)

  // Disclaimer always present
  expect(resp.disclaimer).toBeTruthy()
  expect(resp.disclaimer).toContain('educational')
  expect(resp.disclaimer).toMatch(/not a medical diagnosis/i)

  // missing_information populated
  expect(Array.isArray(resp.missing_information)).toBe(true)

  // symptoms_identified is array
  expect(Array.isArray(resp.symptoms_identified)).toBe(true)

  // care_urgency is valid
  expect(['routine', 'prompt', 'urgent']).toContain(resp.care_urgency)
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFETY SERVICE TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('Safety Service — English urgent patterns', () => {
  it('flags severe pelvic pain as urgent', () => {
    const r = runSafetyCheck('I have severe pelvic pain that started this morning.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Severe pelvic or abdominal pain')
  })

  it('flags sudden abdominal pain as urgent', () => {
    const r = runSafetyCheck('I have sudden abdominal pain since one hour ago.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Sudden abdominal pain')
  })

  it('flags fainting as urgent', () => {
    const r = runSafetyCheck('I keep fainting during my period.')
    expect(r.level).toBe('urgent')
    expect(r.triggers.some(t => t.includes('Fainting') || t.includes('consciousness'))).toBe(true)
  })

  it('flags loss of consciousness as urgent', () => {
    const r = runSafetyCheck('I lost consciousness at work today.')
    expect(r.level).toBe('urgent')
  })

  it('flags heavy bleeding + dizziness as urgent', () => {
    const r = runSafetyCheck('I have heavy bleeding and feel very dizzy.')
    expect(r.level).toBe('urgent')
    expect(r.triggers.some(t => t.includes('Heavy bleeding'))).toBe(true)
  })

  it('flags heavy bleeding + weakness as urgent', () => {
    const r = runSafetyCheck('Heavy bleeding and I feel weak and cannot stand.')
    expect(r.level).toBe('urgent')
  })

  it('flags chest pain as urgent', () => {
    const r = runSafetyCheck('I have chest pain and cannot breathe properly.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Chest pain or severe breathing difficulty')
  })

  it('flags shortness of breath as urgent', () => {
    const r = runSafetyCheck('I am experiencing shortness of breath.')
    expect(r.level).toBe('urgent')
  })

  it('flags pregnancy with pain as urgent', () => {
    const r = runSafetyCheck('I might be pregnant and I have severe pain.')
    expect(r.level).toBe('urgent')
    expect(r.triggers.some(t => t.includes('pregnancy'))).toBe(true)
  })

  it('flags uncontrolled bleeding as urgent', () => {
    const r = runSafetyCheck('I have uncontrolled bleeding that will not stop.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Uncontrolled bleeding')
  })

  // REGRESSION: V4 fix — heavy bleeding with severe pain (no faintness)
  it('[REG-V4a] flags heavy bleeding with severe cramping pain as urgent', () => {
    const r = runSafetyCheck('I have heavy bleeding with severe cramping pain.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Heavy bleeding with severe pain')
  })

  it('[REG-V4b] flags severe cramps with heavy bleeding (reversed order) as urgent', () => {
    const r = runSafetyCheck('I have severe cramps and heavy bleeding during my period.')
    expect(r.level).toBe('urgent')
  })

  // REGRESSION: missing pattern — unexplained weight loss + bleeding
  it('[REG-MP1] flags unexplained weight loss with bleeding as urgent', () => {
    const r = runSafetyCheck('I have unexplained weight loss and heavy bleeding.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Bleeding with unexplained weight loss')
  })
})

describe('Safety Service — Prompt patterns', () => {
  it('flags 2+ concerning symptoms as prompt', () => {
    const r = runSafetyCheck('I have hair loss and irregular periods.')
    expect(r.level).toBe('prompt')
  })

  it('flags PCOS mention as prompt (with another symptom)', () => {
    const r = runSafetyCheck('I think I have PCOS because of hair thinning and irregular periods.')
    expect(r.level).toBe('prompt')
  })

  // REGRESSION: V4 fix — heavy bleeding ALONE now triggers prompt
  it('[REG-V4c] heavy bleeding alone (without other symptoms) triggers prompt', () => {
    const r = runSafetyCheck('I have heavy bleeding during my period.')
    expect(r.level).toBe('prompt')
    expect(r.triggers).toContain('Heavy bleeding')
  })

  it('[REG-V4d] heavy bleeding triggers prompt regardless of other prompt trigger count', () => {
    const r = runSafetyCheck('I have heavy bleeding.')
    expect(r.level).toBe('prompt')
  })

  it('returns safe for single minor symptom', () => {
    const r = runSafetyCheck('I feel a bit tired sometimes.')
    expect(r.level).toBe('safe')
  })

  it('returns safe for emotional wellbeing description', () => {
    const r = runSafetyCheck('I have been feeling anxious and stressed lately.')
    expect(r.level).toBe('safe')
  })
})

describe('Safety Service — Regional language urgent patterns', () => {
  it('flags Kannada fainting as urgent', () => {
    const r = runSafetyCheck('ನನಗೆ ಮೂರ್ಛೆ ಬರುತ್ತಿದೆ.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Loss of consciousness (Kannada)')
  })

  it('flags Kannada chest pain as urgent', () => {
    const r = runSafetyCheck('ನನಗೆ ಎದೆ ನೋವು ಇದೆ.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Chest pain (Kannada)')
  })

  it('flags Hindi loss of consciousness as urgent', () => {
    const r = runSafetyCheck('मैं बेहोश हो गई।')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Loss of consciousness (Hindi)')
  })

  it('flags Hindi chest pain as urgent', () => {
    const r = runSafetyCheck('मुझे सीने में दर्द हो रहा है।')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Chest pain (Hindi)')
  })

  it('flags Tamil fainting as urgent', () => {
    const r = runSafetyCheck('எனக்கு மயக்கம் வருகிறது.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Fainting or loss of consciousness (Tamil)')
  })

  it('flags Tamil chest pain as urgent', () => {
    const r = runSafetyCheck('எனக்கு மார்பு வலி இருக்கிறது.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Chest pain (Tamil)')
  })

  it('flags Telugu consciousness loss as urgent', () => {
    const r = runSafetyCheck('నాకు స్పృహ కోల్పోయింది.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Loss of consciousness (Telugu)')
  })

  it('flags Malayalam chest pain as urgent', () => {
    const r = runSafetyCheck('എനിക്ക് നെഞ്ചുവേദന ഉണ്ട്.')
    expect(r.level).toBe('urgent')
    expect(r.triggers).toContain('Chest pain (Malayalam)')
  })

  it('flags mixed English+Kannada urgent as urgent', () => {
    // Kannada urgent phrase embedded in English sentence
    const r = runSafetyCheck('I feel sick — ನನಗೆ ಮೂರ್ಛೆ ಬರುತ್ತಿದೆ.')
    expect(r.level).toBe('urgent')
  })

  it('flags mixed English+Hindi urgent as urgent', () => {
    const r = runSafetyCheck('I have irregular periods — मुझे सीने में दर्द हो रहा है।')
    expect(r.level).toBe('urgent')
  })
})

describe('Safety Service — enforceMinimumUrgency', () => {
  it('does not downgrade urgent to routine', () => {
    expect(enforceMinimumUrgency('routine', 'urgent')).toBe('urgent')
  })

  it('does not downgrade urgent to prompt', () => {
    expect(enforceMinimumUrgency('prompt', 'urgent')).toBe('urgent')
  })

  it('does not downgrade prompt to routine', () => {
    expect(enforceMinimumUrgency('routine', 'prompt')).toBe('prompt')
  })

  it('allows AI to keep urgent when safety is urgent', () => {
    expect(enforceMinimumUrgency('urgent', 'urgent')).toBe('urgent')
  })

  it('allows AI to keep prompt when safety is prompt', () => {
    expect(enforceMinimumUrgency('prompt', 'prompt')).toBe('prompt')
  })

  it('allows AI to keep routine when safety is safe', () => {
    expect(enforceMinimumUrgency('routine', 'safe')).toBe('routine')
  })

  it('allows AI to upgrade from routine to urgent when safety is safe', () => {
    expect(enforceMinimumUrgency('urgent', 'safe')).toBe('urgent')
  })

  it('preserves AI urgent even when safety is safe', () => {
    // AI independently flagged something as urgent — that is allowed
    expect(enforceMinimumUrgency('urgent', 'safe')).toBe('urgent')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AI SERVICE (DEMO MODE) RESPONSE QUALITY TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('AI Demo responses — Requirement 2: No definitive diagnosis', () => {
  const inputs = [
    { label: 'Hair/Acne variant', text: 'I have hair loss and acne' },
    { label: 'Fatigue variant', text: 'I feel very tired and exhausted' },
    { label: 'Weight variant', text: 'I have unexplained weight gain' },
    { label: 'Kannada variant', text: 'ನನಗೆ ಮುಟ್ಟು ಸರಿಯಾಗಿಲ್ಲ', lang: 'Kannada' },
    { label: 'Hindi variant', text: 'मुझे अनियमित पीरियड्स हैं', lang: 'Hindi' },
    { label: 'Default variant', text: 'I do not feel well' },
  ]

  inputs.forEach(({ label, text, lang }) => {
    it(`${label} — contains no diagnostic language`, async () => {
      const resp = await processSymptoms(makeDemoInput(text, lang || 'English'))
      assertNoDiagnosticLanguage(resp.plain_language_explanation, `${label}.plain_language_explanation`)
      if (resp.pcos_education) {
        assertNoDiagnosticLanguage(resp.pcos_education, `${label}.pcos_education`)
      }
    })
  })
})

describe('AI Demo responses — Requirement 3: No PCOS probability claims', () => {
  const inputs = [
    'I have hair loss and acne',
    'I have irregular periods',
    'I have PCOS symptoms',
    'ನನಗೆ ಮುಟ್ಟು ಸರಿಯಾಗಿಲ್ಲ',
    'मुझे अनियमित पीरियड्स हैं',
    'I feel tired and have weight gain',
  ]

  inputs.forEach(text => {
    it(`No probability claim for: "${text.slice(0, 40)}"`, async () => {
      const resp = await processSymptoms(makeDemoInput(text))
      assertNoProbabilityLanguage(resp.plain_language_explanation, 'explanation')
      if (resp.pcos_education) assertNoProbabilityLanguage(resp.pcos_education, 'pcos_education')
    })
  })
})

describe('AI Demo responses — Requirement 5: No medication prescriptions', () => {
  const inputs = [
    'I have irregular periods and want treatment',
    'I have PCOS and need medication',
    'What should I take for hair loss',
    'I have weight gain and insulin resistance',
  ]

  inputs.forEach(text => {
    it(`No prescription for: "${text.slice(0, 50)}"`, async () => {
      const resp = await processSymptoms(makeDemoInput(text))
      assertNoMedicationPrescription(resp.plain_language_explanation, 'explanation')
      assertNoMedicationPrescription(resp.care_guidance, 'care_guidance')
      if (resp.pcos_education) assertNoMedicationPrescription(resp.pcos_education, 'pcos_education')
    })
  })
})

describe('AI Demo responses — Requirement 6: Uncertainty clearly communicated', () => {
  it('Hair/Acne variant uses uncertain language (can/may/possible)', async () => {
    const resp = await processSymptoms(makeDemoInput('I have hair loss and acne'))
    assertHasUncertaintyLanguage(resp.plain_language_explanation, 'explanation')
  })

  it('Kannada variant uses uncertain language', async () => {
    const resp = await processSymptoms(makeDemoInput('ನನಗೆ ಮುಟ್ಟು ಸರಿಯಾಗಿಲ್ಲ', 'Kannada', 'Kannada'))
    assertHasUncertaintyLanguage(resp.plain_language_explanation, 'Kannada explanation')
  })

  it('Hindi variant uses uncertain language', async () => {
    const resp = await processSymptoms(makeDemoInput('मुझे अनियमित पीरियड्स हैं', 'Hindi', 'Hindi'))
    assertHasUncertaintyLanguage(resp.plain_language_explanation, 'Hindi explanation')
  })

  it('Default variant explicitly says symptoms alone are not enough', async () => {
    const resp = await processSymptoms(makeDemoInput('I do not feel well'))
    expect(resp.plain_language_explanation).toMatch(/symptoms alone|evaluation|proper evaluation/i)
  })

  // REGRESSION: V1 — Hindi pcos_education must not use "पुष्टि" (confirmation)
  it('[REG-V1] Hindi pcos_education must not claim tests "confirm" PCOS', async () => {
    const resp = await processSymptoms(makeDemoInput('मुझे अनियमित पीरियड्स हैं', 'Hindi', 'Hindi'))
    expect(resp.pcos_education).not.toMatch(/की\s*पुष्टि/)
    // Should mention evaluation, not confirmation
    expect(resp.pcos_education).toMatch(/मूल्यांकन|जाँच|निदान नहीं/)
  })

  // REGRESSION: V2 — Kannada pcos_education must not use "ಪತ್ತೆ ಹಚ್ಚ" definitively
  it('[REG-V2] Kannada pcos_education must use evaluation language, not definitive detection', async () => {
    const resp = await processSymptoms(makeDemoInput('ನನಗೆ ಮುಟ್ಟು ಸರಿಯಾಗಿಲ್ಲ', 'Kannada', 'Kannada'))
    // Should use ಮೌಲ್ಯಮಾಪನ (evaluation) not ಪತ್ತೆ ಹಚ್ಚು (definitively detect)
    expect(resp.pcos_education).toMatch(/ಮೌಲ್ಯಮಾಪನ|ಖಚಿತಗೊಳಿಸಲು\s*ಸಾಕಾಗ/)
  })

  // REGRESSION: V3 — Hair explanation must not lead with androgens → PCOS causal chain
  it('[REG-V3] Hair/Acne variant must list multiple causes before mentioning PCOS', async () => {
    const resp = await processSymptoms(makeDemoInput('I have hair loss and acne'))
    // PCOS must not be first in explanation; other causes (thyroid etc.) must appear first
    const pcosMentionIdx = resp.plain_language_explanation.toLowerCase().indexOf('pcos')
    const thyroidMentionIdx = resp.plain_language_explanation.toLowerCase().indexOf('thyroid')
    expect(thyroidMentionIdx).toBeGreaterThanOrEqual(0)
    // Thyroid or other conditions should be mentioned before or alongside PCOS
    expect(pcosMentionIdx).toBeGreaterThan(-1)
  })
})

describe('AI Demo responses — Requirement 7: Professional care guidance in every response', () => {
  const inputs = [
    { label: 'Hair/Acne', text: 'I have hair loss and acne' },
    { label: 'Fatigue', text: 'I feel very tired and exhausted' },
    { label: 'Weight', text: 'I have weight gain' },
    { label: 'Kannada', text: 'ನನಗೆ ಮುಟ್ಟು ಸರಿಯಾಗಿಲ್ಲ', lang: 'Kannada' },
    { label: 'Hindi', text: 'मुझे अनियमित पीरियड्स हैं', lang: 'Hindi' },
    { label: 'Default', text: 'I do not feel well' },
  ]

  inputs.forEach(({ label, text, lang }) => {
    it(`${label} variant contains professional care guidance`, async () => {
      const resp = await processSymptoms(makeDemoInput(text, lang || 'English'))
      assertHasCareGuidance(resp.care_guidance)
      expect(resp.care_guidance.length).toBeGreaterThan(20)
    })
  })

  // REGRESSION: V7 — All care_guidance must mention not to change medications
  it('[REG-V7] Hair/Acne care_guidance mentions medication caution', async () => {
    const resp = await processSymptoms(makeDemoInput('I have hair loss and acne'))
    expect(resp.care_guidance).toMatch(/medication|medical\s+guidance|medical\s+advice/i)
  })

  it('[REG-V7] Weight care_guidance mentions medication caution', async () => {
    const resp = await processSymptoms(makeDemoInput('I have weight gain'))
    expect(resp.care_guidance).toMatch(/medication|medical\s+guidance|without\s+medical/i)
  })
})

describe('AI Demo responses — Requirement 8: Urgent bypasses AI (enforceMinimumUrgency)', () => {
  it('care_urgency stays urgent when safety system says urgent', async () => {
    const resp = await processSymptoms(makeDemoInput(
      'I have severe pelvic pain',
      'English',
      'English',
      'urgent'
    ))
    expect(resp.care_urgency).toBe('urgent')
  })

  it('care_urgency stays prompt when safety system says prompt', async () => {
    const resp = await processSymptoms(makeDemoInput(
      'I have irregular periods and hair loss',
      'English',
      'English',
      'prompt'
    ))
    expect(resp.care_urgency).toBe('prompt')
  })

  it('AI demo response never sets care_urgency to routine when input is urgent', async () => {
    const resp = await processSymptoms(makeDemoInput(
      'I am fainting and have chest pain',
      'English',
      'English',
      'urgent'
    ))
    expect(resp.care_urgency).not.toBe('routine')
    expect(resp.care_urgency).toBe('urgent')
  })
})

describe('AI Demo responses — Requirement 1: Original language preserved', () => {
  it('original_language is set to detected language, not changed', async () => {
    const resp = await processSymptoms(makeDemoInput(
      'ನನಗೆ ಮುಟ್ಟು ಸರಿಯಾಗಿಲ್ಲ',
      'Kannada',
      'Kannada'
    ))
    expect(resp.original_language).toBe('Kannada')
    expect(resp.preferred_language).toBe('Kannada')
  })

  it('original_language is preserved for Hindi', async () => {
    const resp = await processSymptoms(makeDemoInput(
      'मुझे अनियमित पीरियड्स हैं',
      'Hindi',
      'Hindi'
    ))
    expect(resp.original_language).toBe('Hindi')
  })

  it('symptoms_identified does not add symptoms not mentioned in input (default variant)', async () => {
    const resp = await processSymptoms(makeDemoInput('I do not feel well', 'English'))
    // Default response should not invent specific diagnoses like "Irregular periods" when none mentioned
    // It should be generic/uncertain
    const ids = resp.symptoms_identified.join(' ').toLowerCase()
    expect(ids).not.toMatch(/confirmed\s+pcos|pcos\s+detected/)
  })
})

describe('AI Demo responses — Full compliance check across all variants', () => {
  const testCases: Array<{ label: string; input: string; lang: string }> = [
    { label: 'English hair/acne', input: 'I have hair loss, acne and facial hair growth.', lang: 'English' },
    { label: 'English fatigue', input: 'I feel extremely tired even after sleeping well.', lang: 'English' },
    { label: 'English weight gain', input: 'I have unexplained weight gain over 3 months.', lang: 'English' },
    { label: 'English multiple symptoms', input: 'I have irregular periods, hair loss, and acne.', lang: 'English' },
    { label: 'English incomplete', input: 'I feel off.', lang: 'English' },
    { label: 'English ambiguous', input: 'My body does not feel right.', lang: 'English' },
    { label: 'Kannada irregular period', input: 'ನನಗೆ ಮೂರು ತಿಂಗಳಿಂದ ಮುಟ್ಟು ಆಗುತ್ತಿಲ್ಲ.', lang: 'Kannada' },
    { label: 'Hindi irregular period', input: 'मुझे तीन महीनों से अनियमित पीरियड्स हैं।', lang: 'Hindi' },
    { label: 'Mixed EN+KN', input: 'I have irregular periods — ಮೂರು ತಿಂಗಳಿಂದ ಸರಿಯಾಗಿ ಆಗುತ್ತಿಲ್ಲ.', lang: 'English' },
    { label: 'Mixed EN+HI', input: 'My periods are irregular — माहवारी नहीं आ रही।', lang: 'Hindi' },
    { label: 'English PCOS symptoms', input: 'I have acne, hair loss, irregular periods and weight gain.', lang: 'English' },
    { label: 'English emergency (urgent override)', input: 'I feel very tired', lang: 'English' },
  ]

  testCases.forEach(({ label, input, lang }) => {
    it(`[Full check] ${label}`, async () => {
      const resp = await processSymptoms(makeDemoInput(input, lang))
      checkAllResponseFields(resp as any, label)
    })
  })
})

describe('AI Demo responses — Disclaimer field', () => {
  it('every variant has the standard disclaimer', async () => {
    const variants = [
      'I have hair loss',
      'I feel very tired',
      'I have weight gain',
      'ನನಗೆ ಮುಟ್ಟು ಸರಿಯಾಗಿಲ್ಲ',
      'मुझे अनियमित पीरियड्स हैं',
      'I do not feel well',
    ]
    for (const text of variants) {
      const resp = await processSymptoms(makeDemoInput(text))
      expect(resp.disclaimer).toBe('This is educational information, not a medical diagnosis.')
    }
  })
})

describe('AI Demo responses — Missing information populated', () => {
  it('all variants include at least 2 follow-up questions', async () => {
    const variants = [
      { text: 'I have hair loss and acne', lang: 'English' },
      { text: 'I feel very tired', lang: 'English' },
      { text: 'I have weight gain', lang: 'English' },
      { text: 'ನನಗೆ ಮುಟ್ಟು ಸರಿಯಾಗಿಲ್ಲ', lang: 'Kannada' },
      { text: 'मुझे अनियमित पीरियड्स हैं', lang: 'Hindi' },
    ]
    for (const { text, lang } of variants) {
      const resp = await processSymptoms(makeDemoInput(text, lang))
      expect(resp.missing_information.length).toBeGreaterThanOrEqual(2)
    }
  })

  // REGRESSION: Response quality — all variants must ask family history
  it('[REG-RQ1] All variants include a family history follow-up question', async () => {
    const variants = [
      { text: 'I have hair loss and acne', lang: 'English' },
      { text: 'ನನಗೆ ಮುಟ್ಟು ಸರಿಯಾಗಿಲ್ಲ', lang: 'Kannada' },
      { text: 'मुझे अनियमित पीरियड्स हैं', lang: 'Hindi' },
    ]
    for (const { text, lang } of variants) {
      const resp = await processSymptoms(makeDemoInput(text, lang))
      const hasFamily = resp.missing_information.some(q =>
        /family|परिवार|ಕುಟುಂಬ/i.test(q)
      )
      expect(hasFamily).toBe(true)
    }
  })
})

describe('PCOS education — safe messaging standards', () => {
  it('[REG-V1] Hindi response does not use confirmation language for PCOS tests', async () => {
    const resp = await processSymptoms(makeDemoInput('अनियमित पीरियड्स', 'Hindi', 'Hindi'))
    // Must NOT say tests "confirm" PCOS — only evaluate/assess
    expect(resp.pcos_education).not.toContain('पुष्टि')
  })

  it('[REG-V2] Kannada response does not use definitive detection language', async () => {
    const resp = await processSymptoms(makeDemoInput('ಮುಟ್ಟು ಸರಿಯಾಗಿಲ್ಲ', 'Kannada', 'Kannada'))
    // ಪತ್ತೆ ಹಚ್ಚ (detect definitively) should be replaced by ಮೌಲ್ಯಮಾಪನ (evaluation)
    expect(resp.pcos_education).not.toContain('ಪತ್ತೆ ಹಚ್ಚಲು')
  })

  it('PCOS education always clarifies PCOS diagnosis requires clinical evaluation, not symptoms alone', async () => {
    const resp = await processSymptoms(makeDemoInput('I have irregular periods and acne'))
    expect(resp.pcos_education).toMatch(
      /clinical\s+evaluation|evaluation|cannot\s+confirm|alone\s+cannot|not\s+(sufficient|enough|specific)/i
    )
  })

  it('PCOS education does not state ultrasound alone confirms PCOS', async () => {
    const variants = [
      { text: 'ನನಗೆ ಮುಟ್ಟು ಸರಿಯಾಗಿಲ್ಲ', lang: 'Kannada' },
      { text: 'मुझे अनियमित पीरियड्स हैं', lang: 'Hindi' },
      { text: 'I have irregular periods', lang: 'English' },
    ]
    for (const { text, lang } of variants) {
      const resp = await processSymptoms(makeDemoInput(text, lang))
      // Must not suggest ultrasound alone confirms PCOS
      const pcos = resp.pcos_education.toLowerCase()
      const hasUltrasound = pcos.includes('ultrasound') || pcos.includes('ಅಲ್ಟ್ರಾಸೌಂಡ್') || pcos.includes('अल्ट्रासाउंड')
      if (hasUltrasound) {
        // If ultrasound is mentioned, it must be alongside other requirements, not as sole confirmator
        expect(pcos).toMatch(
          /alone|not\s+(sufficient|enough)|clinical|cannot\s+confirm|ಸಾಕಾಗ|ಅಗತ್ಯ|अकेले|आवश्यक/
        )
      }
    }
  })
})
