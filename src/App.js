import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import ThemeToggle from './components/ThemeToggle'
import PrayerTracker from './components/PrayerTracker'
import IntPAProjects from './components/IntPAProjects'
import IntPAProjectDetail from './components/IntPAProjectDetail'
import IntACProjects from './components/IntACProjects'
import IntACProjectDetail from './components/IntACProjectDetail'
import TruthAC from './components/TRUTHAC'
import ArtGallery from './components/ArtGallery'
import SportsLog from './components/SportsLog'
import Dashboard from './components/Dashboard'

function AppContent() {
  const [session, setSession] = useState(null)
  const { isDark } = useTheme()

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

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text">
      <div className="max-w-md mx-auto p-4">
        {/* Header with Navigation */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Crown System
          </h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-600 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { to: "/", label: "Home", emoji: "🏠" },
            { to: "/daily", label: "Daily", emoji: "📅" },        
            { to: "/int-pa", label: "INT_PA", emoji: "🔬" },
            { to: "/int-ac", label: "Solvix", emoji: "🚀" },
            { to: "/truth-ac", label: "Truth", emoji: "📚" },
            { to: "/art", label: "Art", emoji: "🎨" },
            { to: "/sports", label: "Sports", emoji: "⚽" }
          ].map(tab => (
            <Link
              key={tab.to}
              to={tab.to}
              className="px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap
                bg-gray-100 dark:bg-dark-card 
                text-gray-700 dark:text-dark-text-muted
                hover:bg-gray-200 dark:hover:bg-dark-border
                transition-all duration-200"
            >
              <span className="mr-1">{tab.emoji}</span>
              {tab.label}
            </Link>
          ))}
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