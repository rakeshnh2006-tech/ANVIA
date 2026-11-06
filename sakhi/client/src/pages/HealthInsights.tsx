import React, { useEffect, useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { BarChart3, TrendingUp, CalendarDays, NotebookPen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { EmptyState, MedicalDisclaimer } from '../components/ui/States'
import { CardSkeleton } from '../components/ui/Skeleton'
import { Link } from 'react-router-dom'

interface SymptomEntry {
  id: string
  symptom_name: string
  severity: number
  recorded_at: string
}

interface CycleEntry {
  id: string
  period_start: string
  period_end: string | null
}

export default function HealthInsights() {
  const { user } = useAuth()
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([])
  const [cycles, setCycles] = useState<CycleEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('symptom_entries').select('id, symptom_name, severity, recorded_at')
        .eq('user_id', user.id)
        .gte('recorded_at', subDays(new Date(), 90).toISOString())
        .order('recorded_at', { ascending: true }),
      supabase.from('cycle_entries').select('id, period_start, period_end')
        .eq('user_id', user.id).order('period_start', { ascending: true }),
    ]).then(([symRes, cycRes]) => {
      if (symRes.error) console.error('[HealthInsights] symptoms query error:', symRes.error.message)
      if (cycRes.error) console.error('[HealthInsights] cycles query error:', cycRes.error.message)
      setSymptoms(symRes.data || [])
      setCycles(cycRes.data || [])
    }).catch(err => {
      console.error('[HealthInsights] unexpected error:', err)
    }).finally(() => {
      setLoading(false)
    })
  }, [user])

  // Build symptom trend data — daily average severity per symptom type
  const symptomNames = Array.from(new Set(symptoms.map(s => s.symptom_name)))
  const topSymptoms = symptomNames
    .map(name => ({
      name,
      entries: symptoms.filter(s => s.symptom_name === name),
      avg: symptoms.filter(s => s.symptom_name === name).reduce((sum, s) => sum + s.severity, 0) /
        symptoms.filter(s => s.symptom_name === name).length,
    }))
    .sort((a, b) => b.entries.length - a.entries.length)
    .slice(0, 5)

  // Build severity over time for top symptom
  const trendData = symptoms.reduce<Record<string, { date: string; severity: number; count: number }>>((acc, s) => {
    const date = s.recorded_at.split('T')[0]
    if (!acc[date]) acc[date] = { date, severity: 0, count: 0 }
    acc[date].severity += s.severity
    acc[date].count += 1
    return acc
  }, {})

  const trendChartData = Object.values(trendData).map(d => ({
    date: format(parseISO(d.date), 'MMM d'),
    avgSeverity: Math.round((d.severity / d.count) * 10) / 10,
    count: d.count,
  }))

  // Cycle lengths for chart
  const cycleLengthData = cycles.slice(0, -1).map((c, i) => {
    if (!cycles[i + 1]) return null
    const next = cycles[i + 1]
    const days = Math.round((new Date(next.period_start).getTime() - new Date(c.period_start).getTime()) / (1000 * 60 * 60 * 24))
    return { cycle: `Cycle ${i + 1}`, days }
  }).filter(Boolean) as { cycle: string; days: number }[]

  const hasData = symptoms.length > 0 || cycles.length > 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">Health Insights</h1>
        <p className="section-subtitle">Visual trends from your logged symptoms and cycles. Based on your personal data only.</p>
      </div>

      {loading ? (
        <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
      ) : !hasData ? (
        <EmptyState
          icon={<BarChart3 size={28} />}
          title="No data to display yet"
          description="Start logging symptoms and tracking your cycle to see insights here."
          action={
            <div className="flex gap-3">
              <Link to="/dashboard/journal" className="btn-primary text-xs">Log a symptom</Link>
              <Link to="/dashboard/cycles" className="btn-secondary text-xs">Track cycle</Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Symptom frequency bar chart */}
          {topSymptoms.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <NotebookPen size={16} className="text-lavender-600" />
                <h2 className="font-semibold text-sakhi-text text-sm">Most Frequent Symptoms (last 90 days)</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topSymptoms.map(s => ({ name: s.name, count: s.entries.length, avgSeverity: Math.round(s.avg * 10) / 10 }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) => [value, name === 'count' ? 'Occurrences' : 'Avg Severity']}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Occurrences" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Severity trend line chart */}
          {trendChartData.length > 1 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-lavender-600" />
                <h2 className="font-semibold text-sakhi-text text-sm">Average Daily Symptom Severity</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="avgSeverity" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} name="Avg severity" />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-sakhi-muted mt-2">
                This chart shows daily average severity from your symptom journal. Correlations are for personal awareness, not medical conclusions.
              </p>
            </div>
          )}

          {/* Cycle length chart */}
          {cycleLengthData.length >= 1 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={16} className="text-pink-500" />
                <h2 className="font-semibold text-sakhi-text text-sm">Cycle Length History</h2>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={cycleLengthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="cycle" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 50]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${v} days`, 'Cycle length']} />
                  <Bar dataKey="days" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-sakhi-muted mt-2">
                Cycle length = days between period start dates. A typical range is 21–35 days. Variation is common.
              </p>
            </div>
          )}

          {/* Summary table */}
          {topSymptoms.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-sakhi-text text-sm mb-3">Symptom Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-sakhi-border">
                      <th className="text-left py-2 text-sakhi-muted font-medium">Symptom</th>
                      <th className="text-right py-2 text-sakhi-muted font-medium">Occurrences</th>
                      <th className="text-right py-2 text-sakhi-muted font-medium">Avg Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSymptoms.map(s => (
                      <tr key={s.name} className="border-b border-sakhi-border last:border-0">
                        <td className="py-2 text-sakhi-text">{s.name}</td>
                        <td className="py-2 text-right text-sakhi-muted">{s.entries.length}</td>
                        <td className="py-2 text-right">
                          <span className={`badge text-xs ${s.avg >= 7 ? 'badge-red' : s.avg >= 4 ? 'badge-yellow' : 'badge-green'}`}>
                            {Math.round(s.avg * 10) / 10}/10
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-sakhi-muted mt-3">
                Data shown is from the last 90 days. Trends reflect your personal tracking and should not be interpreted as medical evidence.
              </p>
            </div>
          )}
        </div>
      )}

      <MedicalDisclaimer className="mt-8" />
    </div>
  )
}
