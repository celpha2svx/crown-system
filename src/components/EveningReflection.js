import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function EveningReflection({ todayLog, setTodayLog, onClose }) {
  const [presence, setPresence] = useState(5)
  const [challenges, setChallenges] = useState('')
  const [truth, setTruth] = useState('')
  const [gratitude, setGratitude] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (todayLog?.reflection_data) {
      const data = todayLog.reflection_data
      setPresence(data.presence || 5)
      setChallenges(data.challenges || '')
      setTruth(data.truth || '')
      setGratitude(data.gratitude || '')
      setNotes(data.notes || '')
    }
  }, [todayLog])

  const getSummary = () => {
    const prayers = [
      todayLog?.prayer_fajr,
      todayLog?.prayer_dhuhr,
      todayLog?.prayer_asr,
      todayLog?.prayer_maghrib,
      todayLog?.prayer_isha
    ].filter(Boolean).length

    return {
      prayer: `${prayers}/5`,
      reading: todayLog?.reading_done ? 'Done ✓' : 'Not done',
      exercise: todayLog?.exercise_done ? 'Done ✓' : 'Not done',
      environment: todayLog?.environment_clean ? 'Done ✓' : 'Not done',
      hygiene: (todayLog?.hygiene_morning && todayLog?.hygiene_evening) ? 'Done ✓' : 
               (todayLog?.hygiene_morning || todayLog?.hygiene_evening) ? 'Partial' : 'Not done',
      languages: todayLog?.languages_done ? 'Done ✓' : 'Not done'
    }
  }

  const saveReflection = async () => {
    try {
      setSaving(true)
      
      const reflectionData = {
        presence,
        challenges,
        truth,
        gratitude,
        notes,
        timestamp: new Date().toISOString()
      }

      const { error } = await supabase
        .from('daily_logs')
        .update({ reflection_data: reflectionData })
        .eq('id', todayLog.id)

      if (error) throw error

      setTodayLog({ ...todayLog, reflection_data: reflectionData })
      setSaved(true)
      
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Error saving reflection:', error)
    } finally {
      setSaving(false)
    }
  }

  const summary = getSummary()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-card rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-border">
        
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border p-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">Evening Reflection</h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">Take a moment to close your day with awareness</p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          
          {/* Today's Summary */}
          <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg border border-gray-200 dark:border-dark-border">
            <h3 className="font-medium text-gray-900 dark:text-dark-text mb-3">Today's Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-dark-text-muted">🕌 Prayer</span>
                <span className={summary.prayer.includes('5/5') ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                  {summary.prayer}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-dark-text-muted">📚 Reading</span>
                <span className={summary.reading.includes('Done') ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-600'}>
                  {summary.reading}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-dark-text-muted">💪 Exercise</span>
                <span className={summary.exercise.includes('Done') ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-600'}>
                  {summary.exercise}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-dark-text-muted">🏠 Environment</span>
                <span className={summary.environment.includes('Done') ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-600'}>
                  {summary.environment}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-dark-text-muted">🧹 Hygiene</span>
                <span className={
                  summary.hygiene.includes('Done') ? 'text-green-600 dark:text-green-400' : 
                  summary.hygiene.includes('Partial') ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-600'
                }>
                  {summary.hygiene}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-dark-text-muted">🗣️ Languages</span>
                <span className={summary.languages.includes('Done') ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-600'}>
                  {summary.languages}
                </span>
              </div>
            </div>
          </div>

          {/* Presence Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-dark-text mb-2">
              How present were you in your prayers today?
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="10"
                value={presence}
                onChange={(e) => setPresence(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-dark-text-muted">
                <span>Distracted</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{presence}/10</span>
                <span>Fully present</span>
              </div>
            </div>
          </div>

          {/* Challenges */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-dark-text mb-2">
              What challenged you today?
            </label>
            <textarea
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Any difficulties, distractions, or struggles..."
              className="w-full p-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              rows="2"
            />
          </div>

          {/* Truth */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-dark-text mb-2">
              What truth did you encounter?
            </label>
            <textarea
              value={truth}
              onChange={(e) => setTruth(e.target.value)}
              placeholder="Something you learned, realized, or understood differently..."
              className="w-full p-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              rows="2"
            />
          </div>

          {/* Gratitude */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-dark-text mb-2">
              What are you grateful for?
            </label>
            <textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="Big or small, what brought you joy today?"
              className="w-full p-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              rows="2"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-dark-text mb-2">
              Any other notes for yourself?
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Free space for anything else..."
              className="w-full p-3 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              rows="2"
            />
          </div>

          {/* Saved Confirmation */}
          {saved && (
            <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-lg text-center border border-green-200 dark:border-green-800">
              ✓ Reflection saved. Closing...
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={saveReflection}
              disabled={saving || saved}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                saving || saved
                  ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Reflection'}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 rounded-lg font-medium border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}