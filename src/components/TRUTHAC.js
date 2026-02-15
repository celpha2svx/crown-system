import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function TruthAC({ session }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  
  // Form state
  const [domain, setDomain] = useState('money')
  const [title, setTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [insight, setInsight] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])
  const [timeSpent, setTimeSpent] = useState('')

  const domains = [
    { id: 'money', name: 'Money', icon: '💰', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' },
    { id: 'technology', name: 'Technology', icon: '💻', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100' },
    { id: 'power', name: 'Power', icon: '⚡', color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100' },
    { id: 'belief', name: 'Belief', icon: '🕯️', color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100' },
    { id: 'knowledge', name: 'Knowledge', icon: '📚', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100' }
  ]

  useEffect(() => {
    loadArticles()
  }, [])

  async function loadArticles() {
    try {
      setLoading(true)
      let query = supabase
        .from('truth_ac_articles')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (selectedDomain !== 'all') {
        query = query.eq('domain', selectedDomain)
      }

      const { data, error } = await query

      if (error) throw error
      setArticles(data || [])
    } catch (error) {
      console.error('Error loading articles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [selectedDomain])

  function resetForm() {
    setDomain('money')
    setTitle('')
    setQuestion('')
    setInsight('')
    setContent('')
    setTags([])
    setTagInput('')
    setTimeSpent('')
    setEditingArticle(null)
  }

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  function removeTag(tagToRemove) {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  async function saveArticle() {
    if (!title.trim()) {
      alert('Title is required')
      return
    }

    try {
      const articleData = {
        user_id: session.user.id,
        domain,
        title,
        question_explored: question,
        key_insight: insight,
        full_article: content,
        tags: tags.length > 0 ? tags : null,
        time_spent: timeSpent ? parseInt(timeSpent) : null,
        last_edited: new Date().toISOString()
      }

      let error
      
      if (editingArticle) {
        ({ error } = await supabase
          .from('truth_ac_articles')
          .update(articleData)
          .eq('id', editingArticle.id))
      } else {
        ({ error } = await supabase
          .from('truth_ac_articles')
          .insert([articleData]))
      }

      if (error) throw error

      resetForm()
      setShowArticleForm(false)
      loadArticles()

    } catch (error) {
      console.error('Error saving article:', error)
      alert('Failed to save article')
    }
  }

  function editArticle(article) {
    setEditingArticle(article)
    setDomain(article.domain)
    setTitle(article.title)
    setQuestion(article.question_explored || '')
    setInsight(article.key_insight || '')
    setContent(article.full_article || '')
    setTags(article.tags || [])
    setTimeSpent(article.time_spent || '')
    setShowArticleForm(true)
  }

  async function deleteArticle(articleId) {
    if (!window.confirm('Delete this article?')) return

    try {
      const { error } = await supabase
        .from('truth_ac_articles')
        .delete()
        .eq('id', articleId)

      if (error) throw error
      loadArticles()
    } catch (error) {
      console.error('Error deleting article:', error)
    }
  }

  const getDomainCount = (domainId) => {
    return articles.filter(a => a.domain === domainId).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">Truth Library</h2>
        <button
          onClick={() => {
            resetForm()
            setShowArticleForm(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          + New Article
        </button>
      </div>

      {/* Domain Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedDomain('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedDomain === 'all'
              ? 'bg-gray-800 text-white dark:bg-gray-700'
              : 'bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-text-muted hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All ({articles.length})
        </button>
        {domains.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDomain(d.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1 ${
              selectedDomain === d.id
                ? d.color
                : 'bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-text-muted hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span>{d.icon}</span>
            <span>{d.name}</span>
            <span className="ml-1 text-xs">({getDomainCount(d.id)})</span>
          </button>
        ))}
      </div>

      {/* New/Edit Article Form */}
      {showArticleForm && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 space-y-4">
          <h3 className="font-medium text-lg text-gray-900 dark:text-dark-text">
            {editingArticle ? 'Edit Article' : 'New Article'}
          </h3>

          {/* Domain Selection */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-2">Domain</label>
            <div className="flex flex-wrap gap-2">
              {domains.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDomain(d.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    domain === d.id
                      ? d.color
                      : 'bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-dark-text-muted hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {d.icon} {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this article about?"
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              autoFocus
            />
          </div>

          {/* Question Explored */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-1">Question Explored</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What question were you exploring?"
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            />
          </div>

          {/* Key Insight */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-1">Key Insight</label>
            <textarea
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              placeholder="What did you discover?"
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              rows="2"
            />
          </div>

          {/* Full Article */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-1">Article Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article here..."
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted font-mono"
              rows="8"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-1">Tags (for connecting ideas)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add a tag and press Enter"
                className="flex-1 p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
              />
              <button
                onClick={addTag}
                className="bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time Spent */}
          <div>
            <label className="text-sm text-gray-600 dark:text-dark-text-muted block mb-1">Time Spent (minutes)</label>
            <input
              type="number"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              placeholder="Optional"
              className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={saveArticle}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              {editingArticle ? 'Update Article' : 'Save Article'}
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowArticleForm(false)
              }}
              className="flex-1 bg-gray-200 dark:bg-dark-border text-gray-900 dark:text-dark-text py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Articles List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted">Loading articles...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-dark-text-muted border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg">
          <p className="text-4xl mb-4">📝</p>
          <p className="mb-2">No articles yet</p>
          <p className="text-sm">Click "New Article" to start building your knowledge library</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map(article => {
            const domain = domains.find(d => d.id === article.domain)
            return (
              <div
                key={article.id}
                className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:shadow-md transition"
              >
                {/* Article Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{domain?.icon}</span>
                    <div>
                      <h3 className="font-medium text-lg text-gray-900 dark:text-dark-text">{article.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${domain?.color}`}>
                        {domain?.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editArticle(article)}
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteArticle(article.id)}
                      className="text-red-600 dark:text-red-400 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Question */}
                {article.question_explored && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-dark-text-muted italic">
                    "{article.question_explored}"
                  </div>
                )}

                {/* Key Insight */}
                {article.key_insight && (
                  <div className="mt-2 bg-gray-50 dark:bg-dark-bg p-3 rounded border border-gray-200 dark:border-dark-border">
                    <span className="text-xs text-gray-500 dark:text-dark-text-muted block mb-1">Key Insight:</span>
                    <p className="text-sm text-gray-900 dark:text-dark-text">{article.key_insight}</p>
                  </div>
                )}

                {/* Article Preview */}
                {article.full_article && (
                  <div className="mt-3 text-sm text-gray-700 dark:text-dark-text-muted line-clamp-3">
                    {article.full_article.substring(0, 200)}
                    {article.full_article.length > 200 && '...'}
                  </div>
                )}

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {article.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-dark-text-muted px-2 py-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="mt-3 text-xs text-gray-400 dark:text-gray-600 flex gap-3">
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  {article.time_spent && (
                    <span>{article.time_spent} min</span>
                  )}
                  {article.last_edited && article.last_edited !== article.created_at && (
                    <span>Edited</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}