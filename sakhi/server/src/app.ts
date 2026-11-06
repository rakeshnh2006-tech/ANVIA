import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import symptomRoutes from './routes/symptom.routes'
import symptomsRoutes from './routes/symptoms.routes'
import cycleRoutes from './routes/cycle.routes'
import reportRoutes from './routes/report.routes'

dotenv.config()

const app = express()

// Security
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.',
})
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'AI analysis rate limit exceeded. Please wait a moment.',
})

app.use(limiter)
app.use(express.json({ limit: '50kb' }))
app.use(express.urlencoded({ extended: false }))

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ai_provider: process.env.AI_PROVIDER || 'demo',
    demo_mode: !process.env.AI_API_KEY || process.env.AI_PROVIDER === 'demo',
  })
})

// Routes
app.use('/api/symptom', aiLimiter, symptomRoutes)
app.use('/api/symptoms', symptomsRoutes)
app.use('/api/cycles', cycleRoutes)
app.use('/api/report', reportRoutes)

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler (no sensitive info in logs)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
