import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserCircle, Shield, Trash2, AlertTriangle, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { useNavigate } from 'react-router-dom'

const profileSchema = z.object({
  display_name: z.string().max(50).optional(),
  preferred_language: z.string().default('English'),
  age_range: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

const LANGUAGES = ['English', 'Kannada', 'Hindi', 'Tamil', 'Telugu', 'Malayalam']
const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45+', 'Prefer not to say']

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile?.display_name || '',
      preferred_language: profile?.preferred_language || 'English',
      age_range: profile?.age_range || '',
    },
  })

  const handleSave = async (data: ProfileForm) => {
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      display_name: data.display_name || null,
      preferred_language: data.preferred_language,
      age_range: data.age_range || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    if (error) {
      toast('error', 'Failed to save', error.message)
    } else {
      toast('success', 'Profile updated')
      await refreshProfile()
    }
  }

  const handleDeleteData = async (type: 'symptoms' | 'cycles' | 'conversations') => {
    if (!user) return
    const tableMap = {
      symptoms: 'symptom_entries',
      cycles: 'cycle_entries',
      conversations: 'ai_conversations',
    }
    const { error } = await supabase.from(tableMap[type]).delete().eq('user_id', user.id)
    if (error) {
      toast('error', 'Deletion failed', error.message)
    } else {
      toast('success', `${type.charAt(0).toUpperCase() + type.slice(1)} data deleted`)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    try {
      if (user) {
        const results = await Promise.all([
          supabase.from('symptom_entries').delete().eq('user_id', user.id),
          supabase.from('cycle_entries').delete().eq('user_id', user.id),
          supabase.from('ai_conversations').delete().eq('user_id', user.id),
          supabase.from('consent_records').delete().eq('user_id', user.id),
          supabase.from('profiles').delete().eq('id', user.id),
        ])
        const failed = results.filter(r => r.error)
        if (failed.length > 0) {
          const messages = failed.map(r => r.error?.message).filter(Boolean).join('; ')
          toast('error', 'Partial deletion error', messages)
          setDeleting(false)
          return
        }
      }
      await signOut()
      toast('info', 'Account data deleted', 'Your account has been deactivated.')
      navigate('/')
    } catch (err) {
      toast('error', 'Deletion failed', err instanceof Error ? err.message : 'Unknown error')
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">Profile & Privacy</h1>
        <p className="section-subtitle">Manage your profile information and control your health data.</p>
      </div>

      <div className="space-y-5">
        {/* Profile form */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-lavender-100 flex items-center justify-center">
              <UserCircle size={20} className="text-lavender-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sakhi-text">Profile Information</h2>
              <p className="text-xs text-sakhi-muted">All fields are optional</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" value={user?.email || ''} disabled className="input-field bg-gray-50 text-sakhi-muted cursor-not-allowed" />
              <p className="text-xs text-sakhi-muted mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <label className="label">Display name</label>
              <input {...register('display_name')} type="text" className="input-field" placeholder="How should we address you?" maxLength={50} />
            </div>
            <div>
              <label className="label">Preferred language</label>
              <select {...register('preferred_language')} className="input-field">
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Age range</label>
              <select {...register('age_range')} className="input-field">
                <option value="">Prefer not to say</option>
                {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
              <Save size={15} /> {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Privacy & Data */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Shield size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sakhi-text">Privacy & Data Control</h2>
              <p className="text-xs text-sakhi-muted">Delete specific data or your entire account</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { type: 'symptoms', label: 'Delete all symptom journal entries' },
              { type: 'cycles', label: 'Delete all cycle tracking data' },
              { type: 'conversations', label: 'Delete all AI conversation history' },
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center justify-between p-3 rounded-xl border border-sakhi-border">
                <p className="text-sm text-sakhi-text">{label}</p>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete all ${type} data? This cannot be undone.`)) {
                      handleDeleteData(type as 'symptoms' | 'cycles' | 'conversations')
                    }
                  }}
                  className="btn-ghost text-red-500 hover:bg-red-50 text-xs"
                >
                  <Trash2 size={13} className="mr-1" /> Delete
                </button>
              </div>
            ))}
          </div>

          {/* Delete account */}
          <div className="border border-red-200 rounded-xl p-4 bg-red-50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="text-sm font-semibold text-red-700">Delete Account</h3>
            </div>
            <p className="text-xs text-red-600 mb-3">
              This will permanently delete all your data and deactivate your account. This action cannot be undone.
            </p>
            <div className="space-y-2">
              <label className="text-xs text-red-600 font-medium">Type DELETE to confirm:</label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE"
                className="input-field border-red-200 focus:ring-red-400 text-sm"
              />
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 text-white text-sm font-medium
                           disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Permanently delete my account'}
              </button>
            </div>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="card bg-lavender-50 border-lavender-200">
          <h3 className="text-sm font-semibold text-lavender-800 mb-2">Your privacy</h3>
          <ul className="space-y-1.5 text-xs text-lavender-700">
            <li>· Your health data is stored securely and only accessible to you</li>
            <li>· Row Level Security ensures no other user can access your records</li>
            <li>· Symptom descriptions are sent to an external AI service when you use the symptom tool</li>
            <li>· We never share your identifiable information with third parties</li>
            <li>· You can delete all your data at any time</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
