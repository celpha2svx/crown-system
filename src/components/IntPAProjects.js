import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function IntPAProjects({ session }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  
  const navigate = useNavigate()

  const milestones = [
    '1. Topic defined',
    '2. Research done',
    '3. Question formed',
    '4. Experiment designed',
    '5. Implementation started',
    '6. Results obtained',
    '7. Analysis complete',
    '8. Paper drafted',
    '9. Code pushed',
    '10. Deployed',
    '11. Published'
  ]

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('int_pa_projects')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createNewProject() {
    if (!newProjectName.trim()) {
      alert('Project name is required')
      return
    }

    try {
      const { data, error } = await supabase
        .from('int_pa_projects')
        .insert([
          {
            user_id: session.user.id,
            name: newProjectName,
            description: newProjectDesc,
            current_milestone: 1,
            status: 'active'
          }
        ])
        .select()
        .single()

      if (error) throw error

      setProjects([data, ...projects])
      setNewProjectName('')
      setNewProjectDesc('')
      setShowNewForm(false)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    }
  }

  async function updateProjectStatus(projectId, newStatus) {
    try {
      const { error } = await supabase
        .from('int_pa_projects')
        .update({ status: newStatus })
        .eq('id', projectId)

      if (error) throw error

      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, status: newStatus } : p
      ))
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': 
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200 dark:border-green-800'
      case 'paused': 
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800'
      case 'archived': 
        return 'bg-gray-100 dark:bg-dark-border text-gray-800 dark:text-dark-text-muted border-gray-200 dark:border-dark-border'
      default: 
        return 'bg-gray-100 dark:bg-dark-border text-gray-800 dark:text-dark-text-muted'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">INT_PA Projects</h2>
        <button
          onClick={() => setShowNewForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          + New Project
        </button>
      </div>

      {/* New Project Form */}
      {showNewForm && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-dark-text">Create New Project</h3>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name (e.g., Linear Algebra for Data Science)"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            autoFocus
          />
          <textarea
            value={newProjectDesc}
            onChange={(e) => setNewProjectDesc(e.target.value)}
            placeholder="Brief description (optional)"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            rows="2"
          />
          <div className="flex gap-2">
            <button
              onClick={createNewProject}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewForm(false)
                setNewProjectName('')
                setNewProjectDesc('')
              }}
              className="bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text px-4 py-2 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg">
          <p className="mb-2">No projects yet</p>
          <p className="text-sm">Click "New Project" to start your first paper</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <div
              key={project.id}
              className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:shadow-md transition"
            >
              {/* Project Header */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-lg text-gray-900 dark:text-dark-text">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-dark-text-muted">{project.description}</p>
                  )}
                </div>
                <select
                  value={project.status}
                  onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(project.status)}`}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 dark:text-dark-text-muted mb-1">
                  <span>Progress</span>
                  <span>{project.current_milestone}/11</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2">
                  <div
                    className="bg-blue-600 rounded-full h-2"
                    style={{ width: `${(project.current_milestone / 11) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Milestone */}
              <div className="text-sm mb-3">
                <span className="text-gray-500 dark:text-dark-text-muted">Current: </span>
                <span className="font-medium text-gray-900 dark:text-dark-text">{milestones[project.current_milestone - 1]}</span>
              </div>

              {/* Last Worked */}
              {project.last_worked_on && (
                <div className="text-xs text-gray-400 dark:text-gray-600">
                  Last worked: {new Date(project.last_worked_on).toLocaleDateString()}
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => navigate(`/int-pa/${project.id}`)}
                className="mt-3 w-full bg-gray-50 dark:bg-dark-border hover:bg-gray-100 dark:hover:bg-gray-700 py-2 rounded text-sm border border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text transition"
              >
                Continue Working
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}