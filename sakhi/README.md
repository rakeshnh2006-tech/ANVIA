# SAKHI — AI-Powered Women's Health Understanding & PCOS Guidance Platform

> **Your Health. Your Language. Your Understanding.**

SAKHI is a full-stack web application that transforms everyday descriptions of women's health symptoms — including regional-language inputs — into understandable health information and guidance, with a focus on PCOS education and menstrual health tracking.

---

## ⚠️ Medical Disclaimer

SAKHI is an **educational health information platform, not a medical diagnosis service**. It does not diagnose PCOS or any other medical condition. All health information is for educational purposes only. Always consult a qualified healthcare professional for personal medical advice.

---

## Features

- **AI Symptom Understanding** — Natural language input in 6 Indian languages
- **PCOS Learning Centre** — Evidence-based educational content
- **Menstrual Cycle Tracker** — Log periods, see cycle history and estimates
- **Symptom Journal** — Track and visualize symptoms over time
- **Health Insights** — Charts and trends from your personal data
- **Doctor-Ready Reports** — Generate printable health summaries
- **Health Safety System** — Deterministic red-flag detection before AI processing
- **Privacy Controls** — Full data deletion, Supabase RLS
- **Multilingual Support** — English, Kannada, Hindi, Tamil, Telugu, Malayalam

---

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase JS client
- React Hook Form + Zod
- Recharts
- date-fns
- Lucide React

### Backend
- Node.js + Express + TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- Zod validation
- Helmet, CORS, rate limiting

### AI Integration
- Provider-independent AI service layer
- Supports OpenAI, Google AI, or demo mode
- Structured JSON response validation
- Server-side API key management

---

## Project Structure

```
sakhi/
├── client/                   # React frontend
│   └── src/
│       ├── contexts/         # Auth context
│       ├── layouts/          # Dashboard layout
│       ├── lib/              # Supabase client, API helpers
│       ├── pages/            # All application pages
│       ├── components/ui/    # Shared UI components
│       └── test/             # Frontend tests
├── server/                   # Express backend
│   └── src/
│       ├── middleware/       # Auth, validation
│       ├── routes/           # API routes
│       ├── schemas/          # Zod schemas
│       ├── services/         # AI, safety services
│       ├── tests/            # Server tests
│       └── utils/            # Language detection
└── supabase/
    └── migrations/           # Database migrations
```

---

## Prerequisites

