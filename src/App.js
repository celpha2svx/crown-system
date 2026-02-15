import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import ThemeToggle from './components/ThemeToggle'
import Dashboard from './components/Dashboard'
import PrayerTracker from './components/PrayerTracker'
import IntPAProjects from './components/IntPAProjects'
import IntPAProjectDetail from './components/IntPAProjectDetail'
import IntACProjects from './components/IntACProjects'
import IntACProjectDetail from './components/IntACProjectDetail'
import TruthAC from './components/TruthAC'
import ArtGallery from './components/ArtGallery'
import SportsLog from './components/SportsLog'

function AppContent() {
  const [session, setSession] = useState(null)
  const { isDark } = useTheme()
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Auth />
  }

  // Define all navigation items
  const navItems = [
    { path: '/', name: 'Home', icon: '🏠' },
    { path: '/daily', name: 'Daily', icon: '📅' },
    { path: '/int-pa', name: 'Projects', icon: '🔬' },
    { path: '/int-ac', name: 'Solvix', icon: '🚀' },
    { path: '/truth-ac', name: 'Library', icon: '📚' },
    { path: '/art', name: 'Art', icon: '🎨' },
    { path: '/sports', name: 'Sports', icon: '⚽' }
  ]

  // Filter out current page
  const visibleNavItems = navItems.filter(item => item.path !== location.pathname)

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text pb-20">
      <div className="max-w-md mx-auto p-4">
        {/* Only ThemeToggle in top bar */}
        <div className="flex justify-end items-center mb-6">
          <ThemeToggle />
        </div>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Dashboard session={session} />} />
          <Route path="/daily" element={<PrayerTracker session={session} />} />
          <Route path="/int-pa" element={<IntPAProjects session={session} />} />
          <Route path="/int-pa/:projectId" element={<IntPAProjectDetailWrapper session={session} />} />
          <Route path="/int-ac" element={<IntACProjects session={session} />} />
          <Route path="/int-ac/:projectId" element={<IntACProjectDetailWrapper session={session} />} />
          <Route path="/truth-ac" element={<TruthAC session={session} />} />
          <Route path="/art" element={<ArtGallery session={session} />} />
          <Route path="/sports" element={<SportsLog session={session} />} />
        </Routes>
      </div>

      {/* Bottom Navigation - Persistent */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border py-2">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {visibleNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center p-2 text-gray-600 dark:text-dark-text-muted hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

// Wrapper components for project details
function IntPAProjectDetailWrapper({ session }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  return (
    <IntPAProjectDetail 
      projectId={projectId} 
      session={session} 
      onBack={() => navigate('/int-pa')}
    />
  )
}

function IntACProjectDetailWrapper({ session }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  return (
    <IntACProjectDetail 
      projectId={projectId} 
      session={session} 
      onBack={() => navigate('/int-ac')}
    />
  )
}

function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { isDark } = useTheme()

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    })
    if (error) alert(error.message)
    else alert('Check your email for confirmation!')
    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    if (error) alert(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg p-4">
      <div className="max-w-md w-full bg-gray-50 dark:bg-dark-card rounded-xl shadow-lg p-6 border border-gray-200 dark:border-dark-border">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Crown System
          </h1>
          <ThemeToggle />
        </div>
        
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex gap-3">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 transition"
            >
              Sign In
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-gray-200 dark:bg-dark-border hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-dark-text py-3 rounded-lg font-medium disabled:opacity-50 transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  )
}
