import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, ArrowRight, Shield, Heart, BookOpen,
  CalendarDays, FileText, ChevronDown, CheckCircle
} from 'lucide-react'

const features = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'AI Symptom Understanding',
    desc: 'Describe symptoms naturally. Our AI explains possible health associations in clear, simple language.'
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: 'PCOS Learning Centre',
    desc: 'Evidence-based educational content to help you understand PCOS and related health topics.'
  },
  {
    icon: <CalendarDays className="w-5 h-5" />,
    title: 'Cycle Tracker',
    desc: 'Track your menstrual cycle, identify patterns and understand what your cycle tells you.'
  },
  {
    icon: <Heart className="w-5 h-5" />,
    title: 'Symptom Journal',
    desc: 'Record and track symptoms over time with severity ratings, notes and trend visualizations.'
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Doctor-Ready Report',
    desc: 'Generate a structured health summary to make the most of your time with a healthcare professional.'
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Describe how you feel',
    desc: 'Type your symptoms naturally — no medical jargon needed.'
  },
  {
    step: '02',
    title: 'Get educational insights',
    desc: 'Our AI identifies key symptom patterns and provides clear, evidence-based educational information.'
  },
  {
    step: '03',
    title: 'Track and understand',
    desc: 'Log symptoms, track your cycle, and build a picture of your health over time.'
  },
  {
    step: '04',
    title: 'Prepare for your doctor',
    desc: 'Generate a structured report to share with your healthcare provider at your next appointment.'
  },
]

const faqs = [
  {
    q: 'Does SAKHI diagnose medical conditions?',
    a: 'No. SAKHI is an educational platform. It provides health information and guidance for navigating care, but does not diagnose any medical condition including PCOS.'
  },
  {
    q: 'Is my health information private?',
    a: 'Yes. All your data is stored securely and is only accessible to you. We use Supabase Row Level Security to ensure your health records are never accessible to other users.'
  },
  {
    q: 'What should I do in an emergency?',
    a: 'Call 112 (India\'s emergency number) or go to your nearest emergency facility immediately. SAKHI is not for emergencies.'
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-sakhi-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-sakhi-text">{q}</span>
        <ChevronDown className={`w-4 h-4 text-sakhi-muted flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 pt-0 text-sm text-sakhi-muted border-t border-sakhi-border bg-gray-50">
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-sakhi-bg">
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-sakhi-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-lavender-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sakhi-text text-lg">SAKHI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-sakhi-muted hover:text-sakhi-text transition-colors">Features</a>
            <a href="#how-it-works" className="text-sakhi-muted hover:text-sakhi-text transition-colors">How it works</a>
            <a href="#pcos" className="text-sakhi-muted hover:text-sakhi-text transition-colors">PCOS Guide</a>
            <a href="#faq" className="text-sakhi-muted hover:text-sakhi-text transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="btn-ghost text-sm">Sign in</Link>
            <Link to="/auth?mode=signup" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-lavender-50/60 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-lavender-100 text-lavender-700 px-3.5 py-1.5 rounded-full text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Women's Health Platform
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-sakhi-text leading-tight mb-6">
            Understand Your Body.
            <br />
            <span className="text-gradient">Take Informed Steps.</span>
          </h1>
          <p className="text-lg text-sakhi-muted max-w-2xl mx-auto mb-8 leading-relaxed">
            SAKHI helps you describe your health symptoms in your own words,
            understand possible associations, track your cycle, and prepare for conversations
            with your healthcare provider.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?mode=signup" className="btn-primary inline-flex items-center gap-2 text-base px-6 py-3">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/auth?mode=signup#pcos" className="btn-secondary inline-flex items-center gap-2 text-base px-6 py-3">
              Explore PCOS Guide
            </Link>
          </div>

        </div>
      </section>

      {/* Disclaimer banner */}
      <section className="bg-amber-50 border-y border-amber-200 py-3 px-4">
        <p className="max-w-4xl mx-auto text-center text-xs text-amber-700">
          <strong>Important:</strong> SAKHI is an educational health information platform, not a medical diagnosis service.
          Always consult a qualified healthcare professional for personal medical advice.
        </p>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-sakhi-text mb-3">Everything you need to understand your health</h2>
            <p className="text-sakhi-muted max-w-xl mx-auto">
              SAKHI combines AI-powered symptom education and personal health tracking in one secure platform.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="card hover:shadow-card-hover transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-lavender-100 flex items-center justify-center text-lavender-600 mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-sakhi-text mb-1.5">{f.title}</h3>
                <p className="text-sm text-sakhi-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-lavender-50/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-sakhi-text mb-3">How SAKHI works</h2>
            <p className="text-sakhi-muted">Simple steps to better understanding your health.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender-500 to-purple-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold text-sakhi-text mb-2">{step.title}</h3>
                <p className="text-sm text-sakhi-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy and security */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card bg-gradient-to-br from-lavender-50 to-purple-50 border-lavender-200">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-3xl bg-white border border-lavender-200 flex items-center justify-center flex-shrink-0 shadow-card">
                <Shield className="w-10 h-10 text-lavender-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-sakhi-text mb-3">Your privacy is our priority</h2>
                <p className="text-sakhi-muted mb-4">
                  Health information is sensitive. SAKHI stores all data with end-to-end Row Level Security,
                  ensuring only you can access your health records. We never share your data with third parties
                  without your explicit consent.
                </p>
                <ul className="space-y-2">
                  {[
                    'Your data is private — only you can see it',
                    'Secure authentication via Supabase',
                    'Delete your data at any time',
                    'AI processing disclosed before use',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-sakhi-muted">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-lavender-50/40">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-sakhi-text mb-3">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(faq => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-sakhi-text mb-4">
            Start understanding your health today
          </h2>
          <p className="text-sakhi-muted mb-8">
            Free to use. No credit card required. Your health information, private and secure.
          </p>
          <Link to="/auth?mode=signup" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5">
            Create your free account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sakhi-border bg-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-lavender-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-sakhi-text">SAKHI</span>
              <span className="text-sakhi-muted text-sm">· Your Health. Your Understanding.</span>
            </div>
            <p className="text-xs text-sakhi-muted">
              Educational information only. Not a substitute for professional medical advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
