import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ExerciseTracker({ todayLog, setTodayLog, saving, setSaving }) {
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('')
  const [duration, setDuration] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const exerciseTypes = [
    'Run', 'Gym', 'Home Workout', 'Football', 'Basketball', 
    'Swimming', 'Walking', 'Cycling', 'Other'
  ]

  const toggleExercise = async () => {
    const newValue = !todayLog?.exercise_done
    
    if (newValue) {
      setShowForm(true)
    } else {
      if (!window.confirm('Mark exercise as NOT done?')) {
        return
      }
      
      try {
        setSaving(true)
        const { error } = await supabase
          .from('daily_logs')
          .update({ 
            exercise_done: false,
            exercise_type: null,
            exercise_duration: null 
          })
          .eq('id', todayLog.id)

        if (error) throw error
        setTodayLog({ 
          ...todayLog, 
          exercise_done: false,
          exercise_type: null,
          exercise_duration: null 
        })
      } catch (error) {
        console.error('Error updating exercise:', error)
      } finally {
        setSaving(false)
      }
    }
  }

  const saveExercise = async () => {
    if (!type) {
      alert('Please select exercise type')
      return
    }

    try {
      setSaving(true)
      const updates = {
        exercise_done: true,
        exercise_type: type,
        exercise_duration: duration ? parseInt(duration) : null
      }

      const { error } = await supabase
        .from('daily_logs')
        .update(updates)
        .eq('id', todayLog.id)

      if (error) throw error

      setTodayLog({ ...todayLog, ...updates })
      setSavedMessage('✓ Exercise logged')
      setTimeout(() => setSavedMessage(''), 2000)
      
      setShowForm(false)
      setType('')
      setDuration('')
      
    } catch (error) {
      console.error('Error saving exercise:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900 dark:text-dark-text">Exercise</h3>
        <span className="text-xs text-gray-500 dark:text-dark-text-muted">For heart health</span>
      </div>

      {/* Main Toggle */}
      <button
        onClick={toggleExercise}
        disabled={saving}
        className={`w-full p-3 rounded-lg flex items-center justify-between transition ${
          todayLog?.exercise_done 
            ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500 dark:border-green-600 text-gray-900 dark:text-dark-text' 
            : 'bg-white dark:bg-dark-bg border-2 border-transparent hover:bg-gray-50 dark:hover:bg-dark-border text-gray-900 dark:text-dark-text'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">💪</span>
          <span>Exercise Today</span>
        </div>
        <div className="flex items-center gap-2">
          {todayLog?.exercise_done ? (
            <span className="text-green-600 dark:text-green-400">✓</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-600">○</span>
          )}
        </div>
      </button>

      {/* Show exercise details if done */}
      {todayLog?.exercise_done && !showForm && (
        <div className="bg-white dark:bg-dark-bg p-3 rounded border border-gray-200 dark:border-dark-border">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-900 dark:text-dark-text">{todayLog.exercise_type}</span>
              {todayLog.exercise_duration && (
                <span className="text-gray-600 dark:text-dark-text-muted ml-2">({todayLog.exercise_duration} min)</span>
              )}
            </div>
            <button
              onClick={() => {
                setType(todayLog.exercise_type)
                setDuration(todayLog.exercise_duration || '')
                setShowForm(true)
              }}
              className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Form for adding exercise details */}
      {showForm && (
        <div className="mt-3 space-y-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
          >
            <option value="">Select exercise type</option>
            {exerciseTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration (minutes) - optional"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
          />

          <div className="flex gap-2">
            <button
              onClick={saveExercise}
              disabled={saving}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setType('')
                setDuration('')
                if (!todayLog?.exercise_done) {
                  toggleExercise()
                }
              }}
              className="bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text px-3 py-1 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved message */}
      {savedMessage && (
        <p className="text-green-600 dark:text-green-400 text-sm">{savedMessage}</p>
      )}
    </div>
  )
}