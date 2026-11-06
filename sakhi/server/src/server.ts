import app from './app'

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`[SAKHI Server] Running on http://localhost:${PORT}`)
  console.log(`[SAKHI Server] AI provider: ${process.env.AI_PROVIDER || 'demo'}`)
  if (!process.env.AI_API_KEY) {
    console.warn('[SAKHI Server] AI_API_KEY not set — running in DEMO mode')
  }
})
