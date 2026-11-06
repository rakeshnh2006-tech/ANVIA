/**
 * Deterministic safety check — runs BEFORE any LLM processing.
 * This must not depend on the AI provider's response.
 * The AI is NEVER allowed to downgrade an urgent result from this check.
 *
 * Supports English + Kannada + Hindi + Tamil + Telugu + Malayalam emergency patterns.
 */

export interface SafetyResult {
  level: 'safe' | 'prompt' | 'urgent'
  triggers: string[]
  message: string
}

// ─── URGENT RED-FLAG PATTERNS ─────────────────────────────────────────────────
// English patterns
const URGENT_PATTERNS_EN: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /severe\s+(pelvic|abdominal|stomach|belly)\s+pain/i, label: 'Severe pelvic or abdominal pain' },
  { pattern: /sudden\s+(pelvic|abdominal|stomach)\s+pain/i,       label: 'Sudden abdominal pain' },
  { pattern: /faint(ing|ed|ness)?|lost?\s+consciousness|pass(ed|ing)\s+out/i, label: 'Fainting or loss of consciousness' },
  { pattern: /heavy\s+bleed(ing)?.*?(dizzy|dizziness|faint|weak|weakness)/i,  label: 'Heavy bleeding with faintness or weakness' },
  { pattern: /(dizzy|faint|weak).*?heavy\s+bleed(ing)?/i,          label: 'Heavy bleeding with faintness or weakness' },
  // Heavy bleeding with severe pain — risk of haemorrhage (no faintness required)
  { pattern: /heavy\s+bleed(ing)?.*?severe\s+(cramp|pain|pressure)/i, label: 'Heavy bleeding with severe pain' },
  { pattern: /severe\s+(cramp|pain|pressure).*?heavy\s+bleed(ing)?/i, label: 'Heavy bleeding with severe pain' },
  { pattern: /chest\s+pain|breathing\s+difficult|can(not|'t)?\s+breathe|shortness\s+of\s+breath/i, label: 'Chest pain or severe breathing difficulty' },
  { pattern: /preg(nant|nancy).*?(pain|bleed)/i,                   label: 'Possible pregnancy with pain or bleeding' },
  { pattern: /(pain|bleed).*?preg(nant|nancy)/i,                   label: 'Possible pregnancy with pain or bleeding' },
  { pattern: /blood\s+clot.*?(dizzy|faint|pain)/i,                 label: 'Blood clots with concerning symptoms' },
  { pattern: /uncontrolled?\s+bleed/i,                             label: 'Uncontrolled bleeding' },
  { pattern: /severe\s+(nausea|vomiting).*?(bleed|pain|faint)/i,   label: 'Severe nausea/vomiting with bleeding or pain' },
  // Unexplained weight loss with bleeding — warrants urgent evaluation
  { pattern: /unexplained\s+weight\s+loss.*?bleed|bleed.*?unexplained\s+weight\s+loss/i, label: 'Bleeding with unexplained weight loss' },
]

// Kannada patterns (ಕನ್ನಡ) — emergency keywords
const URGENT_PATTERNS_KN: Array<{ pattern: RegExp; label: string }> = [
  // ತೀವ್ರ ನೋವು = severe pain
  { pattern: /ತೀವ್ರ\s*(ಹೊಟ್ಟೆ|ಹೊಕ್ಕಳ|ಮೇಲ್ಭಾಗ|ಕೆಳ\s*ಹೊಟ್ಟೆ)\s*ನೋವು/u, label: 'Severe abdominal pain (Kannada)' },
  // ಮೂರ್ಛೆ = fainting/unconsciousness
  { pattern: /ಮೂರ್ಛೆ|ಪ್ರಜ್ಞೆ\s*ತಪ್ಪಿ/u, label: 'Loss of consciousness (Kannada)' },
  // ಅತಿಯಾದ ರಕ್ತಸ್ರಾವ = heavy bleeding
  { pattern: /ಅತಿಯಾದ\s*ರಕ್ತಸ್ರಾವ/u, label: 'Heavy bleeding (Kannada)' },
  // ಎದೆ ನೋವು = chest pain
  { pattern: /ಎದೆ\s*ನೋವು/u, label: 'Chest pain (Kannada)' },
  // ಉಸಿರಾಟ ತೊಂದರೆ = breathing difficulty
  { pattern: /ಉಸಿರಾಟ\s*ತೊಂದರೆ|ಉಸಿರು\s*ಕಟ್ಟ/u, label: 'Breathing difficulty (Kannada)' },
]

// Hindi patterns (हिन्दी) — emergency keywords
const URGENT_PATTERNS_HI: Array<{ pattern: RegExp; label: string }> = [
  // तेज पेट दर्द = severe stomach pain
  { pattern: /तेज़?\s*(पेट|उदर)\s*दर्द/u, label: 'Severe abdominal pain (Hindi)' },
  // बेहोश = faint/unconscious
  { pattern: /बेहोश|चेतना\s*खो|होश\s*खो/u, label: 'Loss of consciousness (Hindi)' },
  // अत्यधिक रक्तस्राव = heavy bleeding
  { pattern: /अत्यधिक\s*रक्तस्राव|बहुत\s*(ज़्यादा|ज्यादा)\s*ख़ून|बहुत\s*खून/u, label: 'Heavy bleeding (Hindi)' },
  // सीने में दर्द = chest pain
  { pattern: /सीने?\s*(में|मे)\s*दर्द|छाती\s*(में|मे)\s*दर्द/u, label: 'Chest pain (Hindi)' },
  // सांस लेने में तकलीफ = breathing difficulty
  { pattern: /सांस\s*लेने\s*(में|मे)\s*तकलीफ|सांस\s*नहीं\s*आ/u, label: 'Breathing difficulty (Hindi)' },
  // गर्भावस्था + दर्द/रक्तस्राव
  { pattern: /गर्भ(वती|ावस्था).*(दर्द|रक्तस्राव|खून)/u, label: 'Pregnancy with pain or bleeding (Hindi)' },
]

// Tamil patterns (தமிழ்) — emergency keywords
const URGENT_PATTERNS_TA: Array<{ pattern: RegExp; label: string }> = [
  // வயிற்று வலி = stomach pain; கடுமையான = severe
  { pattern: /கடுமையான\s*(வயிற்று|இடுப்பு|அடி\s*வயிற்று)\s*வலி/u, label: 'Severe abdominal pain (Tamil)' },
  // மயக்கம் = fainting
  { pattern: /மயக்கம்|நினைவு\s*இழ/u, label: 'Fainting or loss of consciousness (Tamil)' },
  // அதிகமான இரத்தப்போக்கு = heavy bleeding
  { pattern: /அதிகமான\s*இரத்தப்போக்கு|அதிக\s*ரத்தம்/u, label: 'Heavy bleeding (Tamil)' },
  // மார்பு வலி = chest pain
  { pattern: /மார்பு\s*வலி/u, label: 'Chest pain (Tamil)' },
  // சுவாசிக்க சிரமம் = breathing difficulty
  { pattern: /சுவாசிக்க\s*சிரமம்|மூச்சு\s*திணற/u, label: 'Breathing difficulty (Tamil)' },
]

// Telugu patterns (తెలుగు) — emergency keywords
const URGENT_PATTERNS_TE: Array<{ pattern: RegExp; label: string }> = [
  // తీవ్రమైన నొప్పి = severe pain; పొట్ట = stomach
  { pattern: /తీవ్రమైన\s*(పొట్ట|కడుపు|తీవ్ర)\s*నొప్పి/u, label: 'Severe abdominal pain (Telugu)' },
  // స్పృహ కోల్పోవడం = loss of consciousness
  { pattern: /స్పృహ\s*కోల్పో|మూర్ఛ/u, label: 'Loss of consciousness (Telugu)' },
  // అధిక రక్తస్రావం = heavy bleeding
  { pattern: /అధిక\s*రక్తస్రావం/u, label: 'Heavy bleeding (Telugu)' },
  // ఛాతీ నొప్పి = chest pain
  { pattern: /ఛాతీ\s*నొప్పి/u, label: 'Chest pain (Telugu)' },
  // శ్వాసలో ఇబ్బంది = breathing difficulty
  { pattern: /శ్వాస(లో\s*ఇబ్బంది|తీసుకోవడం\s*కష్టం)/u, label: 'Breathing difficulty (Telugu)' },
]

// Malayalam patterns (മലയാളം) — emergency keywords
const URGENT_PATTERNS_ML: Array<{ pattern: RegExp; label: string }> = [
  // കടുത്ത വേദന = severe pain; വയർ = stomach
  { pattern: /കടുത്ത\s*(വയർ|ഉദര|ഇടുപ്പ്)\s*വേദന/u, label: 'Severe abdominal pain (Malayalam)' },
  // ബോധം നഷ്ടമാകുക = loss of consciousness
  { pattern: /ബോധം\s*നഷ്ടമാ|ബോധം\s*പോ/u, label: 'Loss of consciousness (Malayalam)' },
  // അമിത രക്തസ്രാവം = heavy bleeding
  { pattern: /അമിത\s*രക്തസ്രാവം|അധിക\s*രക്തം/u, label: 'Heavy bleeding (Malayalam)' },
  // നെഞ്ചുവേദന = chest pain
  { pattern: /നെഞ്ചുവേദന|നെഞ്ചിൽ\s*വേദന/u, label: 'Chest pain (Malayalam)' },
  // ശ്വാസം മുട്ടൽ = breathing difficulty
  { pattern: /ശ്വാസം\s*മുട്ടൽ|ശ്വസിക്കാൻ\s*കഴിയ/u, label: 'Breathing difficulty (Malayalam)' },
]

// Combined: all urgent patterns across all languages
const ALL_URGENT_PATTERNS = [
  ...URGENT_PATTERNS_EN,
  ...URGENT_PATTERNS_KN,
  ...URGENT_PATTERNS_HI,
  ...URGENT_PATTERNS_TA,
  ...URGENT_PATTERNS_TE,
  ...URGENT_PATTERNS_ML,
]

// ─── PROMPT ASSESSMENT PATTERNS ───────────────────────────────────────────────
const PROMPT_PATTERNS_EN: Array<{ pattern: RegExp; label: string }> = [
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

const PROMPT_PATTERNS_REGIONAL: Array<{ pattern: RegExp; label: string }> = [
  // Kannada: ಅನಿಯಮಿತ ಮುಟ್ಟು = irregular period
  { pattern: /ಅನಿಯಮಿತ\s*ಮುಟ್ಟು|ಮುಟ್ಟು\s*ಆಗುತ್ತಿಲ್ಲ|ಅನಿಯಮಿತ\s*ಪಿರಿಯಡ್/u, label: 'Irregular periods (Kannada)' },
  { pattern: /ಕೂದಲು\s*ಉದುರುತ್ತಿದೆ|ಕೂದಲು\s*ಉದುರ/u,                          label: 'Hair loss (Kannada)' },
  // Hindi: अनियमित पीरियड्स = irregular periods
  { pattern: /अनियमित\s*पीरियड्?|माहवारी\s*नहीं\s*आ|पीरियड्?\s*न\s*आ/u,    label: 'Irregular periods (Hindi)' },
  { pattern: /बाल\s*(झड़|गिर)/u,                                              label: 'Hair loss (Hindi)' },
  // Tamil: ஒழுங்கற்ற மாதவிடாய் = irregular menstruation
  { pattern: /ஒழுங்கற்ற\s*மாதவிடாய்|மாதவிடாய்\s*வரவில்லை/u,               label: 'Irregular periods (Tamil)' },
  // Telugu: అక్రమ ఋతుస్రావం = irregular menstruation
  { pattern: /అక్రమ\s*ఋతుస్రావం|ఋతుస్రావం\s*రావడం\s*లేద/u,                 label: 'Irregular periods (Telugu)' },
  // Malayalam: ക്രമക്കേടുള്ള ആർത്തവം = irregular menstruation
  { pattern: /ക്രമക്കേടുള്ള\s*ആർത്തവം|ആർത്തവം\s*ഇല്ല/u,                   label: 'Irregular periods (Malayalam)' },
]

const ALL_PROMPT_PATTERNS = [...PROMPT_PATTERNS_EN, ...PROMPT_PATTERNS_REGIONAL]

// ─── CORE FUNCTIONS ───────────────────────────────────────────────────────────

export function runSafetyCheck(input: string): SafetyResult {
  const urgentTriggers: string[] = []

  for (const { pattern, label } of ALL_URGENT_PATTERNS) {
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
  for (const { pattern, label } of ALL_PROMPT_PATTERNS) {
    if (pattern.test(input)) promptTriggers.push(label)
  }

  // Threshold: 2+ prompt patterns, OR heavy bleeding mentioned alone (even without other prompt triggers)
  // Fix: heavyBleedingAlone should trigger when heavy bleeding is present regardless of other prompt pattern count
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