- Node.js 18+
- npm 8+
- A [Supabase](https://supabase.com) account and project

---

## Installation

```bash
# Clone the repo
git clone <repo-url>
cd sakhi

# Install all dependencies (root, client and server)
npm install
cd client && npm install
cd ../server && npm install
```

---

## Environment Configuration

### Client (`client/.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Server (`server/.env`)
```
PORT=3001
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # NEVER expose in frontend

# AI Provider (set to "demo" for development without AI)
AI_PROVIDER=demo
AI_API_KEY=
AI_MODEL=gpt-4o-mini
```

---

## Database Setup

1. Create a Supabase project at https://supabase.com
2. Go to **SQL Editor** in your Supabase dashboard
3. Run the migration file: `supabase/migrations/001_initial_schema.sql`
4. This creates all tables, RLS policies, triggers and indexes

---

## Running Locally

```bash
# From the sakhi root directory:
npm run dev
```

This starts:
- Frontend at `http://localhost:5173`
- Backend at `http://localhost:3001`

Or run separately:
```bash
# Terminal 1 — Frontend
cd client && npm run dev

# Terminal 2 — Backend
cd server && npm run dev
```

---

## AI Integration

### Demo Mode (default)
When `AI_PROVIDER=demo` or no `AI_API_KEY` is set, SAKHI returns clearly labeled sample responses. Demo mode is transparent to users.

### OpenAI
```
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```

### Google AI (Gemini)
```
AI_PROVIDER=google
AI_API_KEY=your-google-ai-key
AI_MODEL=gemini-1.5-flash
```

The AI service is fully provider-swappable — add new providers in `server/src/services/ai.service.ts` without touching the frontend.

---

## Running Tests

### All tests (from sakhi root)
```bash
npm test
```

### Frontend tests (Vitest) — 50 tests
```bash
cd client
npm test
```

Covers:
- Landing page rendering and medical disclaimer
- Auth form validation (login, signup, reset, mode switching)
- UI state components (EmptyState, ErrorState, Skeleton)
- Environment variable security audit (no API keys exposed to client)

### Backend tests (Jest) — 118 tests
```bash
cd server
npm test
```

Covers:
- Safety service: English + 5 regional languages (Kannada, Hindi, Tamil, Telugu, Malayalam) × 5 emergency patterns
- Language detection: all 6 supported languages
- Zod schema validation: SymptomInput, AIResponse
- API auth middleware: all protected routes return 401/403 without valid token
- AI analyze route: English, Kannada, Hindi, mixed-language inputs, safety escalation
- Cycle CRUD: valid creation, invalid dates, partial PATCH, DELETE, cross-user isolation
- Symptom Journal CRUD: validation, severity range, cycle_day range, PATCH, DELETE
- Report generation: shape validation, disclaimer content
- Environment audit: no secrets in response bodies

---

## Health Safety System

SAKHI implements a **deterministic red-flag safety check** that runs BEFORE any AI processing:

1. Recognized emergency patterns (severe pain, fainting, heavy bleeding + dizziness) trigger an urgent banner
2. The AI is **never** allowed to downgrade an urgent result
3. For emergencies, users see the India emergency number (112) prominently
4. The AI provider is never relied upon for safety-critical decisions

See `server/src/services/safety.service.ts` for implementation.

---

## Security

- Supabase Row Level Security (RLS) on all user tables
- JWT authentication validated server-side on every API request
- Rate limiting: 100 req/15min global, 10 req/min for AI endpoints
- Helmet.js security headers
- No sensitive keys in frontend environment
- No sensitive data in application logs

---

## Known Limitations

1. **Demo mode AI responses** are sample responses, not real analysis. Configure `AI_PROVIDER` and `AI_API_KEY` in `server/.env` for live analysis.
2. **Email confirmation** may be required depending on your Supabase project settings. Check Supabase Dashboard → Authentication → Settings.
3. **PDF generation** uses jsPDF — runs entirely client-side. Generated in the browser; no server-side rendering.
4. **Supabase service role key** is required on the backend for admin operations. Never expose in frontend or version control.
5. **Adolescent PCOS** — The platform notes that applying PCOS criteria to adolescents requires caution, but does not implement age-specific educational branching.
6. **Rate limiting** — The AI analyze endpoint is limited to 10 requests/minute. Adjust in `server/src/app.ts` if needed.

---

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd client && npm run build
# Deploy the dist/ folder
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment variables
```

### Backend (Railway/Render/Fly.io)
```bash
cd server && npm run build
# Deploy and set all server environment variables
# Set CLIENT_URL to your deployed frontend URL
```

---

## Medical Safety Documentation

SAKHI was designed with the following safety principles:

1. **No diagnosis** — Never claims a user has PCOS or any medical condition
2. **Deterministic safety checks** — Emergency patterns detected without AI dependency
3. **Minimum urgency enforcement** — AI cannot downgrade safety system results
4. **Transparent AI** — Demo mode clearly labeled; AI limitations communicated
5. **Emergency guidance** — 112 (India) displayed prominently for urgent symptoms
6. **Evidence-based content** — PCOS educational content cites WHO, Rotterdam criteria, MoHFW India
7. **Adolescent awareness** — Notes that applying PCOS criteria to adolescents requires caution
8. **Privacy by design** — Health data accessible only to the individual user

---

Built with ❤️ for SAKHI — Women's Health Understanding Platform
