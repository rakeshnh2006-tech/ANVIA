import { describe, it, expect } from '@jest/globals'
import { detectLanguage } from '../utils/language-detection'

describe('Language detection', () => {
  it('detects English', () => {
    expect(detectLanguage('I have irregular periods and hair fall')).toBe('English')
  })

  it('detects Kannada script', () => {
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

  it('handles empty string gracefully', () => {
    const result = detectLanguage('')
    expect(result).toBe('Unknown')
  })
})
