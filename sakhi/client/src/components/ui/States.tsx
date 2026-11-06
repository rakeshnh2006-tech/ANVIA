import React from 'react'
import { AlertTriangle, Phone, ExternalLink } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-lavender-50 flex items-center justify-center mb-4 text-lavender-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-sakhi-text mb-1">{title}</h3>
      <p className="text-sm text-sakhi-muted max-w-xs">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card border-red-200 bg-red-50 flex flex-col items-center py-10 text-center">
      <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
      <p className="text-sm text-red-700 font-medium mb-1">Something went wrong</p>
      <p className="text-xs text-red-500 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">
          Try again
        </button>
      )}
    </div>
  )
}

export function UrgentSafetyBanner({ symptoms }: { symptoms: string[] }) {
  return (
    <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-red-800 mb-1">⚠️ Seek Emergency Medical Care Now</h3>
          <p className="text-sm text-red-700 mb-3">
            Your description includes symptoms that need immediate in-person medical assessment.
            <strong> Do not wait for an AI response.</strong>
          </p>
          <div className="flex items-center gap-3 bg-red-100 rounded-xl p-3 mb-3">
            <Phone className="w-5 h-5 text-red-700 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800">Emergency Number: 112</p>
              <p className="text-xs text-red-600">India national emergency services</p>
            </div>
          </div>
          {symptoms.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-700 mb-1.5">Detected concerning symptoms:</p>
              <ul className="space-y-0.5">
                {symptoms.map((s, i) => (
                  <li key={i} className="text-xs text-red-600 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PromptCareBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 mb-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-yellow-800">Prompt Medical Assessment Recommended</p>
        <p className="text-sm text-yellow-700 mt-0.5">{message}</p>
      </div>
    </div>
  )
}

export function MedicalDisclaimer({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-gray-50 border border-sakhi-border p-4 ${className}`}>
      <p className="text-xs text-sakhi-muted leading-relaxed">
        <span className="font-semibold text-sakhi-text">Medical Disclaimer:</span> SAKHI provides
        educational health information only. It does not diagnose medical conditions, prescribe
        treatment, or replace professional medical advice. Always consult a qualified healthcare
        professional for personal medical concerns.
      </p>
    </div>
  )
}
