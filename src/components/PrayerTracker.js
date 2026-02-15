import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { format } from 'date-fns'
import { canPrayerBeChecked, getNextPrayer, getPrayerTimes } from '../utils/PrayerTimes'
import HygieneTracker from './HygieneTracker'
import EnvironmentTracker from './EnvironmentTracker'
import ExerciseTracker from './ExerciseTracker'
import ReadingTracker from './ReadingTracker'
import LanguagesTracker from './LanguagesTracker'
import EveningReflection from './EveningReflection'

export default function PrayerTracker({ session }) {
  const [loading, setLoading] = useState(true)
  const [todayLog, setTodayLog] = useState(null)
  const [travelMode, setTravelMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [prayerTimes, setPrayerTimes] = useState({})
  const [nextPrayer, setNextPrayer] = useState(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  const prayers = [
    { id: 'fajr', name: 'Fajr', icon: '🌅' },
    { id: 'dhuhr', name: 'Dhuhr', icon: '☀️' },
    { id: 'asr', name: 'Asr', icon: '🌤️' },
    { id: 'maghrib', name: 'Maghrib', icon: '🌆' },
    { id: 'isha', name: 'Isha', icon: '🌙' }
  ]

  useEffect(() => {
    loadTodayLog()
    
    const times = getPrayerTimes(new Date())
    setPrayerTimes(times)
    setNextPrayer(getNextPrayer())
    
    const interval = setInterval(() => {
      setNextPrayer(getNextPrayer())
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  async function loadTodayLog() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setTodayLog(data)
        setTravelMode(data.travel_mode_active || false)
      } else {
        const { data: newLog, error: insertError } = await supabase
          .from('daily_logs')
          .insert([
            { 
              user_id: session.user.id, 
              date: today,
              travel_mode_active: false
            }
          ])
          .select()
          .single()

        if (insertError) throw insertError
        setTodayLog(newLog)
      }
    } catch (error) {
      console.error('Error loading today\'s log:', error)
    } finally {
      setLoading(false)
    }
  }

  async function togglePrayer(prayerId) {
    if (!todayLog) return
    
    if (!canPrayerBeChecked(prayerId) && !travelMode) {
      const times = getPrayerTimes(new Date())
      const prayerTime = times[prayerId]
      alert(`You can only check ${prayerId} between ${prayerTime.toLocaleTimeString()} and 2 hours after`)
      return
    }

    const field = `prayer_${prayerId}`
    const timeField = `prayer_${prayerId}_time`
    
    const newValue = !todayLog[field]
    const updates = {
      [field]: newValue,
      [timeField]: newValue ? new Date().toISOString() : null
    }

    try {
      setSaving(true)
      const { error } = await supabase
        .from('daily_logs')
        .update(updates)
        .eq('id', todayLog.id)

      if (error) throw error

      setTodayLog({ ...todayLog, ...updates })
    } catch (error) {
      console.error('Error updating prayer:', error)
    } finally {
      setSaving(false)
    }
  }

  async function toggleTravelMode() {
    const newValue = !travelMode
    setTravelMode(newValue)

    try {
      const { error } = await supabase
        .from('daily_logs')
        .update({ travel_mode_active: newValue })
        .eq('id', todayLog.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating travel mode:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 dark:text-dark-text-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Today's Prayers</h2>
        <div className="text-sm text-gray-600 dark:text-dark-text-muted">{today}</div>
      </div>

      {/* Next Prayer Indicator */}
      {nextPrayer && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Next prayer: <span className="font-bold capitalize">{nextPrayer.name}</span> at{' '}
            {nextPrayer.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}

      {/* Travel Mode Toggle */}
      <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border">
        <label className="flex items-center justify-between">
          <span className="font-medium text-gray-900 dark:text-dark-text">Travel Mode</span>
          <button
            onClick={toggleTravelMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              travelMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                travelMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
        <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">
          {travelMode 
            ? "Travel mode ON - streaks won't break" 
            : "Travel mode OFF - normal streak tracking"}
        </p>
      </div>

      {/* Prayer Grid */}
      <div className="grid gap-3">
        {prayers.map((prayer) => {
          const isDone = todayLog?.[`prayer_${prayer.id}`] || false
          const prayerTime = todayLog?.[`prayer_${prayer.id}_time`]
          
          return (
            <button
              key={prayer.id}
              onClick={() => togglePrayer(prayer.id)}
              disabled={saving}
              className={`w-full p-4 rounded-lg flex items-center justify-between transition-colors ${
                isDone 
                  ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500 dark:border-green-600' 
                  : 'bg-gray-50 dark:bg-dark-card border-2 border-transparent hover:bg-gray-100 dark:hover:bg-dark-border text-gray-900 dark:text-dark-text'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{prayer.icon}</span>
                <span className="font-medium text-lg">{prayer.name}</span>
                <span className="text-xs text-gray-500 dark:text-dark-text-muted ml-2">
                  {prayerTimes[prayer.id]?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {prayerTime && (
                  <span className="text-sm text-gray-600 dark:text-dark-text-muted">
                    {new Date(prayerTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {isDone ? (
                  <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-600 text-xl">○</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Hygiene Section */}
      <HygieneTracker 
        todayLog={todayLog}
        setTodayLog={setTodayLog}
        saving={saving}
        setSaving={setSaving}
      />

      {/* Environment Section */}
      <EnvironmentTracker
        todayLog={todayLog}
        setTodayLog={setTodayLog}
        saving={saving}
        setSaving={setSaving}
      />

      {/* Exercise Section */}
      <ExerciseTracker
        todayLog={todayLog}
        setTodayLog={setTodayLog}
        saving={saving}
        setSaving={setSaving}
      />

      {/* Reading Section */}
      <ReadingTracker
        todayLog={todayLog}
        setTodayLog={setTodayLog}
        saving={saving}
        setSaving={setSaving}
      />

      {/* Languages Section */}
      <LanguagesTracker
        todayLog={todayLog}
        setTodayLog={setTodayLog}
        saving={saving}
        setSaving={setSaving}
      />

      {/* Evening Reflection Button */}
      <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-gray-900 dark:text-dark-text">Evening Reflection</h3>
          {todayLog?.reflection_data && (
            <span className="text-xs text-green-600 dark:text-green-400">✓ Today's reflection done</span>
          )}
        </div>
        
        <p className="text-sm text-gray-600 dark:text-dark-text-muted mb-3">
          Close your day with awareness. Reflect on your prayers, challenges, truths, and gratitude.
        </p>
        
        <button
          onClick={() => document.getElementById('reflection-modal').showModal()}
          className={`w-full py-3 rounded-lg font-medium transition ${
            todayLog?.reflection_data
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-2 border-green-500 dark:border-green-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {todayLog?.reflection_data ? 'View Tonight\'s Reflection' : 'Begin Evening Reflection'}
        </button>
      </div>

      {/* Reflection Modal */}
      <dialog id="reflection-modal" className="p-0 bg-transparent">
        {todayLog && (
          <EveningReflection 
            todayLog={todayLog}
            setTodayLog={setTodayLog}
            onClose={() => document.getElementById('reflection-modal').close()}
          />
        )}
      </dialog>

      {/* Streak Preview */}
      <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border">
        <h3 className="font-medium text-gray-900 dark:text-dark-text mb-2">Current Streaks</h3>
        <div className="text-sm text-gray-600 dark:text-dark-text-muted">
          (Coming in Phase 2.5)
        </div>
      </div>
    </div>
  )
}