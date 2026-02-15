import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ReadingTracker({ todayLog, setTodayLog, saving, setSaving }) {
  const [showForm, setShowForm] = useState(false)
  const [readingText, setReadingText] = useState('')
  const [perspective, setPerspective] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const toggleReading = async () => {
    const newValue = !todayLog?.reading_done
    
    if (newValue) {
      setShowForm(true)
    } else {
      if (!window.confirm('Mark reading as NOT done?')) {
        return
      }
      
      try {
        setSaving(true)
        const { error } = await supabase
          .from('daily_logs')
          .update({ 
            reading_done: false,
            reading_text: null,
            reading_perspective: null 
          })
          .eq('id', todayLog.id)

        if (error) throw error
        setTodayLog({ 
          ...todayLog, 
          reading_done: false,
          reading_text: null,
          reading_perspective: null 
        })
      } catch (error) {
        console.error('Error updating reading:', error)
      } finally {
        setSaving(false)
      }
    }
  }

  const saveReading = async () => {
    if (!readingText.trim()) {
      alert('What did you read?')
      return
    }

    try {
      setSaving(true)
      const updates = {
        reading_done: true,
        reading_text: readingText,
        reading_perspective: perspective || null
      }

      const { error } = await supabase
        .from('daily_logs')
        .update(updates)
        .eq('id', todayLog.id)

      if (error) throw error

      setTodayLog({ ...todayLog, ...updates })
      setSavedMessage('✓ Reading logged')
      setTimeout(() => setSavedMessage(''), 2000)
      
      setShowForm(false)
      setReadingText('')
      setPerspective('')
      
    } catch (error) {
      console.error('Error saving reading:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900 dark:text-dark-text">Daily Reading</h3>
        <span className="text-xs text-gray-500 dark:text-dark-text-muted">TRUTH_PA</span>
      </div>

      {/* Main Toggle */}
      <button
        onClick={toggleReading}
        disabled={saving}
        className={`w-full p-3 rounded-lg flex items-center justify-between transition ${
          todayLog?.reading_done 
            ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500 dark:border-green-600 text-gray-900 dark:text-dark-text' 
            : 'bg-white dark:bg-dark-bg border-2 border-transparent hover:bg-gray-50 dark:hover:bg-dark-border text-gray-900 dark:text-dark-text'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <span>Read Today</span>
        </div>
        <div className="flex items-center gap-2">
          {todayLog?.reading_done ? (
            <span className="text-green-600 dark:text-green-400">✓</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-600">○</span>
          )}
        </div>
      </button>

      {/* Show reading details if done */}
      {todayLog?.reading_done && !showForm && (
        <div className="bg-white dark:bg-dark-bg p-3 rounded border border-gray-200 dark:border-dark-border space-y-2">
          <div>
            <span className="text-xs text-gray-500 dark:text-dark-text-muted">What you read:</span>
            <p className="text-sm text-gray-900 dark:text-dark-text">{todayLog.reading_text}</p>
          </div>
          {todayLog.reading_perspective && (
            <div>
              <span className="text-xs text-gray-500 dark:text-dark-text-muted">Perspective shift:</span>
              <p className="text-sm italic text-gray-900 dark:text-dark-text">"{todayLog.reading_perspective}"</p>
            </div>
          )}
          <button
            onClick={() => {
              setReadingText(todayLog.reading_text)
              setPerspective(todayLog.reading_perspective || '')
              setShowForm(true)
            }}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
          >
            Edit
          </button>
        </div>
      )}

      {/* Form for adding reading details */}
      {showForm && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs text-gray-600 dark:text-dark-text-muted block mb-1">
              What did you read? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={readingText}
              onChange={(e) => setReadingText(e.target.value)}
              placeholder="Book title, article, topic..."
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 dark:text-dark-text-muted block mb-1">
              How did it change your perspective? (optional)
            </label>
            <textarea
              value={perspective}
              onChange={(e) => setPerspective(e.target.value)}
              placeholder="What truth did you encounter?"
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              rows="2"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveReading}
              disabled={saving}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setReadingText('')
                setPerspective('')
                if (!todayLog?.reading_done) {
                  toggleReading()
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