import React, { useState, useEffect } from 'react'
import { format, parseISO, differenceInDays, addDays, isSameDay, isWithinInterval } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Plus, Edit2, Trash2, CalendarDays, List } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { EmptyState, MedicalDisclaimer } from '../components/ui/States'
import { CardSkeleton } from '../components/ui/Skeleton'

interface CycleEntry {
  id: string
  period_start: string
  period_end: string | null
  flow_intensity: 'spotting' | 'light' | 'moderate' | 'heavy' | null
  notes: string | null
}

const cycleSchema = z.object({
  period_start: z.string().min(1, 'Start date required'),
  period_end: z.string().optional(),
  flow_intensity: z.enum(['spotting', 'light', 'moderate', 'heavy']).optional(),
  notes: z.string().max(500).optional(),
}).refine(data => {
  if (data.period_end && data.period_start) {
    return new Date(data.period_end) >= new Date(data.period_start)
  }
  return true
}, { message: 'End date must be on or after start date', path: ['period_end'] })

type CycleForm = z.infer<typeof cycleSchema>

const FLOW_COLORS: Record<string, string> = {
  spotting: 'bg-pink-100 text-pink-600',
  light: 'bg-red-100 text-red-500',
  moderate: 'bg-red-200 text-red-600',
  heavy: 'bg-red-300 text-red-700',
}

