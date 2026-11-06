export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          preferred_language: string | null
          age_range: string | null
          has_pcos_diagnosis: boolean | null
          wants_cycle_tracking: boolean | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          preferred_language?: string | null
          age_range?: string | null
          has_pcos_diagnosis?: boolean | null
          wants_cycle_tracking?: boolean | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          preferred_language?: string | null
          age_range?: string | null
          has_pcos_diagnosis?: boolean | null
          wants_cycle_tracking?: boolean | null
          onboarding_completed?: boolean
          updated_at?: string
        }
      }
      symptom_entries: {
        Row: {
          id: string
          user_id: string
          symptom_name: string
          severity: number
          duration: string | null
          description: string | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symptom_name: string
          severity: number
          duration?: string | null
          description?: string | null
          recorded_at?: string
          created_at?: string
        }
        Update: {
          symptom_name?: string
          severity?: number
          duration?: string | null
          description?: string | null
          recorded_at?: string
        }
      }
      cycle_entries: {
        Row: {
          id: string
          user_id: string
          period_start: string
          period_end: string | null
          flow_intensity: 'light' | 'moderate' | 'heavy' | 'spotting' | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period_start: string
          period_end?: string | null
          flow_intensity?: 'light' | 'moderate' | 'heavy' | 'spotting' | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          period_start?: string
          period_end?: string | null
          flow_intensity?: 'light' | 'moderate' | 'heavy' | 'spotting' | null
          notes?: string | null
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          original_input: string
          detected_language: string | null
          preferred_language: string | null
          structured_response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_input: string
          detected_language?: string | null
          preferred_language?: string | null
          structured_response?: Json | null
          created_at?: string
        }
        Update: {
          structured_response?: Json | null
        }
      }
      consent_records: {
        Row: {
          id: string
          user_id: string
          consent_type: string
          consent_given: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          consent_type: string
          consent_given: boolean
          created_at?: string
        }
        Update: {
          consent_given?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
