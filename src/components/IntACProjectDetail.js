import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function IntACProjectDetail({ projectId, session, onBack }) {
  const [project, setProject] = useState(null)
  const [sessions, setSessions] = useState([])
  const [entrepreneurial, setEntrepreneurial] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [showEntreForm, setShowEntreForm] = useState(false)
  
  // Session form state
  const [selectedMilestone, setSelectedMilestone] = useState('')
  const [timeSpent, setTimeSpent] = useState('')
  const [progressNote, setProgressNote] = useState('')
  const [outputs, setOutputs] = useState('')

  // Entrepreneurial form state
  const [activityType, setActivityType] = useState('')
  const [activityDesc, setActivityDesc] = useState('')
  const [organization, setOrganization] = useState('')
  const [amount, setAmount] = useState('')
  const [activityLink, setActivityLink] = useState('')
  const [activityNotes, setActivityNotes] = useState('')

  const sectors = {
    foundation: { name: 'Foundation (Energy & Water)', icon: '⚡' },
    enablers: { name: 'Enablers (Finance & Transport)', icon: '🚚' },
    social: { name: 'Social Pillars (Health & Education)', icon: '🏥' },
    producers: { name: 'Producers (Agriculture & Manufacturing)', icon: '🌾' }
  }

  const milestones = [
    { id: 1, name: 'Research' },
    { id: 2, name: 'Problem Defined' },
    { id: 3, name: 'Solution Strategized' },
    { id: 4, name: 'Paper Written' },
    { id: 5, name: 'Prototype Built' },
    { id: 6, name: 'Solution Deployed' },
    { id: 7, name: 'Paper Published' },
    { id: 8, name: 'Funding Pursued' },
    { id: 9, name: 'Partnerships Formed' },
    { id: 10, name: 'Impact Measured' },
    { id: 11, name: 'Scaling' }
  ]

  const activityTypes = [
    { id: 'letter_sent', name: '📨 Letter Sent', fields: ['organization', 'link'] },
    { id: 'meeting_held', name: '🤝 Meeting Held', fields: ['organization', 'notes'] },
    { id: 'funding_received', name: '💰 Funding Received', fields: ['organization', 'amount', 'notes'] },
    { id: 'partnership_formed', name: '🤲 Partnership Formed', fields: ['organization', 'link', 'notes'] }
  ]

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  async function loadProjectData() {
    try {
      setLoading(true)
      
      const { data: projectData, error: projectError } = await supabase
        .from('int_ac_projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('int_ac_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })

      if (sessionsError) throw sessionsError
      setSessions(sessionsData || [])

      const { data: entreData, error: entreError } = await supabase
        .from('int_ac_entrepreneurial')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })

      if (entreError) throw entreError
      setEntrepreneurial(entreData || [])

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
        outputs: outputs ? { link: outputs } : null
      }

      const { error } = await supabase
        .from('int_ac_sessions')
        .insert([sessionData])

      if (error) throw error

      await supabase
        .from('int_ac_projects')
        .update({ last_worked_on: new Date().toISOString() })
        .eq('id', projectId)

      if (parseInt(selectedMilestone) > project.current_milestone) {
        await supabase
          .from('int_ac_projects')
          .update({ 
            current_milestone: parseInt(selectedMilestone),
            progress_bar: parseInt(selectedMilestone)
          })
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
      setOutputs('')
      setShowSessionForm(false)

    } catch (error) {
      console.error('Error logging session:', error)
      alert('Failed to log session')
    }
  }

  async function logEntrepreneurial() {
    if (!activityType) {
      alert('Select activity type')
      return
    }

    try {
      const activityData = {
        project_id: projectId,
        user_id: session.user.id,
        activity_type: activityType,
        description: activityDesc,
        organization: organization,
        amount: amount ? parseInt(amount) : null,
        link: activityLink,
        notes: activityNotes
      }

      const { error } = await supabase
        .from('int_ac_entrepreneurial')
        .insert([activityData])

      if (error) throw error

      if (project.status !== 'entrepreneurial') {
        await supabase
          .from('int_ac_projects')
          .update({ status: 'entrepreneurial' })
          .eq('id', projectId)
        
        setProject({ ...project, status: 'entrepreneurial' })
      }

      loadProjectData()
      
      setActivityType('')
      setActivityDesc('')
      setOrganization('')
      setAmount('')
      setActivityLink('')
      setActivityNotes('')
      setShowEntreForm(false)

    } catch (error) {
      console.error('Error logging entrepreneurial activity:', error)
      alert('Failed to log activity')
    }
  }

  async function markMilestoneComplete(milestoneId) {
    if (milestoneId <= project.current_milestone) {
      return
    }

    try {
      await supabase
        .from('int_ac_projects')
        .update({ 
          current_milestone: milestoneId,
          progress_bar: milestoneId
        })
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
        .from('int_ac_sessions')
        .insert([sessionData])

      loadProjectData()

    } catch (error) {
      console.error('Error updating milestone:', error)
    }
  }

  const getActivityIcon = (type) => {
    const activity = activityTypes.find(a => a.id === type)
    return activity ? activity.name.split(' ')[0] : '📌'
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

  const sector = sectors[project.sector]

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
          <div className="flex items-center gap-2">
            <span className="text-2xl">{sector?.icon}</span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">{project.name}</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-text-muted">{sector?.name}</p>
          {project.description && (
            <p className="text-sm text-gray-600 dark:text-dark-text-muted mt-1">{project.description}</p>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
        project.status === 'entrepreneurial' 
          ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100' 
          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
      }`}>
        {project.status === 'entrepreneurial' ? '🚀 Entrepreneurial Phase' : '🔬 Research & Development'}
      </div>

      {/* Progress Overview */}
      <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-gray-900 dark:text-dark-text">Project Progress</h3>
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

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowSessionForm(!showSessionForm)}
          className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          {showSessionForm ? 'Cancel' : '+ Log Work'}
        </button>
        
        {project.current_milestone >= 6 && (
          <button
            onClick={() => setShowEntreForm(!showEntreForm)}
            className="bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            {showEntreForm ? 'Cancel' : '🚀 Log Entrepreneurial'}
          </button>
        )}
      </div>

      {/* Session Form */}
      {showSessionForm && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-dark-text">Log Research & Development Work</h3>
          
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
            placeholder="What did you do?"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            rows="2"
          />

          <input
            type="url"
            value={outputs}
            onChange={(e) => setOutputs(e.target.value)}
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

      {/* Entrepreneurial Form */}
      {showEntreForm && (
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800 space-y-3">
          <h3 className="font-medium text-purple-800 dark:text-purple-300">Log Entrepreneurial Activity</h3>
          
          <select
            value={activityType}
            onChange={(e) => {
              setActivityType(e.target.value)
              setOrganization('')
              setAmount('')
              setActivityLink('')
              setActivityNotes('')
            }}
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
          >
            <option value="">Select activity type</option>
            {activityTypes.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <input
            type="text"
            value={activityDesc}
            onChange={(e) => setActivityDesc(e.target.value)}
            placeholder="Brief description"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
          />

          {(activityType === 'letter_sent' || activityType === 'meeting_held' || 
            activityType === 'funding_received' || activityType === 'partnership_formed') && (
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Organization name"
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            />
          )}

          {activityType === 'funding_received' && (
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (in your currency)"
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            />
          )}

          {(activityType === 'letter_sent' || activityType === 'partnership_formed') && (
            <input
              type="url"
              value={activityLink}
              onChange={(e) => setActivityLink(e.target.value)}
              placeholder="Link to letter/partnership"
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            />
          )}

          <textarea
            value={activityNotes}
            onChange={(e) => setActivityNotes(e.target.value)}
            placeholder="Additional notes"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            rows="2"
          />

          <button
            onClick={logEntrepreneurial}
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
          >
            Save Activity
          </button>
        </div>
      )}

      {/* Entrepreneurial Activities Section */}
      {entrepreneurial.length > 0 && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border">
          <h3 className="font-medium text-gray-900 dark:text-dark-text mb-3">🚀 Entrepreneurial Activities</h3>
          <div className="space-y-2">
            {entrepreneurial.map(act => (
              <div key={act.id} className="bg-white dark:bg-dark-bg p-3 rounded border border-gray-200 dark:border-dark-border">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getActivityIcon(act.activity_type)}</span>
                    <div>
                      <span className="font-medium text-sm text-gray-900 dark:text-dark-text">
                        {activityTypes.find(a => a.id === act.activity_type)?.name || act.activity_type}
                      </span>
                      {act.organization && (
                        <span className="text-sm text-gray-600 dark:text-dark-text-muted ml-2">- {act.organization}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-600">
                    {new Date(act.date).toLocaleDateString()}
                  </span>
                </div>
                
                {act.description && (
                  <p className="text-sm text-gray-700 dark:text-dark-text-muted mt-2">{act.description}</p>
                )}
                
                {act.amount && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                    Amount: {act.amount}
                  </p>
                )}
                
                {act.link && (
                  <a href={act.link} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 dark:text-blue-400 text-xs mt-1 block hover:underline">
                    View →
                  </a>
                )}
                
                {act.notes && (
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1 italic">{act.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Sessions History */}
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
                {session.outputs?.link && (
                  <a href={session.outputs.link} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 dark:text-blue-400 text-xs mt-1 block hover:underline">
                    View outputs →
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