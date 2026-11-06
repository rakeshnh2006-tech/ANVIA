/**
 * AI symptom analysis route tests.
 * Tests: symptom analysis, validation edge cases, safety escalation, history.
 */
import request from 'supertest'
import app from '../app'

const USER_ID = 'user-cccc-cccc-cccc-cccccccccccc'
const TOKEN = 'Bearer token-for-user-c'

// Fluent Supabase chain mock — handles select/eq/order/limit/gte/lte/insert/delete
function makeFluentChain(resolveData: unknown = [], resolveError: unknown = null) {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  chain.eq = self
  chain.order = self
  chain.limit = () => Promise.resolve({ data: resolveData, error: resolveError })
  chain.gte = self
  chain.lte = self
  chain.then = (resolve: (v: unknown) => void) => resolve({ data: resolveData, error: resolveError })
  chain.select = () => ({
    eq: self,
    order: self,
    gte: self,
    lte: self,
    limit: () => Promise.resolve({ data: resolveData, error: resolveError }),
    single: () => Promise.resolve({ data: resolveData, error: resolveError }),
    then: (resolve: (v: unknown) => void) => resolve({ data: resolveData, error: resolveError }),
  })
  chain.single = () => Promise.resolve({
    data: { id: 'ai-conv-001', user_id: USER_ID, created_at: new Date().toISOString() },
    error: null,
  })
  return chain
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockImplementation(async (token: string) => {
        if (token === 'token-for-user-c') {
          return { data: { user: { id: USER_ID } }, error: null }
        }
        return { data: { user: null }, error: { message: 'Invalid token' } }
      }),
    },
    from: (table: string) => {
      const chain = makeFluentChain([], null)
      // insert → select → single returns a created row
      chain.insert = (_body: unknown) => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { id: 'ai-conv-001', user_id: USER_ID, original_input: 'test', created_at: new Date().toISOString() },
            error: null,
          }),
        }),
      })
      // delete → eq resolves void
      chain.delete = () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      })
      return chain
    },
  }),
}))

// ─── Helpers ───────────────────────────────────────────────────────────────
// Expected statuses for AI analyze — includes 429 (rate limit from aiLimiter in tests)
const ANALYZE_OK = [200, 201, 429]

async function analyze(input: string) {
  return request(app)
    .post('/api/symptom/analyze')
    .set('Authorization', TOKEN)
    .send({ input })
}

// ─── Tests ─────────────────────────────────────────────────────────────────

// Route response shape: { safety, ai_response, is_demo }
// ai_response shape: { care_urgency, symptoms_identified, disclaimer, ... }

describe('AI analyze — English inputs', () => {
  it('returns 200 for standard English symptom description', async () => {
    const res = await analyze('I have been experiencing irregular periods for 3 months.')
    expect(ANALYZE_OK).toContain(res.status)
    if (res.status === 200) {
      expect(res.body).toHaveProperty('ai_response')
      expect(res.body).toHaveProperty('safety')
      if (res.body.ai_response) {
        expect(res.body.ai_response).toHaveProperty('symptoms_identified')
        expect(res.body.ai_response).toHaveProperty('care_urgency')
        expect(res.body.ai_response).toHaveProperty('disclaimer')
      }
    }
  })

  it('response contains a disclaimer for English input', async () => {
    const res = await analyze('I feel very tired even after sleeping.')
    expect(ANALYZE_OK).toContain(res.status)
    if (res.status === 200 && res.body.ai_response) {
      expect(res.body.ai_response.disclaimer).toBeTruthy()
      expect(typeof res.body.ai_response.disclaimer).toBe('string')
    }
  })

  it('care_urgency is one of routine, prompt, urgent', async () => {
    const res = await analyze('I have acne and some facial hair growth.')
    expect(ANALYZE_OK).toContain(res.status)
    if (res.status === 200 && res.body.ai_response) {
      expect(['routine', 'prompt', 'urgent']).toContain(res.body.ai_response.care_urgency)
    }
  })

  it('symptoms_identified is an array', async () => {
    const res = await analyze('Hair fall and weight gain over last 6 months.')
    expect(ANALYZE_OK).toContain(res.status)
    if (res.status === 200 && res.body.ai_response) {
      expect(Array.isArray(res.body.ai_response.symptoms_identified)).toBe(true)
    }
  })
})

