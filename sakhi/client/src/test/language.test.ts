import { describe, it, expect } from 'vitest'

// Language detection logic (inline for vitest environment)
type SupportedLanguage = 'English' | 'Kannada' | 'Hindi' | 'Tamil' | 'Telugu' | 'Malayalam' | 'Mixed' | 'Unknown'

const SCRIPT_RANGES = [
  { name: 'Kannada' as SupportedLanguage,   start: 0x0C80, end: 0x0CFF },
  { name: 'Tamil' as SupportedLanguage,     start: 0x0B80, end: 0x0BFF },
  { name: 'Telugu' as SupportedLanguage,    start: 0x0C00, end: 0x0C7F },
  { name: 'Malayalam' as SupportedLanguage, start: 0x0D00, end: 0x0D7F },
  { name: 'Hindi' as SupportedLanguage,     start: 0x0900, end: 0x097F },
]

function detectLanguage(text: string): SupportedLanguage {
  const counts: Record<string, number> = {}
  const totalChars = text.replace(/\s+/g, '').length
  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0
    for (const { name, start, end } of SCRIPT_RANGES) {
      if (cp >= start && cp <= end) counts[name] = (counts[name] || 0) + 1
    }
  }
  let dominant: SupportedLanguage | null = null
  let maxCount = 0
  for (const [lang, count] of Object.entries(counts)) {
    if (count > maxCount) { maxCount = count; dominant = lang as SupportedLanguage }
  }
  const asciiAlpha = (text.match(/[a-zA-Z]/g) || []).length
  if (dominant && asciiAlpha > 5 && maxCount > 3) return 'Mixed'
  if (dominant) return dominant
  if (asciiAlpha / Math.max(totalChars, 1) > 0.5) return 'English'
  return 'Unknown'
}

describe('Language detection', () => {
  it('detects English', () => {
    expect(detectLanguage('I have irregular periods and hair fall')).toBe('English')
  })

  it('detects Kannada', () => {
    expect(detectLanguage('ನನಗೆ ಮೂರು ತಿಂಗಳಿಂದ ಸರಿಯಾಗಿ ಪಿರಿಯಡ್ಸ್ ಆಗುತ್ತಿಲ್ಲ')).toBe('Kannada')
  })

  it('detects Hindi (Devanagari)', () => {
    expect(detectLanguage('मुझे अनियमित पीरियड्स आ रहे हैं')).toBe('Hindi')
  })

  it('detects Tamil', () => {
    expect(detectLanguage('என் மாதவிடாய் தொடர்ந்து ஒழுங்கற்றதாக உள்ளது')).toBe('Tamil')
  })

  it('detects Telugu', () => {
    expect(detectLanguage('నాకు క్రమం తప్పిన ఋతుస్రావం ఉంది')).toBe('Telugu')
  })

  it('detects Malayalam', () => {
    expect(detectLanguage('എനിക്ക് ക്രമക്കേടുള്ള ആർത്തവം ഉണ്ട്')).toBe('Malayalam')
  })

  it('returns Unknown for empty string', () => {
    expect(detectLanguage('')).toBe('Unknown')
  })
})
