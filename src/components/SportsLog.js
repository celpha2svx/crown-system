import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function SportsLog({ session }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  
  // Form state
  const [sport, setSport] = useState('')
  const [otherSport, setOtherSport] = useState('')
  const [duration, setDuration] = useState('')
  const [withWhom, setWithWhom] = useState('')
  const [notes, setNotes] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])

  const sportOptions = [
    { id: 'football', name: '⚽ Football', icon: '⚽' },
    { id: 'basketball', name: '🏀 Basketball', icon: '🏀' },
    { id: 'running', name: '🏃 Running', icon: '🏃' },
    { id: 'chess', name: '♟️ Chess', icon: '♟️' },
    { id: 'swimming', name: '🏊 Swimming', icon: '🏊' },
    { id: 'cycling', name: '🚴 Cycling', icon: '🚴' },
    { id: 'tennis', name: '🎾 Tennis', icon: '🎾' },
    { id: 'gym', name: '💪 Gym', icon: '💪' },
    { id: 'other', name: '🎯 Other', icon: '🎯' }
  ]

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sports_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading sports logs:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setSport('')
    setOtherSport('')
    setDuration('')
    setWithWhom('')
    setNotes('')
    setLogDate(new Date().toISOString().split('T')[0])
    setEditingLog(null)
  }

  async function saveLog() {
    if (!sport) {
      alert('Select a sport')
      return
    }

    if (sport === 'other' && !otherSport.trim()) {
      alert('Please specify the sport')
      return
    }

    try {
      const logData = {
        user_id: session.user.id,
        sport: sport,
        other_sport_text: sport === 'other' ? otherSport : null,
        date: new Date(logDate).toISOString(),
        duration: duration ? parseInt(duration) : null,
        with_whom: withWhom || null,
        notes: notes || null
      }

      let error
      
      if (editingLog) {
        ({ error } = await supabase
          .from('sports_logs')
          .update(logData)
          .eq('id', editingLog.id))
      } else {
        ({ error } = await supabase
          .from('sports_logs')
          .insert([logData]))
      }

      if (error) throw error

      resetForm()
      setShowForm(false)
      loadLogs()

    } catch (error) {
      console.error('Error saving log:', error)
      alert('Failed to save log')
    }
  }

  function editLog(log) {
    setEditingLog(log)
    setSport(log.sport)
    setOtherSport(log.other_sport_text || '')
    setDuration(log.duration || '')
    setWithWhom(log.with_whom || '')
    setNotes(log.notes || '')
    setLogDate(new Date(log.date).toISOString().split('T')[0])
    setShowForm(true)
  }

  async function deleteLog(id) {
    if (!window.confirm('Delete this log?')) return

    try {
      const { error } = await supabase
        .from('sports_logs')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadLogs()
    } catch (error) {
      console.error('Error deleting log:', error)
    }
  }

  const groupLogsByMonth = () => {
    const groups = {}
    logs.forEach(log => {
      const date = new Date(log.date)
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      if (!groups[monthYear]) {
        groups[monthYear] = []
      }
      groups[monthYear].push(log)
    })
    return groups
  }

  const getSportIcon = (sportId) => {
    const option = sportOptions.find(o => o.id === sportId)
    return option ? option.icon : '🎯'
  }

  const getSportName = (log) => {
    if (log.sport === 'other') {
      return log.other_sport_text || 'Other'
    }
    const option = sportOptions.find(o => o.id === log.sport)
    return option ? option.name : log.sport
  }

  const groupedLogs = groupLogsByMonth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">Sports Log</h2>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          + Log Activity
        </button>
      </div>

      {/* Stats Summary */}
      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 dark:bg-dark-card p-3 rounded-lg text-center border border-gray-200 dark:border-dark-border">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-lg font-bold text-gray-900 dark:text-dark-text">{logs.length}</div>
            <div className="text-xs text-gray-600 dark:text-dark-text-muted">Total Activities</div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-card p-3 rounded-lg text-center border border-gray-200 dark:border-dark-border">
            <div className="text-2xl mb-1">⏱️</div>
            <div className="text-lg font-bold text-gray-900 dark:text-dark-text">
              {logs.reduce((sum, log) => sum + (log.duration || 0), 0)} min
            </div>
            <div className="text-xs text-gray-600 dark:text-dark-text-muted">Total Time</div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-card p-3 rounded-lg text-center border border-gray-200 dark:border-dark-border">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-lg font-bold text-gray-900 dark:text-dark-text">
              {new Set(logs.map(l => l.sport)).size}
            </div>
            <div className="text-xs text-gray-600 dark:text-dark-text-muted">Different Sports</div>
          </div>
        </div>
      )}

      {/* New/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-dark-text">
            {editingLog ? 'Edit Activity' : 'Log New Activity'}
          </h3>
          
          {/* Sport Selection */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-2">Sport *</label>
            <div className="grid grid-cols-2 gap-2">
              {sportOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSport(option.id)}
                  className={`p-2 rounded-lg text-sm flex items-center gap-2 transition ${
                    sport === option.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border text-gray-900 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Other Sport Input */}
          {sport === 'other' && (
            <input
              type="text"
              value={otherSport}
              onChange={(e) => setOtherSport(e.target.value)}
              placeholder="Specify sport *"
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            />
          )}

          {/* Date */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-1">Date</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-1">Duration (minutes) - optional</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 60"
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            />
          </div>

          {/* With Whom */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-1">With whom? - optional</label>
            <input
              type="text"
              value={withWhom}
              onChange={(e) => setWithWhom(e.target.value)}
              placeholder="Friends, team, alone..."
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-1">Notes - optional</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it feel? Any highlights?"
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              rows="2"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3">
            <button
              onClick={saveLog}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              {editingLog ? 'Update Log' : 'Save Log'}
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowForm(false)
              }}
              className="flex-1 bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Logs List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-dark-text-muted border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg">
          <p className="text-4xl mb-4">⚽</p>
          <p className="mb-2">No sports activities logged yet</p>
          <p className="text-sm">Click "Log Activity" to track your play</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([month, monthLogs]) => (
            <div key={month}>
              <h3 className="font-medium text-gray-700 dark:text-dark-text-muted mb-3 sticky top-0 bg-gray-50 dark:bg-dark-bg py-2">
                {month}
              </h3>
              <div className="space-y-2">
                {monthLogs.map(log => (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:shadow-md transition"
                  >
                    {/* Log Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getSportIcon(log.sport)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-dark-text">{getSportName(log)}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-text-muted">
                            <span>{new Date(log.date).toLocaleDateString()}</span>
                            {log.duration && (
                              <>
                                <span>•</span>
                                <span>{log.duration} min</span>
                              </>
                            )}
                            {log.with_whom && (
                              <>
                                <span>•</span>
                                <span>with {log.with_whom}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editLog(log)}
                          className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="text-red-600 dark:text-red-400 text-sm hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Notes */}
                    {log.notes && (
                      <p className="text-sm text-gray-600 dark:text-dark-text-muted mt-3 bg-gray-50 dark:bg-dark-bg p-2 rounded border border-gray-200 dark:border-dark-border">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}