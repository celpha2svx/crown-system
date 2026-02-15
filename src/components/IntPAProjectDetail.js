import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function IntPAProjectDetail({ projectId, session, onBack }) {
  const [project, setProject] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [showLinksForm, setShowLinksForm] = useState(false)
  
  // Session form state
  const [selectedMilestone, setSelectedMilestone] = useState('')
  const [timeSpent, setTimeSpent] = useState('')
  const [progressNote, setProgressNote] = useState('')
  const [sessionLinks, setSessionLinks] = useState('')

  // Publication links state
  const [pubLinks, setPubLinks] = useState([])
  const [newPlatform, setNewPlatform] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const milestones = [
    { id: 1, name: 'Topic defined' },
    { id: 2, name: 'Research done' },
    { id: 3, name: 'Question formed' },
    { id: 4, name: 'Experiment designed' },
    { id: 5, name: 'Implementation started' },
    { id: 6, name: 'Results obtained' },
    { id: 7, name: 'Analysis complete' },
    { id: 8, name: 'Paper drafted' },
    { id: 9, name: 'Code pushed' },
    { id: 10, name: 'Deployed' },
    { id: 11, name: 'Published' }
  ]

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  async function loadProjectData() {
    try {
      setLoading(true)
      
      const { data: projectData, error: projectError } = await supabase
        .from('int_pa_projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)
      
      if (projectData.publication_links) {
        setPubLinks(projectData.publication_links)
      }

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('int_pa_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })

      if (sessionsError) throw sessionsError
      setSessions(sessionsData || [])

    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  async function logSession() {
    if (!selectedMilestone) {
      alert('Select which milestone you worked on')
      return
    }

    try {
      const sessionData = {
        project_id: projectId,
        user_id: session.user.id,
        milestone_worked_on: parseInt(selectedMilestone),
        time_spent: timeSpent ? parseInt(timeSpent) : null,
        progress_note: progressNote,
        links: sessionLinks ? { url: sessionLinks } : null
      }

      const { error } = await supabase
        .from('int_pa_sessions')
        .insert([sessionData])

      if (error) throw error

      await supabase
        .from('int_pa_projects')
        .update({ last_worked_on: new Date().toISOString() })
        .eq('id', projectId)

      if (parseInt(selectedMilestone) > project.current_milestone) {
        await supabase
          .from('int_pa_projects')
          .update({ current_milestone: parseInt(selectedMilestone) })
          .eq('id', projectId)
        
        setProject({
          ...project,
          current_milestone: parseInt(selectedMilestone)
        })
      }

      loadProjectData()
      
      setSelectedMilestone('')
      setTimeSpent('')
      setProgressNote('')
      setSessionLinks('')
      setShowSessionForm(false)

    } catch (error) {
      console.error('Error logging session:', error)
      alert('Failed to log session')
    }
  }

  async function addPublicationLink() {
    if (!newPlatform.trim() || !newUrl.trim()) {
      alert('Both platform and URL are required')
      return
    }

    const updatedLinks = [...pubLinks, { platform: newPlatform, url: newUrl }]

    try {
      const { error } = await supabase
        .from('int_pa_projects')
        .update({ publication_links: updatedLinks })
        .eq('id', projectId)

      if (error) throw error

      setPubLinks(updatedLinks)
      setNewPlatform('')
      setNewUrl('')
    } catch (error) {
      console.error('Error adding link:', error)
    }
  }

  async function removePublicationLink(index) {
    const updatedLinks = pubLinks.filter((_, i) => i !== index)

    try {
      const { error } = await supabase
        .from('int_pa_projects')
        .update({ publication_links: updatedLinks })
        .eq('id', projectId)

      if (error) throw error
      setPubLinks(updatedLinks)
    } catch (error) {
      console.error('Error removing link:', error)
    }
  }

  async function markMilestoneComplete(milestoneId) {
    if (milestoneId <= project.current_milestone) {
      return
    }

    try {
      await supabase
        .from('int_pa_projects')
        .update({ current_milestone: milestoneId })
        .eq('id', projectId)

      setProject({ ...project, current_milestone: milestoneId })

      const sessionData = {
        project_id: projectId,
        user_id: session.user.id,
        milestone_worked_on: milestoneId,
        progress_note: `Completed ${milestones[milestoneId-1].name}`,
        time_spent: null
      }

      await supabase
        .from('int_pa_sessions')
        .insert([sessionData])

      loadProjectData()

    } catch (error) {
      console.error('Error updating milestone:', error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted">
        Loading project...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted">
        Project not found
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-2xl hover:bg-gray-100 dark:hover:bg-dark-border w-10 h-10 rounded-full text-gray-900 dark:text-dark-text transition"
        >
          ←
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">{project.name}</h2>
          {project.description && (
            <p className="text-sm text-gray-600 dark:text-dark-text-muted">{project.description}</p>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-gray-900 dark:text-dark-text">Overall Progress</h3>
          <span className="text-sm font-medium text-gray-900 dark:text-dark-text">{project.current_milestone}/11</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-3 mb-4">
          <div
            className="bg-blue-600 rounded-full h-3"
            style={{ width: `${(project.current_milestone / 11) * 100}%` }}
          />
        </div>

        {/* Milestone Grid */}
        <div className="grid gap-2 mt-4">
          {milestones.map((m, index) => {
            const isComplete = index + 1 <= project.current_milestone
            const isCurrent = index + 1 === project.current_milestone
            
            return (
              <div
                key={m.id}
                onClick={() => !isComplete && markMilestoneComplete(m.id)}
                className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition ${
                  isComplete
                    ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700'
                    : isCurrent
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border'
                }`}
              >
                <span className={
                  isComplete ? 'text-green-700 dark:text-green-300' : 
                  isCurrent ? 'text-blue-700 dark:text-blue-300 font-medium' : 
                  'text-gray-600 dark:text-dark-text-muted'
                }>
                  {m.id}. {m.name}
                </span>
                {isComplete && (
                  <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Log Session Button */}
      <button
        onClick={() => setShowSessionForm(!showSessionForm)}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
      >
        {showSessionForm ? 'Cancel' : '+ Log Work Session'}
      </button>

      {/* Session Form */}
      {showSessionForm && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-dark-text">Log Your Work</h3>
          
          <select
            value={selectedMilestone}
            onChange={(e) => setSelectedMilestone(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
          >
            <option value="">Which milestone did you work on?</option>
            {milestones.map(m => (
              <option key={m.id} value={m.id}>
                {m.id}. {m.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={timeSpent}
            onChange={(e) => setTimeSpent(e.target.value)}
            placeholder="Time spent (minutes) - optional"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
          />

          <textarea
            value={progressNote}
            onChange={(e) => setProgressNote(e.target.value)}
            placeholder="What did you do? (one sentence)"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            rows="2"
          />

          <input
            type="url"
            value={sessionLinks}
            onChange={(e) => setSessionLinks(e.target.value)}
            placeholder="Link to work (optional)"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
          />

          <button
            onClick={logSession}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            Save Session
          </button>
        </div>
      )}

      {/* Publication Links (appears at milestone 11) */}
      {project.current_milestone >= 11 && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-dark-text">Publication Links</h3>
            <button
              onClick={() => setShowLinksForm(!showLinksForm)}
              className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
            >
              + Add
            </button>
          </div>

          {/* Links List */}
          {pubLinks.length > 0 && (
            <div className="space-y-2">
              {pubLinks.map((link, index) => (
                <div key={index} className="bg-white dark:bg-dark-bg p-2 rounded border border-gray-200 dark:border-dark-border flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm text-gray-900 dark:text-dark-text">{link.platform}:</span>{' '}
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                      {link.url}
                    </a>
                  </div>
                  <button
                    onClick={() => removePublicationLink(index)}
                    className="text-red-500 dark:text-red-400 text-sm hover:underline"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Link Form */}
          {showLinksForm && (
            <div className="space-y-2">
              <input
                type="text"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                placeholder="Platform (e.g., LinkedIn, GitHub)"
                className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              />
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="URL"
                className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              />
              <button
                onClick={addPublicationLink}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
              >
                Add Link
              </button>
            </div>
          )}
        </div>
      )}

      {/* Session History */}
      {sessions.length > 0 && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border">
          <h3 className="font-medium text-gray-900 dark:text-dark-text mb-3">Work History</h3>
          <div className="space-y-2">
            {sessions.map(session => (
              <div key={session.id} className="bg-white dark:bg-dark-bg p-3 rounded border border-gray-200 dark:border-dark-border text-sm">
                <div className="flex justify-between text-gray-500 dark:text-dark-text-muted mb-1">
                  <span>{new Date(session.date).toLocaleDateString()}</span>
                  {session.time_spent && (
                    <span>{session.time_spent} min</span>
                  )}
                </div>
                <div className="font-medium text-gray-900 dark:text-dark-text">
                  Milestone {session.milestone_worked_on}: {milestones[session.milestone_worked_on-1].name}
                </div>
                {session.progress_note && (
                  <p className="text-gray-700 dark:text-dark-text-muted mt-1">{session.progress_note}</p>
                )}
                {session.links?.url && (
                  <a href={session.links.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 text-xs mt-1 block hover:underline">
                    View work →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}