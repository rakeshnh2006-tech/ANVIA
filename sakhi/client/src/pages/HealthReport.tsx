import React, { useState, useRef } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { FileText, Download, Printer, Calendar, AlertTriangle } from 'lucide-react'
import jsPDF from 'jspdf'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { CardSkeleton } from '../components/ui/Skeleton'

interface ReportData {
  generated_at: string
  period: { from: string; to: string }
  symptom_entries: Array<{
    symptom_name: string
    severity: number
    duration: string | null
    description: string | null
    recorded_at: string
  }>
  cycle_entries: Array<{
    period_start: string
    period_end: string | null
    flow_intensity: string | null
    notes: string | null
  }>
  ai_conversations: Array<{
    original_input: string
    structured_response: Record<string, unknown> | null
    created_at: string
  }>
  disclaimer: string
}

const RANGE_OPTIONS = [
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 60 days', value: 60 },
  { label: 'Last 90 days', value: 90 },
  { label: 'Last 6 months', value: 180 },
]

const QUESTIONS_FOR_DOCTOR = [
  'What do these symptoms suggest, and what tests might help identify the cause?',
  'Could my symptoms be related to a hormonal condition such as PCOS?',
  'What should I track to bring to my next appointment?',
  'Are there any lifestyle changes that might help?',
  'When should I follow up or seek urgent care?',
]

