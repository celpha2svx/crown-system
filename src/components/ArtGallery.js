import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ArtGallery({ session }) {
  const [activeTab, setActiveTab] = useState('drawings')
  const [drawings, setDrawings] = useState([])
  const [poems, setPoems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDrawingForm, setShowDrawingForm] = useState(false)
  const [showPoemForm, setShowPoemForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  
  // Drawing form state
  const [drawingTitle, setDrawingTitle] = useState('')
  const [drawingInspiration, setDrawingInspiration] = useState('')
  const [drawingFile, setDrawingFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Poem form state
  const [poemTitle, setPoemTitle] = useState('')
  const [poemText, setPoemText] = useState('')
  const [poemExplanation, setPoemExplanation] = useState('')

  useEffect(() => {
    loadDrawings()
    loadPoems()
  }, [])

  async function loadDrawings() {
    try {
      const { data, error } = await supabase
        .from('art_drawings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDrawings(data || [])
    } catch (error) {
      console.error('Error loading drawings:', error)
    }
  }

  async function loadPoems() {
    try {
      const { data, error } = await supabase
        .from('art_poems')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPoems(data || [])
    } catch (error) {
      console.error('Error loading poems:', error)
    } finally {
      setLoading(false)
    }
  }

  async function uploadDrawing() {
    if (!drawingTitle.trim()) {
      alert('Title is required')
      return
    }
    if (!drawingFile) {
      alert('Please select an image')
      return
    }

    try {
      setUploading(true)

      const fileExt = drawingFile.name.split('.').pop()
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('art-drawings')
        .upload(fileName, drawingFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('art-drawings')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('art_drawings')
        .insert([{
          user_id: session.user.id,
          title: drawingTitle,
          image_url: publicUrl,
          inspiration: drawingInspiration || null
        }])

      if (dbError) throw dbError

      setDrawingTitle('')
      setDrawingInspiration('')
      setDrawingFile(null)
      setShowDrawingForm(false)
      loadDrawings()

    } catch (error) {
      console.error('Error uploading drawing:', error)
      alert('Failed to upload drawing')
    } finally {
      setUploading(false)
    }
  }

  async function savePoem() {
    if (!poemTitle.trim()) {
      alert('Title is required')
      return
    }
    if (!poemText.trim()) {
      alert('Poem text is required')
      return
    }

    try {
      const { error } = await supabase
        .from('art_poems')
        .insert([{
          user_id: session.user.id,
          title: poemTitle,
          poem_text: poemText,
          explanation: poemExplanation || null
        }])

      if (error) throw error

      setPoemTitle('')
      setPoemText('')
      setPoemExplanation('')
      setShowPoemForm(false)
      loadPoems()

    } catch (error) {
      console.error('Error saving poem:', error)
      alert('Failed to save poem')
    }
  }

  async function deleteDrawing(id) {
    if (!window.confirm('Delete this drawing?')) return

    try {
      const { error } = await supabase
        .from('art_drawings')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadDrawings()
    } catch (error) {
      console.error('Error deleting drawing:', error)
    }
  }

  async function deletePoem(id) {
    if (!window.confirm('Delete this poem?')) return

    try {
      const { error } = await supabase
        .from('art_poems')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadPoems()
    } catch (error) {
      console.error('Error deleting poem:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">Art Gallery</h2>
        <div className="flex gap-2">
          {activeTab === 'drawings' && (
            <button
              onClick={() => setShowDrawingForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              + New Drawing
            </button>
          )}
          {activeTab === 'poems' && (
            <button
              onClick={() => setShowPoemForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition"
            >
              + New Poem
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-border">
        <button
          onClick={() => setActiveTab('drawings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'drawings'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text'
          }`}
        >
          🎨 Drawings ({drawings.length})
        </button>
        <button
          onClick={() => setActiveTab('poems')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'poems'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text'
          }`}
        >
          📝 Poems ({poems.length})
        </button>
      </div>

      {/* New Drawing Form */}
      {showDrawingForm && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-dark-text">Upload New Drawing</h3>
          
          <input
            type="text"
            value={drawingTitle}
            onChange={(e) => setDrawingTitle(e.target.value)}
            placeholder="Drawing title *"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            autoFocus
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setDrawingFile(e.target.files[0])}
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-200 dark:file:bg-dark-border file:text-gray-900 dark:file:text-dark-text hover:file:bg-gray-300 dark:hover:file:bg-gray-700"
          />

          <textarea
            value={drawingInspiration}
            onChange={(e) => setDrawingInspiration(e.target.value)}
            placeholder="What inspired this? (optional)"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            rows="2"
          />

          <div className="flex gap-3">
            <button
              onClick={uploadDrawing}
              disabled={uploading}
              className="flex-1 bg-blue-600 text-white py-2 rounded disabled:opacity-50 hover:bg-blue-700 transition"
            >
              {uploading ? 'Uploading...' : 'Upload Drawing'}
            </button>
            <button
              onClick={() => {
                setShowDrawingForm(false)
                setDrawingTitle('')
                setDrawingInspiration('')
                setDrawingFile(null)
              }}
              className="flex-1 bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* New Poem Form */}
      {showPoemForm && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-dark-text">Write New Poem</h3>
          
          <input
            type="text"
            value={poemTitle}
            onChange={(e) => setPoemTitle(e.target.value)}
            placeholder="Poem title *"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            autoFocus
          />

          <textarea
            value={poemText}
            onChange={(e) => setPoemText(e.target.value)}
            placeholder="Your poem... *"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted font-mono"
            rows="6"
          />

          <textarea
            value={poemExplanation}
            onChange={(e) => setPoemExplanation(e.target.value)}
            placeholder="Explanation or reflection (optional - leave blank for mystery)"
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            rows="2"
          />

          <div className="flex gap-3">
            <button
              onClick={savePoem}
              className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
            >
              Save Poem
            </button>
            <button
              onClick={() => {
                setShowPoemForm(false)
                setPoemTitle('')
                setPoemText('')
                setPoemExplanation('')
              }}
              className="flex-1 bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modal for viewing full item */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-border">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border flex justify-between items-center sticky top-0 bg-white dark:bg-dark-card">
              <h3 className="font-bold text-lg text-gray-900 dark:text-dark-text">{selectedItem.title}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-2xl hover:bg-gray-100 dark:hover:bg-dark-border w-8 h-8 rounded-full text-gray-900 dark:text-dark-text"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {selectedItem.type === 'drawing' ? (
                <img 
                  src={selectedItem.image_url} 
                  alt={selectedItem.title}
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="space-y-4">
                  <pre className="whitespace-pre-wrap font-serif text-lg text-gray-900 dark:text-dark-text">
                    {selectedItem.poem_text}
                  </pre>
                  {selectedItem.explanation && (
                    <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg border border-gray-200 dark:border-dark-border">
                      <p className="text-sm text-gray-600 dark:text-dark-text-muted italic">
                        "{selectedItem.explanation}"
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 text-sm text-gray-400 dark:text-gray-600">
                {new Date(selectedItem.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted">Loading...</div>
      ) : activeTab === 'drawings' ? (
        // Drawings Grid
        drawings.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-dark-text-muted border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg">
            <p className="text-4xl mb-4">🎨</p>
            <p className="mb-2">No drawings yet</p>
            <p className="text-sm">Click "New Drawing" to upload your art</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {drawings.map(drawing => (
              <div
                key={drawing.id}
                className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden hover:shadow-md transition"
              >
                <img
                  src={drawing.image_url}
                  alt={drawing.title}
                  className="w-full h-40 object-cover cursor-pointer"
                  onClick={() => setSelectedItem({ ...drawing, type: 'drawing' })}
                />
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-dark-text">{drawing.title}</h4>
                    <button
                      onClick={() => deleteDrawing(drawing.id)}
                      className="text-red-500 dark:text-red-400 text-xs hover:underline"
                    >
                      ✕
                    </button>
                  </div>
                  {drawing.inspiration && (
                    <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1 line-clamp-2">
                      {drawing.inspiration}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                    {new Date(drawing.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Poems List
        poems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-dark-text-muted border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg">
            <p className="text-4xl mb-4">📝</p>
            <p className="mb-2">No poems yet</p>
            <p className="text-sm">Click "New Poem" to write your first piece</p>
          </div>
        ) : (
          <div className="space-y-3">
            {poems.map(poem => (
              <div
                key={poem.id}
                className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => setSelectedItem({ ...poem, type: 'poem' })}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 dark:text-dark-text">{poem.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePoem(poem.id)
                    }}
                    className="text-red-500 dark:text-red-400 text-sm hover:underline"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-700 dark:text-dark-text-muted mt-2 line-clamp-2">
                  {poem.poem_text}
                </p>
                {poem.explanation ? (
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-2 italic">
                    {poem.explanation}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-2 italic">
                    ✦ mystery ✦
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                  {new Date(poem.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}