function CycleEntryModal({
  entry,
  onSave,
  onClose,
}: {
  entry?: CycleEntry
  onSave: (data: CycleForm) => Promise<void>
  onClose: () => void
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CycleForm>({
    resolver: zodResolver(cycleSchema),
    defaultValues: entry ? {
      period_start: entry.period_start,
      period_end: entry.period_end || '',
      flow_intensity: entry.flow_intensity || undefined,
      notes: entry.notes || '',
    } : {},
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-sakhi-text mb-4">
          {entry ? 'Edit cycle entry' : 'Log a period'}
        </h3>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="label">Period start date *</label>
            <input {...register('period_start')} type="date" className="input-field" max={format(new Date(), 'yyyy-MM-dd')} />
            {errors.period_start && <p className="text-xs text-red-500 mt-1">{errors.period_start.message}</p>}
          </div>
          <div>
            <label className="label">Period end date <span className="text-sakhi-muted font-normal">(optional)</span></label>
            <input {...register('period_end')} type="date" className="input-field" max={format(new Date(), 'yyyy-MM-dd')} />
            {errors.period_end && <p className="text-xs text-red-500 mt-1">{errors.period_end.message}</p>}
          </div>
          <div>
            <label className="label">Flow intensity <span className="text-sakhi-muted font-normal">(optional)</span></label>
            <select {...register('flow_intensity')} className="input-field">
              <option value="">Not specified</option>
              <option value="spotting">Spotting</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
          <div>
            <label className="label">Notes <span className="text-sakhi-muted font-normal">(optional)</span></label>
            <textarea {...register('notes')} className="input-field resize-none h-20" placeholder="Any notes about this cycle…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CycleTracker() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [entries, setEntries] = useState<CycleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState<CycleEntry | undefined>()
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadEntries()
  }, [user])

  const loadEntries = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('cycle_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('period_start', { ascending: false })

    if (error) {
      toast('error', 'Failed to load cycles')
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }

  const handleSave = async (data: CycleForm) => {
    if (!user) return
    const payload = {
      period_start: data.period_start,
      period_end: data.period_end || null,
      flow_intensity: data.flow_intensity || null,
      notes: data.notes || null,
    }

    if (editEntry) {
      const { error } = await supabase.from('cycle_entries').update(payload).eq('id', editEntry.id).eq('user_id', user.id)
      if (error) { toast('error', 'Failed to update'); return }
      toast('success', 'Cycle entry updated')
    } else {
      const { error } = await supabase.from('cycle_entries').insert({ ...payload, user_id: user.id })
      if (error) { toast('error', 'Failed to save'); return }
      toast('success', 'Period logged')
    }

    setShowModal(false)
    setEditEntry(undefined)
    loadEntries()
  }

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!confirmDeleteId) return
    const { error } = await supabase.from('cycle_entries').delete().eq('id', confirmDeleteId).eq('user_id', user!.id)
    setConfirmDeleteId(null)
    if (error) { toast('error', 'Failed to delete'); return }
    toast('success', 'Entry deleted')
    loadEntries()
  }

  // Calculate cycle stats
  const sorted = [...entries].sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime())
  const cycleLengths: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    cycleLengths.push(differenceInDays(parseISO(sorted[i].period_start), parseISO(sorted[i - 1].period_start)))
  }
  const avgLength = cycleLengths.length > 0 ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : null

  const lastEntry = sorted[sorted.length - 1]
  const nextEstimate = lastEntry && avgLength
    ? format(addDays(parseISO(lastEntry.period_start), avgLength), 'MMM d, yyyy')
    : null

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Cycle Tracker</h1>
          <p className="section-subtitle">Track your menstrual cycle history. All dates are estimates.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
                ${viewMode === 'list' ? 'bg-white shadow-sm text-sakhi-text' : 'text-sakhi-muted hover:text-sakhi-text'}`}
            >
              <List size={13} /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
                ${viewMode === 'calendar' ? 'bg-white shadow-sm text-sakhi-text' : 'text-sakhi-muted hover:text-sakhi-text'}`}
            >
              <CalendarDays size={13} /> Calendar
            </button>
          </div>
          <button
            onClick={() => { setEditEntry(undefined); setShowModal(true) }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Log period
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && entries.length >= 2 && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="card text-center py-5">
            <p className="text-2xl font-bold text-sakhi-text">{entries.length}</p>
            <p className="text-xs text-sakhi-muted mt-1">Cycles recorded</p>
          </div>
          {avgLength && (
            <div className="card text-center py-5">
              <p className="text-2xl font-bold text-sakhi-text">{avgLength}</p>
              <p className="text-xs text-sakhi-muted mt-1">Avg cycle length (days)</p>
            </div>
          )}
          {nextEstimate && (
            <div className="card text-center py-5 bg-pink-50 border-pink-200">
              <p className="text-lg font-bold text-pink-700">{nextEstimate}</p>
              <p className="text-xs text-pink-500 mt-1">Estimated next period (estimate only)</p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={28} />}
          title="No cycles logged yet"
          description="Start tracking your period to see cycle patterns, estimates and history."
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Log your first period
            </button>
          }
        />
      ) : viewMode === 'calendar' ? (
        <CycleCalendarView entries={entries} />
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const duration = entry.period_end
              ? differenceInDays(parseISO(entry.period_end), parseISO(entry.period_start)) + 1
              : null

            return (
              <div key={entry.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={18} className="text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sakhi-text text-sm">
                        {format(parseISO(entry.period_start), 'MMMM d, yyyy')}
                        {entry.period_end && ` → ${format(parseISO(entry.period_end), 'MMM d')}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {duration && (
                          <span className="text-xs text-sakhi-muted">{duration} day{duration !== 1 ? 's' : ''}</span>
                        )}
                        {entry.flow_intensity && (
                          <span className={`badge text-xs ${FLOW_COLORS[entry.flow_intensity] || ''}`}>
                            {entry.flow_intensity}
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-sakhi-muted mt-1.5">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setEditEntry(entry); setShowModal(true) }}
                      className="p-1.5 rounded-lg text-sakhi-muted hover:text-sakhi-text hover:bg-gray-100"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-lg text-sakhi-muted hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-sakhi-muted mt-6 text-center">
        Period predictions are estimates based on your recorded cycle history. They are not medical facts.
        Cycles vary naturally. This tracker does not make fertility or ovulation guarantees.
      </p>

      {showModal && (
        <CycleEntryModal
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
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 id="confirm-delete-title" className="text-base font-semibold text-sakhi-text mb-2">
              Delete cycle entry?
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

function CycleCalendarView({ entries }: { entries: CycleEntry[] }) {
  // Build sets of period days for highlighting
  const periodDays: Date[] = []
  const startDays: Date[] = []

  entries.forEach(entry => {
    const start = parseISO(entry.period_start)
    startDays.push(start)
    periodDays.push(start)
    if (entry.period_end) {
      const end = parseISO(entry.period_end)
      let cursor = new Date(start)
      while (cursor <= end) {
        periodDays.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
    }
  })

  const modifiers = {
    periodDay: periodDays,
    periodStart: startDays,
  }

  const modifiersStyles = {
    periodDay: {
      backgroundColor: '#fce7f3',
      color: '#be185d',
      borderRadius: '4px',
    },
    periodStart: {
      backgroundColor: '#f9a8d4',
      color: '#9d174d',
      fontWeight: '700',
      borderRadius: '6px',
    },
  }

  return (
    <div className="card">
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-sakhi-muted">
          <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: '#f9a8d4' }} />
          Period start
        </div>
        <div className="flex items-center gap-2 text-xs text-sakhi-muted">
          <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: '#fce7f3' }} />
          Period days
        </div>
      </div>
      {/* Omit `mode` entirely (DayPicker v10 uncontrolled = no selection UI / no checkmarks).
          Highlighting is handled entirely through modifiers + modifiersStyles. */}
      <DayPicker
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        showOutsideDays
        className="mx-auto"
        styles={{
          day: { cursor: 'default' },
        }}
      />
      <p className="text-xs text-sakhi-muted mt-3 text-center">
        Highlighted days show your recorded period dates. Estimates are not shown on the calendar.
      </p>
    </div>
  )
}

