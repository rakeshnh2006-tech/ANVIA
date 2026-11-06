import React, { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Send, RotateCcw, Sparkles, Globe, ChevronDown, Clock, AlertTriangle, BookOpen, History
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { UrgentSafetyBanner, PromptCareBanner, MedicalDisclaimer } from '../components/ui/States'
import { CardSkeleton } from '../components/ui/Skeleton'
// AI response type (mirrors server schema — kept in sync manually)
interface AIResponse {
  original_language: string
  preferred_language: string
  symptoms_identified: string[]
  duration: string | null
  plain_language_explanation: string
  possible_associations: string[]
  pcos_education: string
  suggested_tracking: string[]
  care_urgency: 'routine' | 'prompt' | 'urgent'
  care_guidance: string
  missing_information: string[]
  disclaimer: string
}

const LANGUAGES = ['English', 'Kannada', 'Hindi', 'Tamil', 'Telugu', 'Malayalam']

const EXAMPLE_PROMPTS = [
  'My periods have been irregular for the last four months.',
  'I am experiencing acne and unusual facial hair growth.',
  'I feel very tired even after sleeping well.',
  'ನನಗೆ ಮೂರು ತಿಂಗಳಿಂದ ಸರಿಯಾಗಿ ಪಿರಿಯಡ್ಸ್ ಆಗುತ್ತಿಲ್ಲ.',
  'मुझे पिछले 3 महीनों से अनियमित पीरियड्स आ रहे हैं।',
  'I have irregular periods and hair fall.',
]

interface AnalysisResult {
  safety: { level: 'safe' | 'prompt' | 'urgent'; triggers: string[]; message: string }
  ai_response: AIResponse | null
  is_demo: boolean
}

interface ConversationEntry {
  id: string
  input: string
  result: AnalysisResult
  timestamp: Date
}

interface HistoryEntry {
  id: string
  original_input: string
  detected_language: string | null
  preferred_language: string | null
  created_at: string
}

export default function SymptomUnderstanding() {
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('English')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<ConversationEntry[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { profile } = useAuth()
  const { toast } = useToast()

  // Load conversation history from server on mount
  useEffect(() => {
    api.symptom.history().then((data) => {
      setHistory(data as HistoryEntry[])
    }).catch(() => {
      // History load failure is non-critical; silently ignore
    }).finally(() => {
      setHistoryLoading(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || trimmed.length < 3) return

    setLoading(true)
    try {
      const result = await api.symptom.analyze(trimmed, language) as AnalysisResult
      const entry: ConversationEntry = {
        id: Math.random().toString(36).slice(2),
        input: trimmed,
        result,
        timestamp: new Date(),
      }
      setConversations(prev => [entry, ...prev])
      setInput('')
    } catch (err) {
      toast('error', 'Analysis failed', err instanceof Error ? err.message : 'Please try again')
    } finally {
      setLoading(false)
    }
  }

  const handleExample = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">Tell Us How You're Feeling</h1>
        <p className="section-subtitle">
          Describe your symptoms naturally in any supported language.
          Our AI will provide educational health information.
        </p>
      </div>

      {/* Input form */}
      <div className="card mb-6">
        <form onSubmit={handleSubmit}>
          {/* Language selector */}
          <div className="relative mb-3">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 text-sm text-sakhi-muted hover:text-sakhi-text border border-sakhi-border rounded-xl px-3 py-1.5"
            >
              <Globe size={14} />
              {language}
              <ChevronDown size={14} className={`transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>
            {showLangMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-sakhi-border rounded-xl shadow-card-hover z-10 py-1 min-w-[140px]">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => { setLanguage(lang); setShowLangMenu(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-lavender-50 transition-colors
                      ${lang === language ? 'text-lavender-700 font-medium' : 'text-sakhi-text'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe your symptoms here… e.g., 'My periods have been irregular for three months and I feel unusually tired.'"
            className="input-field resize-none h-32 mb-3"
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInput('')}
                className="btn-ghost text-xs flex items-center gap-1.5"
                disabled={!input}
              >
                <RotateCcw size={12} /> Clear
              </button>
              <span className="text-xs text-sakhi-muted self-center">{input.length}/2000</span>
            </div>
            <button
              type="submit"
              disabled={loading || input.trim().length < 3}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <Send size={15} /> Understand symptoms
                </>
              )}
            </button>
          </div>
        </form>

        {/* Example prompts */}
        <div className="mt-5 pt-4 border-t border-sakhi-border">
          <p className="text-xs font-medium text-sakhi-muted mb-2.5">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.slice(0, 4).map(prompt => (
              <button
                key={prompt}
                onClick={() => handleExample(prompt)}
                className="text-xs border border-sakhi-border rounded-full px-3 py-1.5 text-sakhi-muted
                           hover:border-lavender-400 hover:text-lavender-700 hover:bg-lavender-50 transition-colors text-left"
              >
                {prompt.length > 50 ? prompt.slice(0, 50) + '…' : prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversations */}
      {conversations.length > 0 && (
        <div className="space-y-6">
          {conversations.map(entry => (
            <ConversationResult key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {conversations.length === 0 && (
        <div className="card bg-lavender-50/60 border-lavender-100 text-center py-10">
          <Sparkles className="w-8 h-8 text-lavender-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-sakhi-text mb-1">Your analysis will appear here</p>
          <p className="text-xs text-sakhi-muted">Describe your symptoms above and tap "Understand symptoms"</p>
        </div>
      )}

      {/* Past conversation history */}
      {(history.length > 0 || historyLoading) && (
        <div className="mt-8">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-2 text-sm text-sakhi-muted hover:text-sakhi-text transition-colors mb-3"
          >
            <History size={15} />
            {showHistory ? 'Hide' : 'Show'} past conversations ({history.length})
          </button>
          {showHistory && (
            <div className="card space-y-2">
              <h3 className="text-sm font-semibold text-sakhi-text mb-3">Previous Conversations</h3>
              {historyLoading ? (
                <CardSkeleton />
              ) : history.map(h => (
                <div
                  key={h.id}
                  onClick={() => setInput(h.original_input)}
                  className="flex items-start gap-3 py-2.5 border-b border-sakhi-border last:border-0 cursor-pointer hover:bg-lavender-50 rounded-lg px-2 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-sakhi-text truncate">{h.original_input}</p>
                    <p className="text-xs text-sakhi-muted mt-0.5">
                      {format(parseISO(h.created_at), 'MMM d, yyyy · h:mm a')}
                      {h.detected_language && h.detected_language !== 'English' && (
                        <span className="ml-2 badge-lavender">{h.detected_language}</span>
                      )}
                    </p>
                  </div>
                  <Clock size={13} className="text-sakhi-muted flex-shrink-0 mt-1" />
                </div>
              ))}
              {history.length === 0 && !historyLoading && (
                <p className="text-xs text-sakhi-muted text-center py-4">No previous conversations found.</p>
              )}
            </div>
          )}
        </div>
      )}

      <MedicalDisclaimer className="mt-8" />
    </div>
  )
}

function ConversationResult({ entry }: { entry: ConversationEntry }) {
  const { result } = entry
  const { safety, ai_response, is_demo } = result

  const urgencyColor: Record<string, string> = {
    urgent: 'badge-red',
    prompt: 'badge-yellow',
    routine: 'badge-green',
  }

  return (
    <div className="space-y-4">
      {/* User input */}
      <div className="flex justify-end">
        <div className="bg-lavender-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-2xl">
          <p className="text-sm">{entry.input}</p>
          <p className="text-xs text-lavender-200 mt-1">{format(entry.timestamp, 'h:mm a')}</p>
        </div>
      </div>

      {/* Safety banner — shown first, always */}
      {safety.level === 'urgent' && (
        <UrgentSafetyBanner symptoms={safety.triggers} />
      )}
      {safety.level === 'prompt' && (
        <PromptCareBanner message={safety.message} />
      )}

      {/* AI Response */}
      {ai_response && safety.level !== 'urgent' && (
        <div className="card space-y-5">
          {is_demo && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <p className="text-xs text-amber-700">
                <strong>Demo mode:</strong> This is a sample response, not live AI analysis.
                Configure AI_PROVIDER and AI_API_KEY for real analysis.
              </p>
            </div>
          )}

          {/* Language info */}
          {ai_response.original_language !== 'English' && (
            <div className="flex items-center gap-2 text-xs text-sakhi-muted">
              <Globe size={12} />
              Detected: <strong>{ai_response.original_language}</strong>
              · Responding in: <strong>{ai_response.preferred_language}</strong>
            </div>
          )}

          {/* Symptoms identified */}
          {ai_response.symptoms_identified.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-sakhi-text mb-2">Symptoms identified</h4>
              <div className="flex flex-wrap gap-2">
                {ai_response.symptoms_identified.map(s => (
                  <span key={s} className="badge-lavender text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div>
            <h4 className="text-sm font-semibold text-sakhi-text mb-2">What this may mean</h4>
            <p className="text-sm text-sakhi-muted leading-relaxed">{ai_response.plain_language_explanation}</p>
          </div>

          {/* Possible associations */}
          {ai_response.possible_associations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-sakhi-text mb-2">Possible health associations</h4>
              <ul className="space-y-1.5">
                {ai_response.possible_associations.map(a => (
                  <li key={a} className="flex items-start gap-2 text-sm text-sakhi-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-lavender-400 mt-1.5 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-sakhi-muted mt-2 italic">
                These are possible associations, not a diagnosis. Multiple explanations may apply.
              </p>
            </div>
          )}

          {/* PCOS education */}
          {ai_response.pcos_education && (
            <div className="bg-lavender-50 rounded-xl p-4 border border-lavender-100">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} className="text-lavender-600" />
                <h4 className="text-sm font-semibold text-lavender-800">PCOS Educational Note</h4>
              </div>
              <p className="text-sm text-lavender-700">{ai_response.pcos_education}</p>
            </div>
          )}

          {/* Urgency and guidance */}
          <div className="border-t border-sakhi-border pt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge ${urgencyColor[ai_response.care_urgency] || 'badge-green'}`}>
                {ai_response.care_urgency === 'routine' ? 'Routine care' :
                  ai_response.care_urgency === 'prompt' ? 'Prompt assessment' : 'Urgent assessment'}
              </span>
            </div>
            <p className="text-sm text-sakhi-muted">{ai_response.care_guidance}</p>
          </div>

          {/* Missing information */}
          {ai_response.missing_information.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-sakhi-text mb-2">To help us give you better information</h4>
              <ul className="space-y-1">
                {ai_response.missing_information.map(m => (
                  <li key={m} className="text-xs text-sakhi-muted flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested tracking */}
          {ai_response.suggested_tracking.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-sakhi-text mb-2">Useful to track</h4>
              <div className="flex flex-wrap gap-2">
                {ai_response.suggested_tracking.map(t => (
                  <span key={t} className="badge bg-gray-100 text-gray-600 text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-sakhi-muted border-t border-sakhi-border pt-3">
            {ai_response.disclaimer}
          </p>
        </div>
      )}
    </div>
  )
}
