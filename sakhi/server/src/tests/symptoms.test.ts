/**
 * Symptom Journal CRUD integration tests.
 * Tests: valid creation, validation, PATCH, DELETE, auth protection.
 */
import request from 'supertest'
import app from '../app'

const TOKEN_A = 'Bearer token-for-user-a'
const USER_A_ID = 'user-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockImplementation(async (token: string) => {
        if (token === 'token-for-user-a') {
          return { data: { user: { id: USER_A_ID } }, error: null }
        }
        return { data: { user: null }, error: { message: 'Invalid token' } }
      }),
    },
    from: () => {
      let _mode: 'read' | 'insert' | 'update' | 'delete' = 'read'
      let _body: Record<string, unknown> | null = null

      const chain: Record<string, unknown> = {
        eq: () => chain,
        order: () => chain,
        select(_cols?: string) {
          return {
            eq: () => ({
              order: () => ({
                then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
              }),
            }),
            single: async () => {
              if (_mode === 'insert') {
                return { data: { id: 'sym-001', ..._body, user_id: USER_A_ID, created_at: new Date().toISOString() }, error: null }
              }
              if (_mode === 'update') {
                return { data: { id: 'sym-001', ..._body, user_id: USER_A_ID }, error: null }
              }
              return { data: null, error: null }
            },
          }
        },
        insert(body: Record<string, unknown>) {
          _mode = 'insert'
          _body = body
          return chain
        },
        update(body: Record<string, unknown>) {
          _mode = 'update'
          _body = body
          return chain
        },
        delete() {
          _mode = 'delete'
          return chain
        },
        then(resolve: (v: unknown) => void) {
          if (_mode === 'delete') { resolve({ data: null, error: null }); return }
          resolve({ data: [], error: null })
        },
      }
      return chain
    },
  }),
}))

describe('Symptom Journal CRUD', () => {
  it('GET /api/symptoms — requires auth', async () => {
    const res = await request(app).get('/api/symptoms')
    expect(res.status).toBe(401)
  })

  it('GET /api/symptoms — returns 200 with valid token', async () => {
    const res = await request(app)
      .get('/api/symptoms')
      .set('Authorization', TOKEN_A)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('POST /api/symptoms — creates a valid symptom entry', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({
        symptom_name: 'Headache',
        severity: 6,
        duration: '2 hours',
        description: 'Throbbing pain on left side',
        recorded_at: '2024-03-15',
      })
    expect([200, 201]).toContain(res.status)
  })

  it('POST /api/symptoms — rejects missing symptom_name', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({ severity: 5 })
    expect(res.status).toBe(400)
  })

  it('POST /api/symptoms — rejects severity out of range (0)', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({ symptom_name: 'Fatigue', severity: 0 })
    expect(res.status).toBe(400)
  })

  it('POST /api/symptoms — rejects severity out of range (11)', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({ symptom_name: 'Fatigue', severity: 11 })
    expect(res.status).toBe(400)
  })

  it('POST /api/symptoms — rejects non-integer severity', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({ symptom_name: 'Pain', severity: 3.5 })
    expect(res.status).toBe(400)
  })

  it('POST /api/symptoms — rejects symptom_name longer than 100 chars', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({ symptom_name: 'A'.repeat(101), severity: 5 })
    expect(res.status).toBe(400)
  })

  it('POST /api/symptoms — accepts cycle_day field', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({ symptom_name: 'Cramping', severity: 7, cycle_day: 3 })
    expect([200, 201]).toContain(res.status)
  })

  it('POST /api/symptoms — rejects cycle_day out of range (0)', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({ symptom_name: 'Cramping', severity: 5, cycle_day: 0 })
    expect(res.status).toBe(400)
  })

  it('POST /api/symptoms — rejects cycle_day out of range (41)', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({ symptom_name: 'Cramping', severity: 5, cycle_day: 41 })
    expect(res.status).toBe(400)
  })

  it('PATCH /api/symptoms/:id — accepts partial update', async () => {
    const res = await request(app)
      .patch('/api/symptoms/sym-001')
      .set('Authorization', TOKEN_A)
      .send({ severity: 8 })
    expect([200, 404]).toContain(res.status)
  })

  it('PATCH /api/symptoms/:id — 401 without auth', async () => {
    const res = await request(app)
      .patch('/api/symptoms/sym-001')
      .send({ severity: 8 })
    expect(res.status).toBe(401)
  })

  it('DELETE /api/symptoms/:id — 401 without auth', async () => {
    const res = await request(app).delete('/api/symptoms/sym-001')
    expect(res.status).toBe(401)
  })

  it('DELETE /api/symptoms/:id — 200 with valid auth', async () => {
    const res = await request(app)
      .delete('/api/symptoms/sym-001')
      .set('Authorization', TOKEN_A)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('success', true)
  })
})

describe('Symptom input — edge cases', () => {
  it('POST /api/symptoms — accepts description up to 500 chars', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({ symptom_name: 'Fatigue', severity: 4, description: 'D'.repeat(500) })
    expect([200, 201]).toContain(res.status)
  })

  it('POST /api/symptoms — rejects description over 500 chars', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({ symptom_name: 'Fatigue', severity: 4, description: 'D'.repeat(501) })
    expect(res.status).toBe(400)
  })

  it('POST /api/symptoms — accepts null duration (optional)', async () => {
    const res = await request(app)
      .post('/api/symptoms')
      .set('Authorization', TOKEN_A)
      .send({ symptom_name: 'Bloating', severity: 3, duration: null })
    expect([200, 201]).toContain(res.status)
  })
})
