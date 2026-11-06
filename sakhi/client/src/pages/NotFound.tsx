import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sakhi-bg flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-lavender-100 flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-lavender-400" />
      </div>
      <h1 className="text-4xl font-bold text-sakhi-text mb-2">404</h1>
      <p className="text-sakhi-muted mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>
    </div>
  )
}
