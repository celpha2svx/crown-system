import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { getPrayerTimes } from '../utils/PrayerTimes'

export default function HygieneTracker({ todayLog, setTodayLog, saving, setSaving }) {
  const [windows, setWindows] = useState({
    morning: { canCheck: false, message: '', timeWindow: '' },
    evening: { canCheck: false, message: '', timeWindow: '' }
  })

  useEffect(() => {
    const checkTimeWindows = () => {
      const now = new Date()
      const prayerTimes = getPrayerTimes(now)
      
      const morningStart = prayerTimes.fajr
      const morningEnd = new Date(now)
      morningEnd.setHours(11, 59, 0, 0)
      
      const eveningStart = prayerTimes.maghrib
      const eveningEnd = new Date(prayerTimes.isha.getTime() + (2 * 60 * 60 * 1000))
      
      setWindows({
        morning: {
          canCheck: now >= morningStart && now <= morningEnd,
          message: now < morningStart ? `Opens at ${morningStart.toLocaleTimeString()}` :
                   now > morningEnd ? 'Morning window closed (was open until 12pm)' : '',
          timeWindow: `🌅 ${morningStart.toLocaleTimeString()} - 12:00 PM`
        },
        evening: {
          canCheck: now >= eveningStart && now <= eveningEnd,
          message: now < eveningStart ? `Opens at ${eveningStart.toLocaleTimeString()}` :
                   now > eveningEnd ? 'Evening window closed' : '',
          timeWindow: `🌙 ${eveningStart.toLocaleTimeString()} - ${eveningEnd.toLocaleTimeString()}`
        }
      })
    }

    checkTimeWindows()
    const interval = setInterval(checkTimeWindows, 60000)
    return () => clearInterval(interval)
  }, [])

  const toggleHygiene = async (type) => {
    if (!windows[type].canCheck && !todayLog?.travel_mode_active) {
      alert(windows[type].message || `Cannot check ${type} hygiene now`)
      return
    }

    if (todayLog?.[`hygiene_${type}`]) {
      if (!window.confirm(`Mark ${type} hygiene as NOT done?`)) {
        return
      }
    }

    const field = `hygiene_${type}`
    const timeField = `hygiene_${type}_time`
    
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
      console.error('Error updating hygiene:', error)
    } finally {
      setSaving(false)
    }
  }

  const getButtonStyle = (type) => {
    const isDone = todayLog?.[`hygiene_${type}`]
    const canCheck = windows[type].canCheck || todayLog?.travel_mode_active
    
    if (isDone) {
      return 'bg-green-100 dark:bg-green-900 border-2 border-green-500 dark:border-green-600 text-gray-900 dark:text-dark-text'
    }
    if (!canCheck) {
      return 'bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-400'
    }
    return 'bg-white dark:bg-dark-card border-2 border-transparent hover:bg-gray-50 dark:hover:bg-dark-border text-gray-900 dark:text-dark-text'
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900 dark:text-dark-text">Daily Hygiene</h3>
        <span className="text-xs text-gray-500 dark:text-dark-text-muted">Time-restricted ✓</span>
      </div>
      
      {/* Morning Hygiene */}
      <div className="space-y-1">
        <button
          onClick={() => toggleHygiene('morning')}
          disabled={saving || (!windows.morning.canCheck && !todayLog?.travel_mode_active)}
          className={`w-full p-3 rounded-lg flex items-center justify-between ${getButtonStyle('morning')}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🌅</span>
            <div className="text-left">
              <span>Morning Hygiene</span>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted">{windows.morning.timeWindow}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {todayLog?.hygiene_morning_time && (
              <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                {new Date(todayLog.hygiene_morning_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {todayLog?.hygiene_morning ? (
              <span className="text-green-600 dark:text-green-400">✓</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-600">○</span>
            )}
          </div>
        </button>
        {!windows.morning.canCheck && !todayLog?.travel_mode_active && windows.morning.message && (
          <p className="text-xs text-amber-600 dark:text-amber-400 ml-2">{windows.morning.message}</p>
        )}
      </div>

      {/* Evening Hygiene */}
      <div className="space-y-1">
        <button
          onClick={() => toggleHygiene('evening')}
          disabled={saving || (!windows.evening.canCheck && !todayLog?.travel_mode_active)}
          className={`w-full p-3 rounded-lg flex items-center justify-between ${getButtonStyle('evening')}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🌙</span>
            <div className="text-left">
              <span>Evening Hygiene (shower)</span>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted">{windows.evening.timeWindow}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {todayLog?.hygiene_evening_time && (
              <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                {new Date(todayLog.hygiene_evening_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {todayLog?.hygiene_evening ? (
              <span className="text-green-600 dark:text-green-400">✓</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-600">○</span>
            )}
          </div>
        </button>
        {!windows.evening.canCheck && !todayLog?.travel_mode_active && windows.evening.message && (
          <p className="text-xs text-amber-600 dark:text-amber-400 ml-2">{windows.evening.message}</p>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-2">
        Morning: brush teeth, wash face • Evening: shower, brush teeth
      </p>
    </div>
  )
}