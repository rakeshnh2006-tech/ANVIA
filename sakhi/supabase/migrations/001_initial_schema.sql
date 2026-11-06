-- SAKHI Database Migrations
-- Run these in your Supabase SQL editor in order

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          TEXT,
  preferred_language    TEXT DEFAULT 'English',
  age_range             TEXT,
  has_pcos_diagnosis    BOOLEAN,
  wants_cycle_tracking  BOOLEAN,
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 2. SYMPTOM ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.symptom_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptom_name  TEXT NOT NULL,
  severity      SMALLINT NOT NULL CHECK (severity BETWEEN 1 AND 10),
  duration      TEXT,
  description   TEXT,
  recorded_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS symptom_entries_user_id_idx ON public.symptom_entries(user_id);
CREATE INDEX IF NOT EXISTS symptom_entries_recorded_at_idx ON public.symptom_entries(recorded_at DESC);

ALTER TABLE public.symptom_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own symptom entries" ON public.symptom_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. CYCLE ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cycle_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start    DATE NOT NULL,
  period_end      DATE,
  flow_intensity  TEXT CHECK (flow_intensity IN ('spotting', 'light', 'moderate', 'heavy')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT period_end_after_start CHECK (period_end IS NULL OR period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS cycle_entries_user_id_idx ON public.cycle_entries(user_id);
CREATE INDEX IF NOT EXISTS cycle_entries_period_start_idx ON public.cycle_entries(period_start DESC);

ALTER TABLE public.cycle_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cycle entries" ON public.cycle_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. AI CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_input      TEXT NOT NULL,
  detected_language   TEXT,
  preferred_language  TEXT,
  structured_response JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_conversations_user_id_idx ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS ai_conversations_created_at_idx ON public.ai_conversations(created_at DESC);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own AI conversations" ON public.ai_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. CONSENT RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.consent_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type  TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS consent_records_user_id_idx ON public.consent_records(user_id);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own consent records" ON public.consent_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
