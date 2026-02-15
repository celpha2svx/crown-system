import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import EveningReflection from './EveningReflection'
import { canPrayerBeChecked, getPrayerTimes } from '../utils/PrayerTimes'

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [todayLog, setTodayLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState({
    int_pa: [],
    int_ac: []
  })
  const [unfinishedArticles, setUnfinishedArticles] = useState(0)
  const [weeklyStats, setWeeklyStats] = useState(null)
  const [prayerTimes, setPrayerTimes] = useState({})

  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  const isSunday = dayOfWeek === 0

  // Schedule mapping (based on your original)
  const schedule = {
    1: { main: 'INT_AC', art: 'Writing' },      // Monday
    2: { main: 'TRUTH_AC', art: 'Drawing' },    // Tuesday
    3: { main: 'INT_PA', art: 'Chess' },        // Wednesday
    4: { main: 'INT_AC', art: 'Writing' },      // Thursday
    5: { main: 'TRUTH_AC', art: 'Drawing' },    // Friday
    6: { main: 'INT_PA', art: 'Sports' },       // Saturday
    0: { main: 'Reflection', art: 'Music' }     // Sunday
  }

  const todaySchedule = schedule[dayOfWeek]

  // All absolutes list for display
  const absolutes = [
    { id: 'fajr', name: 'Fajr', icon: '🌅', field: 'prayer_fajr' },
    { id: 'dhuhr', name: 'Dhuhr', icon: '☀️', field: 'prayer_dhuhr' },
    { id: 'asr', name: 'Asr', icon: '🌤️', field: 'prayer_asr' },
    { id: 'maghrib', name: 'Maghrib', icon: '🌆', field: 'prayer_maghrib' },
    { id: 'isha', name: 'Isha', icon: '🌙', field: 'prayer_isha' },
    { id: 'morning_hygiene', name: 'Morning Hygiene', icon: '🧼', field: 'hygiene_morning' },
    { id: 'evening_hygiene', name: 'Evening Hygiene', icon: '🚿', field: 'hygiene_evening' },
    { id: 'environment', name: 'Clean Space', icon: '🏠', field: 'environment_clean' },
    { id: 'exercise', name: 'Exercise', icon: '💪', field: 'exercise_done' },
    { id: 'reading', name: 'Daily Reading', icon: '📚', field: 'reading_done' },
    { id: 'languages', name: 'Language Practice', icon: '🗣️', field: 'languages_done' }
  ]

  useEffect(() => {
    loadDashboardData()
    
    // Get prayer times for display
    const times = getPrayerTimes(new Date())
    setPrayerTimes(times)
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      
      // Get today's log
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const { data: logData, error: logError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', todayStr)
        .single()

      if (logError && logError.code !== 'PGRST116') throw logError
      
      if (logData) {
        setTodayLog(logData)
      } else {
        // Create today's log if doesn't exist
        const { data: newLog, error: insertError } = await supabase
          .from('daily_logs')
          .insert([{ user_id: session.user.id, date: todayStr }])
          .select()
          .single()
        
        if (insertError) throw insertError
        setTodayLog(newLog)
      }

      // Load active projects
      const [intPaData, intAcData] = await Promise.all([
        supabase.from('int_pa_projects').select('*').eq('user_id', session.user.id).eq('status', 'active'),
        supabase.from('int_ac_projects').select('*').eq('user_id', session.user.id).eq('status', 'active')
      ])

      setProjects({
        int_pa: intPaData.data || [],
        int_ac: intAcData.data || []
      })

      // Load unfinished TRUTH_AC articles
      const { data: articles, error: articlesError } = await supabase
        .from('truth_ac_articles')
        .select('*')
        .eq('user_id', session.user.id)

      if (!articlesError) {
        const unfinished = articles.filter(a => 
          !a.full_article || !a.key_insight || a.full_article === '' || a.key_insight === ''
        ).length
        setUnfinishedArticles(unfinished)
      }

      // If Sunday, load weekly stats
      if (isSunday) {
        await loadWeeklyStats()
      }

    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadWeeklyStats() {
    try {
      const weekStart = startOfWeek(today, { weekStartsOn: 0 }) // Sunday
      const weekEnd = endOfWeek(today, { weekStartsOn: 0 }) // Saturday
      
      const { data: weekLogs, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))

      if (error) throw error

      if (weekLogs && weekLogs.length > 0) {
        // Calculate stats
        const totalPrayers = weekLogs.reduce((sum, day) => {
          return sum + [day.prayer_fajr, day.prayer_dhuhr, day.prayer_asr, 
                       day.prayer_maghrib, day.prayer_isha].filter(Boolean).length
        }, 0)

        const totalHygiene = weekLogs.reduce((sum, day) => {
          return sum + (day.hygiene_morning ? 1 : 0) + (day.hygiene_evening ? 1 : 0)
        }, 0)

        const readingDays = weekLogs.filter(d => d.reading_done).length
        const exerciseDays = weekLogs.filter(d => d.exercise_done).length
        const languageDays = weekLogs.filter(d => d.languages_done).length
        const environmentDays = weekLogs.filter(d => d.environment_clean).length

        // Get INT_PA progress
        const { data: intPaSessions } = await supabase
          .from('int_pa_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('date', weekStart.toISOString())
          .lte('date', weekEnd.toISOString())

        // Get INT_AC entrepreneurial activities
        const { data: intAcEntre } = await supabase
          .from('int_ac_entrepreneurial')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('date', weekStart.toISOString())
          .lte('date', weekEnd.toISOString())

        // Get new TRUTH_AC articles
        const { data: newArticles } = await supabase
          .from('truth_ac_articles')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('created_at', weekStart.toISOString())

        // Get new art
        const [newDrawings, newPoems] = await Promise.all([
          supabase.from('art_drawings').select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .gte('created_at', weekStart.toISOString()),
          supabase.from('art_poems').select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .gte('created_at', weekStart.toISOString())
        ])

        // Get sports
        const { data: sports } = await supabase
          .from('sports_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('date', weekStart.toISOString())

        setWeeklyStats({
          prayers: { done: totalPrayers, total: weekLogs.length * 5 },
          hygiene: { done: totalHygiene, total: weekLogs.length * 2 },
          reading: { done: readingDays, total: weekLogs.length },
          exercise: { done: exerciseDays, total: weekLogs.length },
          languages: { done: languageDays, total: weekLogs.length },
          environment: { done: environmentDays, total: weekLogs.length },
          intPaSessions: intPaSessions?.length || 0,
          intAcEntre: intAcEntre?.length || 0,
          newArticles: newArticles?.length || 0,
          newArt: (newDrawings.count || 0) + (newPoems.count || 0),
          sports: sports?.length || 0
        })
      }
    } catch (error) {
      console.error('Error loading weekly stats:', error)
    }
  }

  async function toggleAbsolute(field) {
    if (!todayLog) return

    // Check time restrictions for prayers
    if (field.startsWith('prayer_')) {
      const prayerId = field.replace('prayer_', '')
      if (!canPrayerBeChecked(prayerId) && !todayLog.travel_mode_active) {
        const times = getPrayerTimes(new Date())
        const prayerTime = times[prayerId]
        alert(`You can only check ${prayerId} between ${prayerTime.toLocaleTimeString()} and 2 hours after`)
        return
      }
    }

    // Check morning hygiene (available Fajr - 12pm)
    if (field === 'hygiene_morning') {
      const now = new Date()
      const prayerTimes = getPrayerTimes(now)
      const morningStart = prayerTimes.fajr
      const morningEnd = new Date(now)
      morningEnd.setHours(11, 59, 0, 0)
      
      if ((now < morningStart || now > morningEnd) && !todayLog.travel_mode_active) {
        alert(`Morning hygiene can only be checked between ${morningStart.toLocaleTimeString()} and 12:00 PM`)
        return
      }
    }

    // Check evening hygiene (available Maghrib - 2 hours after Isha)
    if (field === 'hygiene_evening') {
      const now = new Date()
      const prayerTimes = getPrayerTimes(now)
      const eveningStart = prayerTimes.maghrib
      const eveningEnd = new Date(prayerTimes.isha.getTime() + (2 * 60 * 60 * 1000))
      
      if ((now < eveningStart || now > eveningEnd) && !todayLog.travel_mode_active) {
        alert(`Evening hygiene can only be checked between ${eveningStart.toLocaleTimeString()} and ${eveningEnd.toLocaleTimeString()}`)
        return
      }
    }

    const newValue = !todayLog[field]
    const timeField = field.includes('prayer') ? `${field}_time` : null
    
    const updates = {
      [field]: newValue,
      ...(timeField && { [timeField]: newValue ? new Date().toISOString() : null })
    }

    try {
      const { error } = await supabase
        .from('daily_logs')
        .update(updates)
        .eq('id', todayLog.id)

      if (error) throw error
      setTodayLog({ ...todayLog, ...updates })
    } catch (error) {
      console.error('Error updating:', error)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const pendingAbsolutes = absolutes.filter(a => !todayLog?.[a.field])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-dark-text-muted">Loading your mission...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
          {getGreeting()}, Sir.
        </h1>
        <p className="text-gray-600 dark:text-dark-text-muted">
          {format(today, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Today's Mission */}
      <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-3">Today's Mission</h2>
        
        {/* Pending Absolutes */}
        {pendingAbsolutes.length > 0 ? (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-muted mb-2">
              ⏳ Pending ({pendingAbsolutes.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {pendingAbsolutes.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleAbsolute(item.field)}
                  className="flex items-center gap-2 p-2 bg-white dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border transition text-left"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <span className="text-sm text-gray-900 dark:text-dark-text block">{item.name}</span>
                    {item.field.startsWith('prayer_') && prayerTimes[item.field.replace('prayer_', '')] && (
                      <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                        {prayerTimes[item.field.replace('prayer_', '')].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 dark:text-gray-600">□</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
            ✨ All absolutes complete! Great job.
          </div>
        )}

        {/* Complete All Button */}
        <button
          onClick={() => navigate('/daily')}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition mb-4"
        >
          Complete All → Open Daily Log
        </button>

        <div className="border-t border-gray-200 dark:border-dark-border my-4" />

        {/* Today's Focus */}
        {!isSunday ? (
          <>
            <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-muted mb-2">
              🎯 FOCUS: {todaySchedule.main}
            </h3>
            
            {/* INT_PA Focus */}
            {todaySchedule.main === 'INT_PA' && projects.int_pa[0] && (
              <div className="bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-dark-border mb-3">
                <div className="font-medium text-gray-900 dark:text-dark-text">{projects.int_pa[0].name}</div>
                <div className="text-xs text-gray-500 dark:text-dark-text-muted mb-2">
                  Milestone {projects.int_pa[0].current_milestone}/11
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 rounded-full h-2"
                    style={{ width: `${(projects.int_pa[0].current_milestone / 11) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => navigate(`/int-pa/${projects.int_pa[0].id}`)}
                  className="w-full bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text py-2 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Begin Work
                </button>
              </div>
            )}

            {/* INT_AC Focus */}
            {todaySchedule.main === 'INT_AC' && projects.int_ac[0] && (
              <div className="bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-dark-border mb-3">
                <div className="font-medium text-gray-900 dark:text-dark-text">{projects.int_ac[0].name}</div>
                <div className="text-xs text-gray-500 dark:text-dark-text-muted mb-2">
                  {projects.int_ac[0].sector} • Milestone {projects.int_ac[0].current_milestone}/11
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 rounded-full h-2"
                    style={{ width: `${(projects.int_ac[0].current_milestone / 11) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => navigate(`/int-ac/${projects.int_ac[0].id}`)}
                  className="w-full bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text py-2 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Begin Work
                </button>
              </div>
            )}

            {/* TRUTH_AC Focus */}
            {todaySchedule.main === 'TRUTH_AC' && (
              <div className="bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-dark-border mb-3">
                <div className="font-medium text-gray-900 dark:text-dark-text">Domain Exploration</div>
                <div className="text-xs text-gray-500 dark:text-dark-text-muted mb-2">
                  {unfinishedArticles} unfinished articles
                </div>
                <button
                  onClick={() => navigate('/truth-ac')}
                  className="w-full bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text py-2 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Open Truth Library
                </button>
              </div>
            )}

            {/* Creative Touch */}
            <div className="text-sm text-gray-600 dark:text-dark-text-muted italic">
              🎨 Creative: {todaySchedule.art}
            </div>
          </>
        ) : (
          /* Sunday Special - Reflection */
          <>
            <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-muted mb-2">
              🧘 REFLECTION DAY
            </h3>
            <div className="bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-dark-border mb-3">
              <p className="text-sm text-gray-900 dark:text-dark-text mb-2">
                Review your week, plan ahead, and make music.
              </p>
              <button
                onClick={() => {
                  const modal = document.getElementById('reflection-modal')
                  if (modal) {
                    modal.showModal()
                  }
                }}
                className="w-full bg-purple-600 text-white py-2 rounded text-sm hover:bg-purple-700 transition"
              >
                Begin Weekly Reflection
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sunday Weekly Review */}
      {isSunday && weeklyStats && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-3">Last Week Review</h2>
          
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white dark:bg-dark-bg p-2 rounded">
                <span className="text-gray-500 dark:text-dark-text-muted">Prayer:</span>
                <span className="float-right font-medium text-gray-900 dark:text-dark-text">
                  {weeklyStats.prayers.done}/{weeklyStats.prayers.total}
                </span>
              </div>
              <div className="bg-white dark:bg-dark-bg p-2 rounded">
                <span className="text-gray-500 dark:text-dark-text-muted">Hygiene:</span>
                <span className="float-right font-medium text-gray-900 dark:text-dark-text">
                  {weeklyStats.hygiene.done}/{weeklyStats.hygiene.total}
                </span>
              </div>
              <div className="bg-white dark:bg-dark-bg p-2 rounded">
                <span className="text-gray-500 dark:text-dark-text-muted">Reading:</span>
                <span className="float-right font-medium text-gray-900 dark:text-dark-text">
                  {weeklyStats.reading.done}/{weeklyStats.reading.total}
                </span>
              </div>
              <div className="bg-white dark:bg-dark-bg p-2 rounded">
                <span className="text-gray-500 dark:text-dark-text-muted">Exercise:</span>
                <span className="float-right font-medium text-gray-900 dark:text-dark-text">
                  {weeklyStats.exercise.done}/{weeklyStats.exercise.total}
                </span>
              </div>
              <div className="bg-white dark:bg-dark-bg p-2 rounded">
                <span className="text-gray-500 dark:text-dark-text-muted">Languages:</span>
                <span className="float-right font-medium text-gray-900 dark:text-dark-text">
                  {weeklyStats.languages.done}/{weeklyStats.languages.total}
                </span>
              </div>
              <div className="bg-white dark:bg-dark-bg p-2 rounded">
                <span className="text-gray-500 dark:text-dark-text-muted">Environment:</span>
                <span className="float-right font-medium text-gray-900 dark:text-dark-text">
                  {weeklyStats.environment.done}/{weeklyStats.environment.total}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-dark-border pt-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white dark:bg-dark-bg p-2 rounded">
                  <span className="text-gray-500 dark:text-dark-text-muted">INT_PA sessions:</span>
                  <span className="float-right font-medium text-gray-900 dark:text-dark-text">
                    {weeklyStats.intPaSessions}
                  </span>
                </div>
                <div className="bg-white dark:bg-dark-bg p-2 rounded">
                  <span className="text-gray-500 dark:text-dark-text-muted">INT_AC activities:</span>
                  <span className="float-right font-medium text-gray-900 dark:text-dark-text">
                    {weeklyStats.intAcEntre}
                  </span>
                </div>
                <div className="bg-white dark:bg-dark-bg p-2 rounded">
                  <span className="text-gray-500 dark:text-dark-text-muted">New articles:</span>
                  <span className="float-right font-medium text-gray-900 dark:text-dark-text">
                    {weeklyStats.newArticles}
                  </span>
                </div>
                <div className="bg-white dark:bg-dark-bg p-2 rounded">
                  <span className="text-gray-500 dark:text-dark-text-muted">New art:</span>
                  <span className="float-right font-medium text-gray-900 dark:text-dark-text">
                    {weeklyStats.newArt}
                  </span>
                </div>
                <div className="bg-white dark:bg-dark-bg p-2 rounded col-span-2">
                  <span className="text-gray-500 dark:text-dark-text-muted">Sports activities:</span>
                  <span className="float-right font-medium text-gray-900 dark:text-dark-text">
                    {weeklyStats.sports}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Week Schedule */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-muted mb-2">Next Week Schedule</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white dark:bg-dark-bg p-2 rounded">Mon: INT_AC + Writing</div>
              <div className="bg-white dark:bg-dark-bg p-2 rounded">Tue: TRUTH_AC + Drawing</div>
              <div className="bg-white dark:bg-dark-bg p-2 rounded">Wed: INT_PA + Chess</div>
              <div className="bg-white dark:bg-dark-bg p-2 rounded">Thu: INT_AC + Writing</div>
              <div className="bg-white dark:bg-dark-bg p-2 rounded">Fri: TRUTH_AC + Drawing</div>
              <div className="bg-white dark:bg-dark-bg p-2 rounded">Sat: INT_PA + Sports</div>
              <div className="bg-white dark:bg-dark-bg p-2 rounded col-span-2">Sun: Music + Reflection</div>
            </div>
          </div>
        </div>
      )}

      {/* Reflection Modal */}
      {isSunday && todayLog && (
        <dialog 
          id="reflection-modal" 
          className="p-0 bg-transparent rounded-lg"
          onClose={() => {
            document.getElementById('reflection-modal')?.close()
            loadDashboardData()
          }}
        >
          <EveningReflection 
            todayLog={todayLog}
            setTodayLog={setTodayLog}
            onClose={() => {
              document.getElementById('reflection-modal')?.close()
              loadDashboardData()
            }}
          />
        </dialog>
      )}

      {/* Needs Attention */}
      {(projects.int_ac.some(p => {
        const lastWorked = p.last_worked_on ? new Date(p.last_worked_on) : new Date(0)
        const daysSince = (today - lastWorked) / (1000 * 60 * 60 * 24)
        return daysSince > 5 && p.status === 'active'
      }) || unfinishedArticles > 0) && (
        <div className="bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-3">Needs Attention</h2>
          
          {projects.int_ac.map(p => {
            const lastWorked = p.last_worked_on ? new Date(p.last_worked_on) : new Date(0)
            const daysSince = (today - lastWorked) / (1000 * 60 * 60 * 24)
            if (daysSince > 5 && p.status === 'active') {
              return (
                <div key={p.id} className="flex items-center justify-between mb-2 p-2 bg-white dark:bg-dark-bg rounded-lg">
                  <div>
                    <span className="text-red-500 mr-2">⚠️</span>
                    <span className="text-sm text-gray-900 dark:text-dark-text">{p.name}</span>
                    <span className="text-xs text-gray-500 dark:text-dark-text-muted ml-2">Stalled {Math.round(daysSince)} days</span>
                  </div>
                  <button
                    onClick={() => navigate(`/int-ac/${p.id}`)}
                    className="text-blue-600 dark:text-blue-400 text-sm"
                  >
                    Review
                  </button>
                </div>
              )
            }
            return null
          })}

          {unfinishedArticles > 0 && (
            <div className="flex items-center justify-between p-2 bg-white dark:bg-dark-bg rounded-lg">
              <div>
                <span className="text-yellow-500 mr-2">📝</span>
                <span className="text-sm text-gray-900 dark:text-dark-text">{unfinishedArticles} unfinished articles</span>
              </div>
              <button
                onClick={() => navigate('/truth-ac')}
                className="text-blue-600 dark:text-blue-400 text-sm"
              >
                Review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
