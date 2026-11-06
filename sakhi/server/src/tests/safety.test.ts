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

describe('Safety — Prompt patterns', () => {
  it('irregular periods + hair loss → prompt', () => {
    expect(runSafetyCheck('I have irregular periods and hair loss').level).toBe('prompt')
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
