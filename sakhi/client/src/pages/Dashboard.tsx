import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, addDays, differenceInDays, parseISO } from 'date-fns'
import {
  MessageCircleHeart, CalendarDays, NotebookPen, BarChart3,
  FileText, ArrowRight, Sparkles, TrendingUp, AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/States'

interface CycleEntry {
  id: string
  period_start: string
  period_end: string | null
}

interface SymptomEntry {
  id: string
  symptom_name: string
  severity: number
  recorded_at: string
}

function estimateNextPeriod(cycles: CycleEntry[]): string | null {
  if (cycles.length < 2) return null
  const sorted = [...cycles].sort((a, b) =>
    new Date(a.period_start).getTime() - new Date(b.period_start).getTime()
  )
  const lengths: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    lengths.push(differenceInDays(parseISO(sorted[i].period_start), parseISO(sorted[i - 1].period_start)))
  }
  const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
  const lastStart = parseISO(sorted[sorted.length - 1].period_start)
  const next = addDays(lastStart, avg)
  return format(next, 'MMM d, yyyy')
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [cycles, setCycles] = useState<CycleEntry[]>([])
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([])
  const [loading, setLoading] = useState(true)

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'there'
  const nextPeriod = estimateNextPeriod(cycles)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('cycle_entries').select('id, period_start, period_end')
        .eq('user_id', user.id).order('period_start', { ascending: false }).limit(6),
      supabase.from('symptom_entries').select('id, symptom_name, severity, recorded_at')
        .eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(5),
    ]).then(([cycleRes, symptomRes]) => {
      if (cycleRes.error) console.error('[Dashboard] cycles query error:', cycleRes.error.message)
      if (symptomRes.error) console.error('[Dashboard] symptoms query error:', symptomRes.error.message)
      setCycles(cycleRes.data || [])
      setSymptoms(symptomRes.data || [])
    }).catch(err => {
      console.error('[Dashboard] unexpected error:', err)
    }).finally(() => {
      setLoading(false)
    })
  }, [user])

  const quickActions = [
    { to: '/dashboard/symptoms', icon: MessageCircleHeart, label: 'Describe symptoms', color: 'bg-lavender-100 text-lavender-600' },
    { to: '/dashboard/cycles', icon: CalendarDays, label: 'Log period', color: 'bg-pink-100 text-pink-600' },
    { to: '/dashboard/journal', icon: NotebookPen, label: 'Add to journal', color: 'bg-purple-100 text-purple-600' },
    { to: '/dashboard/pcos', icon: Sparkles, label: 'Learn about PCOS', color: 'bg-indigo-100 text-indigo-600' },
  ]

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sakhi-text">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {displayName} 👋
        </h1>
        <p className="text-sakhi-muted text-sm mt-1">Here's a summary of your health tracking.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {quickActions.map(({ to, icon: Icon, label, color }) => (
          <Link
            key={to}
            to={to}
            className="card hover:shadow-card-hover transition-shadow flex flex-col items-center gap-2.5 py-5 text-center"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <span className="text-xs font-medium text-sakhi-text">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Next period estimate */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sakhi-text flex items-center gap-2">
              <CalendarDays size={16} className="text-pink-500" />
              Cycle Tracker
            </h2>
            <Link to="/dashboard/cycles" className="text-xs text-lavender-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? <CardSkeleton /> : cycles.length === 0 ? (
            <EmptyState
              title="No cycles logged yet"
              description="Start tracking your periods to see estimates here."
              action={<Link to="/dashboard/cycles" className="btn-primary text-xs">Log period</Link>}
            />
          ) : (
            <div>
              {nextPeriod && (
                <div className="bg-pink-50 rounded-xl p-4 mb-3">
                  <p className="text-xs text-pink-600 font-medium mb-0.5">Estimated next period</p>
                  <p className="text-lg font-bold text-pink-700">{nextPeriod}</p>
                  <p className="text-xs text-pink-400 mt-0.5">Based on your cycle history — estimates only</p>
                </div>
              )}
              <p className="text-xs text-sakhi-muted">{cycles.length} cycle{cycles.length !== 1 ? 's' : ''} recorded</p>
            </div>
          )}
        </div>

        {/* Recent symptoms */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sakhi-text flex items-center gap-2">
              <NotebookPen size={16} className="text-purple-500" />
              Recent Symptoms
            </h2>
            <Link to="/dashboard/journal" className="text-xs text-lavender-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? <CardSkeleton /> : symptoms.length === 0 ? (
            <EmptyState
              title="No symptoms logged"
              description="Use the symptom journal to track how you feel over time."
              action={<Link to="/dashboard/journal" className="btn-primary text-xs">Add symptom</Link>}
            />
          ) : (
            <div className="space-y-2">
              {symptoms.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-sakhi-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-sakhi-text">{s.symptom_name}</p>
                    <p className="text-xs text-sakhi-muted">{format(parseISO(s.recorded_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div className={`badge text-xs ${s.severity >= 7 ? 'badge-red' : s.severity >= 4 ? 'badge-yellow' : 'badge-green'}`}>
                    {s.severity}/10
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health report CTA */}
        <div className="card bg-gradient-to-br from-lavender-50 to-purple-50 border-lavender-200 md:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-lavender-200 flex items-center justify-center flex-shrink-0">
                <FileText size={22} className="text-lavender-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sakhi-text mb-1">Ready for your doctor's appointment?</h3>
                <p className="text-sm text-sakhi-muted">
                  Generate a structured health summary of your symptoms, cycles and journal entries to share with your healthcare provider.
                </p>
              </div>
            </div>
            <Link to="/dashboard/report" className="btn-primary flex-shrink-0 whitespace-nowrap">
              Generate report
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