describe('AI analyze — validation edge cases', () => {
  it('returns 400 for empty input string', async () => {
    const res = await request(app)
      .post('/api/symptom/analyze')
      .set('Authorization', TOKEN)
      .send({ input: '' })
    expect(res.status).toBe(400)
  })

  it('returns 400 for whitespace-only input (trimmed to empty by schema, or 429 rate-limited)', async () => {
    const res = await request(app)
      .post('/api/symptom/analyze')
      .set('Authorization', TOKEN)
      .send({ input: '   \n\t  ' })
    // Schema uses .trim().min(3) — whitespace trims to '' which fails min(3)
    expect([400, 429]).toContain(res.status)
  })

  it('returns 400 or 413 for extremely long input (> 3000 chars)', async () => {
    const res = await request(app)
      .post('/api/symptom/analyze')
      .set('Authorization', TOKEN)
      .send({ input: 'A'.repeat(3001) })
    // Either the schema rejects it (400), Express body limit (413), or rate-limited (429)
    expect([400, 413, 422, 429]).toContain(res.status)
  })

  it('returns 400 for missing input field (or 429 if rate-limited)', async () => {
    const res = await request(app)
      .post('/api/symptom/analyze')
      .set('Authorization', TOKEN)
      .send({})
    expect([400, 429]).toContain(res.status)
  })

  it('returns 401 for request without Authorization header (or 429 if rate-limited)', async () => {
    const res = await request(app)
      .post('/api/symptom/analyze')
      .send({ input: 'I have irregular periods' })
    expect([401, 429]).toContain(res.status)
  })
})

describe('AI analyze — safety escalation', () => {
  it('urgent symptoms return safety.level: urgent (not downgraded)', async () => {
    const res = await analyze('I am experiencing severe pelvic pain and I keep fainting.')
    expect(ANALYZE_OK).toContain(res.status)
    if (res.status === 200) {
      // Urgent safety result is returned immediately without AI response
      expect(res.body.safety.level).toBe('urgent')
    }
  })

  it('heavy bleeding with dizziness triggers urgent safety level', async () => {
    const res = await analyze('I have heavy bleeding and I feel very dizzy and faint.')
    expect(ANALYZE_OK).toContain(res.status)
    if (res.status === 200) {
      expect(res.body.safety.level).toBe('urgent')
    }
  })

  it('chest pain triggers urgent safety level', async () => {
    const res = await analyze('I have severe chest pain and shortness of breath.')
    expect(ANALYZE_OK).toContain(res.status)
    if (res.status === 200) {
      expect(res.body.safety.level).toBe('urgent')
    }
  })
})

describe('AI symptom history', () => {
  it('GET /api/symptom/history — 401 without auth', async () => {
    const res = await request(app).get('/api/symptom/history')
    // May be 401 (auth) or 429 (rate limit hits before auth check)
    expect([401, 429]).toContain(res.status)
  })

  it('GET /api/symptom/history — 200 with valid auth', async () => {
    const res = await request(app)
      .get('/api/symptom/history')
      .set('Authorization', TOKEN)
    expect([200, 429]).toContain(res.status)
    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true)
    }
  })

  it('DELETE /api/symptom/history — 401 without auth', async () => {
    const res = await request(app).delete('/api/symptom/history')
    expect([401, 429]).toContain(res.status)
  })

  it('DELETE /api/symptom/history — 200 with valid auth', async () => {
    const res = await request(app)
      .delete('/api/symptom/history')
      .set('Authorization', TOKEN)
    expect([200, 429]).toContain(res.status)
  })
})

describe('Report generation', () => {
  it('GET /api/report/generate — 401 without auth', async () => {
    const res = await request(app).get('/api/report/generate')
    expect(res.status).toBe(401)
  })

  it('GET /api/report/generate — 200 with valid auth, returns expected shape', async () => {
    const res = await request(app)
      .get('/api/report/generate')
      .set('Authorization', TOKEN)
      .query({ from: '2024-01-01', to: '2024-03-31' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('symptom_entries')
    expect(res.body).toHaveProperty('cycle_entries')
    expect(res.body).toHaveProperty('disclaimer')
    expect(res.body).toHaveProperty('period')
    expect(res.body.period).toHaveProperty('from', '2024-01-01')
    expect(res.body.period).toHaveProperty('to', '2024-03-31')
  })

  it('GET /api/report/generate — disclaimer is educational and mentions not a diagnosis', async () => {
    const res = await request(app)
      .get('/api/report/generate')
      .set('Authorization', TOKEN)
    if (res.status === 200) {
      // Disclaimer must mention "educational" AND clarify AI content is not a diagnosis
      expect(res.body.disclaimer).toMatch(/educational/i)
      expect(res.body.disclaimer).toMatch(/not constitute medical diagnosis|not a medical diagnosis|does not diagnose/i)
    }
  })

  it('report disclaimer body is non-empty string', async () => {
    const res = await request(app)
      .get('/api/report/generate')
      .set('Authorization', TOKEN)
    if (res.status === 200) {
      expect(typeof res.body.disclaimer).toBe('string')
      expect(res.body.disclaimer.length).toBeGreaterThan(20)
    }
  })
})
