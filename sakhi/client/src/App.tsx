import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Pages
import Landing from './pages/Landing'
import AuthPage from './pages/Auth'
import Onboarding from './pages/Onboarding'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import SymptomUnderstanding from './pages/SymptomUnderstanding'
import PCOSLearning from './pages/PCOSLearning'
import CycleTracker from './pages/CycleTracker'
import SymptomJournal from './pages/SymptomJournal'
import HealthInsights from './pages/HealthInsights'
import HealthReport from './pages/HealthReport'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, profile } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/auth" replace />
  // profile === null means the profile row hasn't loaded yet OR the user is new.
  // Only redirect to onboarding once profile is confirmed loaded (non-null) and
  // onboarding_completed is explicitly false — never skip on null.
  if (profile !== null && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (session) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-sakhi-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-lavender-200 border-t-sakhi-primary animate-spin mx-auto mb-4" />
        <p className="text-sakhi-muted text-sm">Loading SAKHI…</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="symptoms" element={<SymptomUnderstanding />} />
        <Route path="pcos" element={<PCOSLearning />} />
        <Route path="cycles" element={<CycleTracker />} />
        <Route path="journal" element={<SymptomJournal />} />
        <Route path="insights" element={<HealthInsights />} />
        <Route path="report" element={<HealthReport />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
