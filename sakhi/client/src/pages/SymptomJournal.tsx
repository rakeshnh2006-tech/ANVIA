import React, { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Edit2, Trash2, NotebookPen, Search, Filter } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { EmptyState, MedicalDisclaimer } from '../components/ui/States'
import { CardSkeleton } from '../components/ui/Skeleton'

interface SymptomEntry {
  id: string
  symptom_name: string
  severity: number
  duration: string | null
  description: string | null
  recorded_at: string
  cycle_day: number | null
}

const COMMON_SYMPTOMS = [
  'Acne', 'Fatigue', 'Bloating', 'Pelvic discomfort', 'Hair thinning',
  'Mood changes', 'Irregular bleeding', 'Headache', 'Nausea', 'Back pain',
  'Breast tenderness', 'Weight gain', 'Excess hair growth', 'Sleep issues',
]

const symptomSchema = z.object({
  symptom_name: z.string().min(1, 'Symptom name is required').max(100),
  severity: z.number().min(1).max(10),
  duration: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  recorded_at: z.string().min(1, 'Date is required'),
  cycle_day: z.number().int().min(1).max(40).nullable().optional(),
})

type SymptomForm = z.infer<typeof symptomSchema>

function SymptomModal({
  entry,
  onSave,
  onClose,
}: {
  entry?: SymptomEntry
  onSave: (data: SymptomForm) => Promise<void>
  onClose: () => void
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<SymptomForm>({
    resolver: zodResolver(symptomSchema),
    defaultValues: entry ? {
      symptom_name: entry.symptom_name,
      severity: entry.severity,
      duration: entry.duration || '',
      description: entry.description || '',
      recorded_at: entry.recorded_at.split('T')[0],
      cycle_day: entry.cycle_day ?? undefined,
    } : {
      severity: 5,
      recorded_at: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const severityVal = watch('severity')
  const symptomnameVal = watch('symptom_name')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-sakhi-text mb-4">
          {entry ? 'Edit symptom' : 'Log a symptom'}
        </h3>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="label">Symptom *</label>
            <input
              {...register('symptom_name')}
              type="text"
              placeholder="e.g., Fatigue, Acne, Bloating…"
              className="input-field"
              list="symptom-suggestions"
            />
            <datalist id="symptom-suggestions">
              {COMMON_SYMPTOMS.map(s => <option key={s} value={s} />)}
            </datalist>
            {errors.symptom_name && <p className="text-xs text-red-500 mt-1">{errors.symptom_name.message}</p>}
            {/* Quick pick */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_SYMPTOMS.slice(0, 8).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue('symptom_name', s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                    ${symptomnameVal === s
                      ? 'bg-lavender-100 border-lavender-400 text-lavender-700'
                      : 'border-sakhi-border text-sakhi-muted hover:border-lavender-300'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Severity: <strong>{severityVal}/10</strong></label>
            <input
              {...register('severity', { valueAsNumber: true })}
              type="range"
              min={1}
              max={10}
              className="w-full accent-lavender-600"
            />
            <div className="flex justify-between text-xs text-sakhi-muted mt-0.5">
              <span>Mild (1)</span>
              <span>Moderate (5)</span>
              <span>Severe (10)</span>
            </div>
          </div>

          <div>
            <label className="label">Date *</label>
            <input
              {...register('recorded_at')}
              type="date"
              className="input-field"
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div>
            <label className="label">Duration <span className="text-sakhi-muted font-normal">(optional)</span></label>
            <input
              {...register('duration')}
              type="text"
              placeholder="e.g., 2 hours, all day, 3 days"
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Notes <span className="text-sakhi-muted font-normal">(optional)</span></label>
            <textarea
              {...register('description')}
              className="input-field resize-none h-20"
              placeholder="Any additional notes…"
            />
          </div>

          <div>
            <label className="label">Cycle day <span className="text-sakhi-muted font-normal">(optional, 1–40)</span></label>
            <input
              {...register('cycle_day', { valueAsNumber: true })}
              type="number"
              min={1}
              max={40}
              placeholder="e.g., 5"
              className="input-field"
            />
            <p className="text-xs text-sakhi-muted mt-1">Which day of your current cycle did this symptom occur?</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Saving…' : 'Save symptom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const SEVERITY_COLORS: Record<number, string> = {}
function severityBadge(s: number) {
  if (s >= 8) return 'badge-red'
  if (s >= 5) return 'badge-yellow'
  return 'badge-green'
}

export default function SymptomJournal() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [entries, setEntries] = useState<SymptomEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState<SymptomEntry | undefined>()
  const [search, setSearch] = useState('')
  const [filterSym, setFilterSym] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => { loadEntries() }, [user])

  const loadEntries = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('symptom_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  const handleSave = async (data: SymptomForm) => {
    if (!user) return
    const payload = {
      symptom_name: data.symptom_name,
      severity: data.severity,
      duration: data.duration || null,
      description: data.description || null,
      recorded_at: data.recorded_at,
      cycle_day: data.cycle_day ?? null,
    }

    if (editEntry) {
      const { error } = await supabase.from('symptom_entries').update(payload).eq('id', editEntry.id).eq('user_id', user.id)
      if (error) { toast('error', 'Update failed'); return }
      toast('success', 'Symptom updated')
    } else {
      const { error } = await supabase.from('symptom_entries').insert({ ...payload, user_id: user.id })
      if (error) { toast('error', 'Save failed'); return }
      toast('success', 'Symptom logged')
    }

    setShowModal(false)
    setEditEntry(undefined)
    loadEntries()
  }

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!confirmDeleteId) return
    const { error } = await supabase.from('symptom_entries').delete().eq('id', confirmDeleteId).eq('user_id', user!.id)
    setConfirmDeleteId(null)
    if (error) { toast('error', 'Delete failed'); return }
    toast('success', 'Entry deleted')
    loadEntries()
  }

  // Unique symptom names for filter
  const uniqueSymptoms = Array.from(new Set(entries.map(e => e.symptom_name))).sort()

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.symptom_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = !filterSym || e.symptom_name === filterSym
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Symptom Journal</h1>
          <p className="section-subtitle">Record and track your symptoms over time.</p>
        </div>
        <button
          onClick={() => { setEditEntry(undefined); setShowModal(true) }}
          className="btn-primary flex items-center gap-2 flex-shrink-0"
        >
          <Plus size={16} /> Add symptom
        </button>
      </div>

      {/* Filters */}
      {entries.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3.5 text-sakhi-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search symptoms…"
              className="input-field pl-8 py-2.5"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-3.5 text-sakhi-muted" />
            <select
              value={filterSym}
              onChange={e => setFilterSym(e.target.value)}
              className="input-field pl-8 pr-8 py-2.5"
            >
              <option value="">All symptoms</option>
              {uniqueSymptoms.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<NotebookPen size={28} />}
          title="Your symptom journal is empty"
          description="Log symptoms to track how you feel over time and spot patterns."
          action={<button onClick={() => setShowModal(true)} className="btn-primary">Log first symptom</button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching symptoms" description="Try adjusting your search or filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <div key={entry.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${entry.severity >= 8 ? 'bg-red-100' : entry.severity >= 5 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    <NotebookPen size={16} className={entry.severity >= 8 ? 'text-red-600' : entry.severity >= 5 ? 'text-yellow-600' : 'text-green-600'} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sakhi-text text-sm">{entry.symptom_name}</p>
                      <span className={`badge text-xs ${severityBadge(entry.severity)}`}>{entry.severity}/10</span>
                    </div>
                    <p className="text-xs text-sakhi-muted mt-0.5">
                      {format(parseISO(entry.recorded_at), 'MMMM d, yyyy')}
                      {entry.duration && ` · ${entry.duration}`}
                    </p>
                    {entry.description && (
                      <p className="text-xs text-sakhi-muted mt-1">{entry.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setEditEntry(entry); setShowModal(true) }}
                    className="p-1.5 rounded-lg text-sakhi-muted hover:text-sakhi-text hover:bg-gray-100">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-lg text-sakhi-muted hover:text-red-500 hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SymptomModal
          entry={editEntry}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditEntry(undefined) }}
        />
      )}

      {/* Accessible delete confirmation dialog — replaces window.confirm() */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sj-confirm-delete-title"
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 id="sj-confirm-delete-title" className="text-base font-semibold text-sakhi-text mb-2">
              Delete symptom entry?
            </h3>
            <p className="text-sm text-sakhi-muted mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="btn-secondary flex-1"
                autoFocus
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
