import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function LanguagesTracker({ todayLog, setTodayLog, saving, setSaving }) {
  const [showForm, setShowForm] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState([])
  const [tool, setTool] = useState('')
  const [activities, setActivities] = useState([])
  const [savedMessage, setSavedMessage] = useState('')

  const languageOptions = [
    'Arabic', 'French', 'German', 'Russian', 'Spanish', 'Mandarin', 'Japanese'
  ]

  const toolOptions = ['LingoDear', 'AI Literacy', 'Both']
  
  const activityOptions = [
    'App lesson', 'AI translation', 'Writing composition', 
    'Speaking practice', 'Translation exercise', 'Vocabulary'
  ]

  const toggleLanguages = async () => {
    const newValue = !todayLog?.languages_done
    
    if (newValue) {
      setShowForm(true)
    } else {
      if (!window.confirm('Mark language practice as NOT done?')) {
        return
      }
      
      try {
        setSaving(true)
        const { error } = await supabase
          .from('daily_logs')
          .update({ 
            languages_done: false,
            languages_data: null 
          })
          .eq('id', todayLog.id)

        if (error) throw error
        setTodayLog({ 
          ...todayLog, 
          languages_done: false,
          languages_data: null 
        })
      } catch (error) {
        console.error('Error updating languages:', error)
      } finally {
        setSaving(false)
      }
    }
  }

  const toggleLanguage = (lang) => {
    setSelectedLanguages(prev =>
      prev.includes(lang)
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    )
  }

  const toggleActivity = (activity) => {
    setActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    )
  }

  const saveLanguages = async () => {
    if (selectedLanguages.length === 0) {
      alert('Select at least one language')
      return
    }

    if (!tool) {
      alert('Select which tool you used')
      return
    }

    try {
      setSaving(true)
      const languagesData = {
        languages: selectedLanguages,
        tool: tool,
        activities: activities
      }

      const updates = {
        languages_done: true,
        languages_data: languagesData
      }

      const { error } = await supabase
        .from('daily_logs')
        .update(updates)
        .eq('id', todayLog.id)

      if (error) throw error

      setTodayLog({ ...todayLog, ...updates })
      setSavedMessage('✓ Languages logged')
      setTimeout(() => setSavedMessage(''), 2000)
      
      setShowForm(false)
      setSelectedLanguages([])
      setTool('')
      setActivities([])
      
    } catch (error) {
      console.error('Error saving languages:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatLanguagesData = (data) => {
    if (!data) return ''
    const langs = data.languages?.join(', ') || ''
    const tool = data.tool ? `via ${data.tool}` : ''
    const acts = data.activities?.length ? `: ${data.activities.join(', ')}` : ''
    return `${langs} ${tool}${acts}`
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900 dark:text-dark-text">Language Practice</h3>
        <span className="text-xs text-gray-500 dark:text-dark-text-muted">Absolute</span>
      </div>

      {/* Main Toggle */}
      <button
        onClick={toggleLanguages}
        disabled={saving}
        className={`w-full p-3 rounded-lg flex items-center justify-between transition ${
          todayLog?.languages_done 
            ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500 dark:border-green-600 text-gray-900 dark:text-dark-text' 
            : 'bg-white dark:bg-dark-bg border-2 border-transparent hover:bg-gray-50 dark:hover:bg-dark-border text-gray-900 dark:text-dark-text'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🗣️</span>
          <span>Language Practice Today</span>
        </div>
        <div className="flex items-center gap-2">
          {todayLog?.languages_done ? (
            <span className="text-green-600 dark:text-green-400">✓</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-600">○</span>
          )}
        </div>
      </button>

      {/* Show languages details if done */}
      {todayLog?.languages_done && !showForm && todayLog.languages_data && (
        <div className="bg-white dark:bg-dark-bg p-3 rounded border border-gray-200 dark:border-dark-border">
          <p className="text-sm text-gray-900 dark:text-dark-text">{formatLanguagesData(todayLog.languages_data)}</p>
          <button
            onClick={() => {
              const data = todayLog.languages_data
              setSelectedLanguages(data.languages || [])
              setTool(data.tool || '')
              setActivities(data.activities || [])
              setShowForm(true)
            }}
            className="text-blue-600 dark:text-blue-400 text-sm mt-2 hover:underline"
          >
            Edit
          </button>
        </div>
      )}

      {/* Form for adding languages details */}
      {showForm && (
        <div className="mt-3 space-y-4">
          {/* Languages */}
          <div>
            <label className="text-xs text-gray-600 dark:text-dark-text-muted block mb-2">
              Which languages? <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedLanguages.includes(lang)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Tool */}
          <div>
            <label className="text-xs text-gray-600 dark:text-dark-text-muted block mb-2">
              Which tool? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {toolOptions.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTool(t)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    tool === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <label className="text-xs text-gray-600 dark:text-dark-text-muted block mb-2">
              What did you do? (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {activityOptions.map(act => (
                <button
                  key={act}
                  type="button"
                  onClick={() => toggleActivity(act)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    activities.includes(act)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={saveLanguages}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setSelectedLanguages([])
                setTool('')
                setActivities([])
                if (!todayLog?.languages_done) {
                  toggleLanguages()
                }
              }}
              className="bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text px-4 py-2 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition"
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