export default function HealthReport() {
  const [rangeDays, setRangeDays] = useState(90)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const generateReport = async () => {
    setLoading(true)
    try {
      const toDate = format(new Date(), 'yyyy-MM-dd')
      const fromDate = format(subDays(new Date(), rangeDays), 'yyyy-MM-dd')
      const data = await api.report.generate(fromDate, toDate) as ReportData
      setReport(data)
    } catch (err) {
      toast('error', 'Failed to generate report', err instanceof Error ? err.message : '')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    if (!report) return
    try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 15
    const pageWidth = doc.internal.pageSize.getWidth()
    const lineWidth = pageWidth - margin * 2
    let y = 20

    const addLine = (text: string, size = 10, bold = false, color = '#1c1917') => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setTextColor(color)
      const lines = doc.splitTextToSize(text, lineWidth) as string[]
      lines.forEach((line: string) => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(line, margin, y)
        y += size * 0.5 + 1.5
      })
      y += 1
    }

    const addSection = (title: string) => {
      y += 3
      doc.setDrawColor('#8b5cf6')
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageWidth - margin, y)
      y += 4
      addLine(title, 11, true, '#4c1d95')
    }

    // Header
    addLine('SAKHI — Personal Health Summary', 14, true, '#4c1d95')
    addLine(`Generated: ${format(parseISO(report.generated_at.split('T')[0]), 'MMMM d, yyyy')}`, 9, false, '#57606a')
    addLine(`Period: ${format(parseISO(report.period.from), 'MMM d, yyyy')} — ${format(parseISO(report.period.to), 'MMM d, yyyy')}`, 9, false, '#57606a')
    if (profile?.display_name) addLine(`Patient: ${profile.display_name}`, 9, false, '#57606a')
    y += 4

    // Disclaimer
    doc.setFillColor('#fef3c7')
    doc.rect(margin, y, lineWidth, 10, 'F')
    y += 3
    addLine('IMPORTANT: This report contains user-reported information only. It is not a medical diagnosis.', 8, false, '#92400e')
    y += 4

    // Symptoms
    addSection('1. Symptom History')
    if (report.symptom_entries.length === 0) {
      addLine('No symptom entries in this period.', 9, false, '#57606a')
    } else {
      report.symptom_entries.forEach(s => {
        addLine(`${s.symptom_name}  —  Severity: ${s.severity}/10  —  ${format(parseISO(s.recorded_at.split('T')[0]), 'MMM d, yyyy')}${s.duration ? `  —  ${s.duration}` : ''}`, 9)
        if (s.description) addLine(`  Notes: ${s.description}`, 8, false, '#57606a')
      })
    }

    // Cycles
    addSection('2. Menstrual Cycle History')
    if (report.cycle_entries.length === 0) {
      addLine('No cycle entries in this period.', 9, false, '#57606a')
    } else {
      report.cycle_entries.forEach(c => {
        const endStr = c.period_end ? ` → ${format(parseISO(c.period_end), 'MMM d, yyyy')}` : ''
        addLine(`${format(parseISO(c.period_start), 'MMM d, yyyy')}${endStr}${c.flow_intensity ? `  —  Flow: ${c.flow_intensity}` : ''}`, 9)
        if (c.notes) addLine(`  Notes: ${c.notes}`, 8, false, '#57606a')
      })
    }

    // AI descriptions
    if (report.ai_conversations.length > 0) {
      addSection('3. Patient-Described Symptom History (AI Tool)')
      addLine('The following were entered by the patient using SAKHI\'s symptom tool. These are the patient\'s own words.', 8, false, '#57606a')
      y += 2
      report.ai_conversations.slice(0, 5).forEach(c => {
        addLine(`${format(parseISO(c.created_at.split('T')[0]), 'MMM d, yyyy')}: "${c.original_input}"`, 9)
      })
    }

    // Questions for doctor
    addSection('4. Suggested Questions for Your Doctor')
    const questions = [
      'What do these symptoms suggest, and what tests might help identify the cause?',
      'Could my symptoms be related to a hormonal condition such as PCOS?',
      'What lifestyle changes might help my symptoms?',
      'When should I follow up or seek urgent care?',
    ]
    questions.forEach(q => addLine(`• ${q}`, 9))

    // Footer
    y += 6
    addLine(report.disclaimer, 8, false, '#57606a')
    y += 4
    addLine('SAKHI — Educational Health Platform · Not a substitute for professional medical advice', 7, false, '#9ca3af')

    doc.save(`SAKHI-Health-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    toast('success', 'PDF downloaded')
    } catch (err) {
      toast('error', 'PDF generation failed', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">Doctor-Ready Health Report</h1>
        <p className="section-subtitle">
          Generate a structured health summary to share with your healthcare provider.
        </p>
      </div>

      {/* Generate controls */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1">
            <label className="label">Date range</label>
            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRangeDays(opt.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${rangeDays === opt.value
                      ? 'bg-lavender-600 text-white border-lavender-600'
                      : 'border-sakhi-border text-sakhi-muted hover:border-lavender-400'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={generateReport} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? (
              <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Generating…</>
            ) : (
              <><FileText size={16} /> Generate Report</>
            )}
          </button>
        </div>
      </div>

      {loading && <CardSkeleton />}

      {report && !loading && (
        <>
          {/* Action buttons */}
          <div className="flex gap-3 mb-5 print:hidden">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm">
              <Printer size={15} /> Print
            </button>
            <button onClick={handleDownloadPDF} className="btn-primary flex items-center gap-2 text-sm">
              <Download size={15} /> Download PDF
            </button>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3 print:block">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{report.disclaimer}</p>
          </div>

          {/* Report content */}
          <div ref={printRef} className="space-y-5">
            {/* Header */}
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-sakhi-text mb-1">Personal Health Summary</h2>
                  <p className="text-sm text-sakhi-muted">
                    Prepared by SAKHI · Generated: {format(parseISO(report.generated_at.split('T')[0]), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-sakhi-muted">
                    Period: {format(parseISO(report.period.from), 'MMM d, yyyy')} — {format(parseISO(report.period.to), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-sakhi-text">{profile?.display_name || user?.email}</p>
                  <p className="text-xs text-sakhi-muted">Patient self-reported</p>
                </div>
              </div>
            </div>

            {/* Symptoms */}
            <div className="card">
              <h3 className="font-semibold text-sakhi-text mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-lavender-100 text-lavender-700 text-xs flex items-center justify-center font-bold">1</span>
                Symptom History
              </h3>
              {report.symptom_entries.length === 0 ? (
                <p className="text-sm text-sakhi-muted">No symptom entries in this period.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-sakhi-border text-left">
                      <th className="py-2 text-sakhi-muted font-medium">Symptom</th>
                      <th className="py-2 text-sakhi-muted font-medium">Date</th>
                      <th className="py-2 text-sakhi-muted font-medium">Severity</th>
                      <th className="py-2 text-sakhi-muted font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.symptom_entries.map((s, i) => (
                      <tr key={i} className="border-b border-sakhi-border last:border-0">
                        <td className="py-2 text-sakhi-text font-medium">{s.symptom_name}</td>
                        <td className="py-2 text-sakhi-muted">{format(parseISO(s.recorded_at.split('T')[0]), 'MMM d, yyyy')}</td>
                        <td className="py-2">
                          <span className={`badge text-xs ${s.severity >= 7 ? 'badge-red' : s.severity >= 4 ? 'badge-yellow' : 'badge-green'}`}>
                            {s.severity}/10
                          </span>
                        </td>
                        <td className="py-2 text-sakhi-muted">{s.duration || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Cycles */}
            <div className="card">
              <h3 className="font-semibold text-sakhi-text mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs flex items-center justify-center font-bold">2</span>
                Menstrual Cycle History
              </h3>
              {report.cycle_entries.length === 0 ? (
                <p className="text-sm text-sakhi-muted">No cycle entries in this period.</p>
              ) : (
                <div className="space-y-2">
                  {report.cycle_entries.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-sakhi-border last:border-0">
                      <Calendar size={14} className="text-pink-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-sakhi-text font-medium">
                          {format(parseISO(c.period_start), 'MMM d, yyyy')}
                          {c.period_end && ` → ${format(parseISO(c.period_end), 'MMM d, yyyy')}`}
                        </p>
                        {c.flow_intensity && <p className="text-xs text-sakhi-muted">Flow: {c.flow_intensity}</p>}
                        {c.notes && <p className="text-xs text-sakhi-muted">{c.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Conversations summary */}
            {report.ai_conversations.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-sakhi-text mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">3</span>
                  AI Symptom Descriptions (User-Authored)
                </h3>
                <p className="text-xs text-sakhi-muted mb-3">
                  The following were entered by the patient into SAKHI's symptom understanding tool.
                  These are the patient's own words, not medical assessments.
                </p>
                <div className="space-y-2">
                  {report.ai_conversations.slice(0, 5).map((c, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-sakhi-muted mb-0.5">{format(parseISO(c.created_at.split('T')[0]), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-sakhi-text">"{c.original_input}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions for doctor */}
            <div className="card border-lavender-200 bg-lavender-50">
              <h3 className="font-semibold text-sakhi-text mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-lavender-200 text-lavender-700 text-xs flex items-center justify-center font-bold">4</span>
                Questions to Discuss with Your Doctor
              </h3>
              <ul className="space-y-2">
                {QUESTIONS_FOR_DOCTOR.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-lavender-800">
                    <span className="text-lavender-400 flex-shrink-0">·</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer disclaimer */}
            <div className="bg-gray-50 border border-sakhi-border rounded-xl p-4">
              <p className="text-xs text-sakhi-muted leading-relaxed">
                <strong className="text-sakhi-text">Important:</strong> This report contains user-reported health information compiled by SAKHI,
                an educational health platform. All information was self-reported by the patient.
                AI-generated explanations are educational only and do not represent medical diagnosis or clinical assessment.
                This report is intended to facilitate a conversation with a healthcare professional, not to replace one.
                Generated by SAKHI — {format(parseISO(report.generated_at.split('T')[0]), 'MMMM d, yyyy')}.
              </p>
            </div>
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="card bg-lavender-50/60 border-lavender-100 text-center py-12">
          <FileText className="w-10 h-10 text-lavender-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-sakhi-text mb-1">Your report will appear here</p>
          <p className="text-xs text-sakhi-muted">Select a date range and click Generate Report.</p>
        </div>
      )}
    </div>
  )
}
