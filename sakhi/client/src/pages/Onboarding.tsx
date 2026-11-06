import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'

const onboardingSchema = z.object({
  display_name: z.string().max(50).optional(),
  age_range: z.string().optional(),
  wants_cycle_tracking: z.boolean().optional(),
  has_pcos_diagnosis: z.boolean().optional(),
  ai_consent: z.literal(true, { errorMap: () => ({ message: 'You must acknowledge this to continue' }) }),
})

type OnboardingForm = z.infer<typeof onboardingSchema>

const ageRanges = ['Under 18', '18–24', '25–34', '35–44', '45+', 'Prefer not to say']
const steps = ['Welcome', 'Your Profile', 'Preferences', 'Privacy']

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    // ai_consent starts unchecked (false). The Zod schema requires literal true on submit.
    defaultValues: { ai_consent: false as unknown as true },
  })

  const handleComplete = async (data: OnboardingForm) => {
    if (!user) return
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: data.display_name || null,
      age_range: data.age_range || null,
      wants_cycle_tracking: data.wants_cycle_tracking ?? null,
      has_pcos_diagnosis: data.has_pcos_diagnosis ?? null,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      toast('error', 'Could not save profile', error.message)
      return
    }

    // Record consent
    await supabase.from('consent_records').insert({
      user_id: user.id,
      consent_type: 'ai_processing',
      consent_given: data.ai_consent,
    })

    await refreshProfile()
    navigate('/dashboard')
  }

  const skipOnboarding = async () => {
    if (!user) return
    await supabase.from('profiles').upsert({
      id: user.id,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    // Record that AI consent was NOT given when the user skips onboarding
    await supabase.from('consent_records').insert({
      user_id: user.id,
      consent_type: 'ai_processing',
      consent_given: false,
    })
    await refreshProfile()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-sakhi-bg flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lavender-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-sakhi-text">SAKHI</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors
                ${i < step ? 'text-green-600' : i === step ? 'text-lavender-700' : 'text-sakhi-muted'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border
                  ${i < step ? 'bg-green-100 border-green-300 text-green-600' 
                  : i === step ? 'bg-lavender-100 border-lavender-400 text-lavender-700' 
                  : 'bg-white border-sakhi-border text-sakhi-muted'}`}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-sakhi-border" />}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit(handleComplete)}>
          <div className="card">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-3xl bg-lavender-100 flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="w-8 h-8 text-lavender-600" />
                </div>
                <h2 className="text-2xl font-bold text-sakhi-text mb-3">Welcome to SAKHI</h2>
                <p className="text-sakhi-muted mb-4">
                  Let's set up your profile so we can personalize your experience.
                  All questions are optional — you can skip this anytime.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6">
                  <p className="text-xs text-amber-700">
                    <strong>Important:</strong> SAKHI provides educational health information only.
                    It does not diagnose medical conditions. Always consult a healthcare professional for personal medical advice.
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Profile */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-sakhi-text">Your profile</h2>
                <p className="text-sm text-sakhi-muted">All fields are optional. You can update these anytime.</p>
                <div>
                  <label className="label">Display name <span className="text-sakhi-muted font-normal">(optional)</span></label>
                  <input
                    {...register('display_name')}
                    type="text"
                    placeholder="How should we address you?"
                    className="input-field"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="label">Age range <span className="text-sakhi-muted font-normal">(optional)</span></label>
                  <select {...register('age_range')} className="input-field">
                    <option value="">Prefer not to say</option>
                    {ageRanges.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Preferences */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-sakhi-text">Your health preferences</h2>
                <p className="text-sm text-sakhi-muted">
                  These help personalize SAKHI. You are never required to disclose medical history.
                </p>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-sakhi-border hover:bg-lavender-50 transition-colors">
                    <input {...register('wants_cycle_tracking')} type="checkbox" className="mt-0.5 accent-lavender-600" />
                    <div>
                      <p className="text-sm font-medium text-sakhi-text">I'd like to track my menstrual cycle</p>
                      <p className="text-xs text-sakhi-muted mt-0.5">Enable the cycle tracker feature</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-sakhi-border hover:bg-lavender-50 transition-colors">
                    <input {...register('has_pcos_diagnosis')} type="checkbox" className="mt-0.5 accent-lavender-600" />
                    <div>
                      <p className="text-sm font-medium text-sakhi-text">I have been diagnosed with PCOS <span className="font-normal text-sakhi-muted">(optional)</span></p>
                      <p className="text-xs text-sakhi-muted mt-0.5">This helps personalize PCOS educational content — completely optional</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Privacy consent */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-sakhi-text">Privacy & AI usage</h2>
                <p className="text-sm text-sakhi-muted">Please read and acknowledge before continuing.</p>
                <div className="bg-lavender-50 rounded-xl p-4 space-y-3 text-sm text-sakhi-muted">
                  <p>• When you use the symptom understanding feature, your description is sent to an external AI service for processing.</p>
                  <p>• We do not send your name or email to the AI service — only your symptom description.</p>
                  <p>• AI responses are educational and do not constitute medical advice or diagnosis.</p>
                  <p>• You can delete all your data at any time from your profile settings.</p>
                  <p>• Your health data is stored securely and is only accessible to you.</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    {...register('ai_consent')}
                    type="checkbox"
                    value="true"
                    onChange={e => {
                      // handled by react-hook-form
                    }}
                    className="mt-0.5 accent-lavender-600"
                  />
                  <p className="text-sm text-sakhi-text">
                    I understand that SAKHI provides educational information only and does not diagnose medical conditions.
                    I consent to my symptom descriptions being processed by an external AI service.
                  </p>
                </label>
                {errors.ai_consent && (
                  <p className="text-xs text-red-500">{errors.ai_consent.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-5">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="btn-ghost flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <button type="button" onClick={skipOnboarding} className="btn-ghost text-sm">
                Skip setup
              </button>
            )}

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="btn-primary flex items-center gap-1.5"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-1.5">
                {isSubmitting ? 'Setting up…' : <>Complete setup <Check className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
