import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, MessageCircleHeart, BookOpen, CalendarDays,
  NotebookPen, BarChart3, FileText, UserCircle, LogOut, Menu
} from 'lucide-react'
import AnviaLogo from '../components/ui/AnviaLogo'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import PageTransition from '../components/ui/PageTransition'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/symptoms', icon: MessageCircleHeart, label: 'Symptom Check' },
  { to: '/dashboard/pcos', icon: BookOpen, label: 'PCOS Guide' },
  { to: '/dashboard/cycles', icon: CalendarDays, label: 'Cycle Tracker' },
  { to: '/dashboard/journal', icon: NotebookPen, label: 'Symptom Journal' },
  { to: '/dashboard/insights', icon: BarChart3, label: 'Health Insights' },
  { to: '/dashboard/report', icon: FileText, label: 'Health Report' },
  { to: '/dashboard/profile', icon: UserCircle, label: 'Profile & Privacy' },
]

// SidebarContent is defined OUTSIDE DashboardLayout to give it a stable component identity.
// Defining it inside the parent would cause React to remount it on every render.
interface SidebarContentProps {
  displayName: string
  userEmail: string | undefined
  onSignOut: () => void
  onNavClick: () => void
}

function SidebarContent({ displayName, userEmail, onSignOut, onNavClick }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-sakhi-border">
        <Link to="/dashboard">
          <AnviaLogo size="sm" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
            onClick={onNavClick}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-sakhi-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center text-lavender-700 font-semibold text-sm">
            {displayName[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-sakhi-text truncate">{displayName}</p>
            <p className="text-xs text-sakhi-muted truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="nav-item w-full text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout() {
  const { signOut, user, profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    toast('success', 'Signed out successfully')
    navigate('/')
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'You'

  return (
    <div className="flex h-screen bg-sakhi-bg overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white border-r border-sakhi-border">
        <SidebarContent
          displayName={displayName}
          userEmail={user?.email}
          onSignOut={handleSignOut}
          onNavClick={() => {}}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-sakhi-border z-40 lg:hidden
                    transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent
          displayName={displayName}
          userEmail={user?.email}
          onSignOut={handleSignOut}
          onNavClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-sakhi-border flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <AnviaLogo size="sm" />
          <div className="w-8" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <PageTransition>
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                <Outlet />
              </div>
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
