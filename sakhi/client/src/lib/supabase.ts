import { createClient } from '@supabase/supabase-js'
// Database types are defined in database.types.ts for reference but
// we use untyped client to avoid strict column-level type conflicts.
// Type safety is enforced via Zod schemas on the API layer.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[SAKHI] Supabase environment variables are not configured. ' +
    'Authentication and database features will not work. ' +
    'Copy .env.example to .env and fill in your Supabase project credentials.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
