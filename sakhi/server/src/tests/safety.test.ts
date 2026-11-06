import { describe, it, expect } from '@jest/globals'
import { runSafetyCheck, enforceMinimumUrgency } from '../services/safety.service'

describe('Safety — English urgent patterns', () => {
  it('severe pelvic pain → urgent', () => {
    expect(runSafetyCheck('I am experiencing severe pelvic pain').level).toBe('urgent')
  })
  it('severe abdominal pain → urgent', () => {
    expect(runSafetyCheck('I have severe abdominal pain that came on suddenly').level).toBe('urgent')
  })
  it('heavy bleeding with faintness → urgent', () => {
    expect(runSafetyCheck('I have heavy bleeding and I feel faint and dizzy').level).toBe('urgent')
  })
  it('chest pain → urgent', () => {
    expect(runSafetyCheck('I have severe chest pain').level).toBe('urgent')
  })
  it('breathing difficulty → urgent', () => {
    expect(runSafetyCheck('I am having severe breathing difficulty').level).toBe('urgent')
  })
  it('loss of consciousness → urgent', () => {
    expect(runSafetyCheck('I passed out and lost consciousness').level).toBe('urgent')
  })
  it('pregnancy + bleeding → urgent', () => {
    expect(runSafetyCheck('I am pregnant and have bleeding').level).toBe('urgent')
  })
})

describe('Safety — Regional language urgent patterns', () => {
  it('Kannada fainting (ಮೂರ್ಛೆ) → urgent', () => {
    expect(runSafetyCheck('ನನಗೆ ಮೂರ್ಛೆ ಬಂದಿತು').level).toBe('urgent')
  })
  it('Kannada chest pain (ಎದೆ ನೋವು) → urgent', () => {
    expect(runSafetyCheck('ನನಗೆ ಎದೆ ನೋವು ಇದೆ').level).toBe('urgent')
  })
  it('Hindi unconscious (बेहोश) → urgent', () => {
    expect(runSafetyCheck('मैं बेहोश हो गई').level).toBe('urgent')
  })
  it('Hindi chest pain → urgent', () => {
    expect(runSafetyCheck('मुझे सीने में दर्द है').level).toBe('urgent')
  })
  it('Tamil fainting (மயக்கம்) → urgent', () => {
    expect(runSafetyCheck('எனக்கு மயக்கம் வந்தது').level).toBe('urgent')
  })
  it('Tamil chest pain (மார்பு வலி) → urgent', () => {
    expect(runSafetyCheck('என் மார்பு வலி உள்ளது').level).toBe('urgent')
  })
  it('Telugu unconsciousness (స్పృహ కోల్పో) → urgent', () => {
    expect(runSafetyCheck('నాకు స్పృహ కోల్పోయింది').level).toBe('urgent')
  })
  it('Malayalam chest pain (നെഞ്ചുവേദന) → urgent', () => {
    expect(runSafetyCheck('എനിക്ക് നെഞ്ചുവേദന ഉണ്ട്').level).toBe('urgent')
  })
})

describe('Safety — Prompt patterns', () => {
  it('irregular periods + hair loss → prompt', () => {
    expect(runSafetyCheck('I have irregular periods and hair loss').level).toBe('prompt')
  })
  it('Kannada irregular period (ಅನಿಯಮಿತ ಮುಟ್ಟು) → counts toward prompt', () => {
    const result = runSafetyCheck('ನನಗೆ ಅನಿಯಮಿತ ಮುಟ್ಟು ಇದೆ ಮತ್ತು ಕೂದಲು ಉದುರುತ್ತಿದೆ')
    expect(['prompt', 'urgent']).toContain(result.level)
  })
  it('Hindi irregular period (अनियमित पीरियड) + hair loss → prompt or higher', () => {
    const result = runSafetyCheck('मुझे अनियमित पीरियड्स और बाल झड़ने की समस्या है')
    expect(['prompt', 'urgent']).toContain(result.level)
  })
  it('single minor symptom → safe', () => {
    expect(runSafetyCheck('I have a mild headache').level).toBe('safe')
  })
})

describe('Safety — enforceMinimumUrgency', () => {
  it('AI routine cannot override safety urgent', () => {
    expect(enforceMinimumUrgency('routine', 'urgent')).toBe('urgent')
  })
  it('AI prompt cannot override safety urgent', () => {
    expect(enforceMinimumUrgency('prompt', 'urgent')).toBe('urgent')
  })
  it('AI routine cannot override safety prompt', () => {
    expect(enforceMinimumUrgency('routine', 'prompt')).toBe('prompt')
  })
  it('AI urgent is kept when safety is safe', () => {
    expect(enforceMinimumUrgency('urgent', 'safe')).toBe('urgent')
  })
  it('AI prompt is kept when safety is safe', () => {
    expect(enforceMinimumUrgency('prompt', 'safe')).toBe('prompt')
  })
})
