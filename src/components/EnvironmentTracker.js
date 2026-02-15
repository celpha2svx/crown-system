import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function EnvironmentTracker({ todayLog, setTodayLog, saving, setSaving }) {
  const [note, setNote] = useState('')
  const [showNoteField, setShowNoteField] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const toggleEnvironment = async () => {
    const newValue = !todayLog?.environment_clean
    
    try {
      setSaving(true)
      const { error } = await supabase
        .from('daily_logs')
        .update({ environment_clean: newValue })
        .eq('id', todayLog.id)

      if (error) throw error
      setTodayLog({ ...todayLog, environment_clean: newValue })
      
      if (newValue) {
        setShowNoteField(true)
      } else {
        setShowNoteField(false)
        setNote('')
      }
    } catch (error) {
      console.error('Error updating environment:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveNote = async () => {
    if (!note.trim()) {
      setShowNoteField(false)
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase
        .from('daily_logs')
        .update({ environment_note: note })
        .eq('id', todayLog.id)

      if (error) throw error
      
      setTodayLog({ ...todayLog, environment_note: note })
      setSavedMessage('✓ Note saved')
      setTimeout(() => setSavedMessage(''), 2000)
      
      setNote('')
      setShowNoteField(false)
      
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900 dark:text-dark-text">Environment</h3>
        <span className="text-xs text-gray-500 dark:text-dark-text-muted">No time restriction</span>
      </div>

      {/* Main Toggle */}
      <button
        onClick={toggleEnvironment}
        disabled={saving}
        className={`w-full p-3 rounded-lg flex items-center justify-between transition ${
          todayLog?.environment_clean 
            ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500 dark:border-green-600 text-gray-900 dark:text-dark-text' 
            : 'bg-white dark:bg-dark-bg border-2 border-transparent hover:bg-gray-50 dark:hover:bg-dark-border text-gray-900 dark:text-dark-text'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <span>Space Clean & Organized</span>
        </div>
        <div className="flex items-center gap-2">
          {todayLog?.environment_clean ? (
            <span className="text-green-600 dark:text-green-400">✓</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-600">○</span>
          )}
        </div>
      </button>

      {/* Note Field */}
      {showNoteField && (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you clean/organize? (optional)"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            rows="2"
          />
          <div className="flex gap-2">
            <button
              onClick={saveNote}
              disabled={saving}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
            >
              Save Note
            </button>
            <button
              onClick={() => {
                setShowNoteField(false)
                setNote('')
              }}
              className="bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text px-3 py-1 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Show existing note */}
      {todayLog?.environment_note && !showNoteField && (
        <div className="text-sm bg-white dark:bg-dark-bg p-2 rounded border border-gray-200 dark:border-dark-border">
          <span className="text-gray-500 dark:text-dark-text-muted">Note:</span>{' '}
          <span className="text-gray-900 dark:text-dark-text">{todayLog.environment_note}</span>
          <button
            onClick={() => {
              setNote(todayLog.environment_note)
              setShowNoteField(true)
            }}
            className="text-blue-600 dark:text-blue-400 text-xs ml-2 hover:underline"
          >
            Edit
          </button>
        </div>
      )}

      {/* Saved message */}
      {savedMessage && (
        <p className="text-green-600 dark:text-green-400 text-sm">{savedMessage}</p>
      )}
    </div>
  )
}