import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  searchJobs as apiSearchJobs,
  logApplication as apiLogApplication,
  getApplications as apiGetApplications,
  updateApplicationStatus as apiUpdateStatus,
  getJobFeed as apiGetJobFeed,
  getJobHistory as apiGetJobHistory
} from '../lib/api'

const STATUS = {
  applied:      { label: 'Applied',      color: '#4da6ff', bg: 'rgba(77,166,255,0.12)',  border: 'rgba(77,166,255,0.3)'  },
  interviewing: { label: 'Interviewing', color: '#ffb347', bg: 'rgba(255,179,71,0.12)',  border: 'rgba(255,179,71,0.3)'  },
  offer:        { label: 'Offer',        color: '#3ddc84', bg: 'rgba(61,220,132,0.12)',  border: 'rgba(61,220,132,0.3)'  },
  rejected:     { label: 'Rejected',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' }
}

const USER_COLORS = ['#fc4c02', '#4da6ff', '#a855f7', '#3ddc84', '#ffb347']

export default function Jobs({ profile }) {
  const [tab, setTab] = useState('browse')

  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [remote, setRemote] = useState(false)
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searched, setSearched] = useState(false)

  const [applications, setApplications] = useState([])
  const [loadingApps, setLoadingApps] = useState(true)

  const [feed, setFeed] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [graphData, setGraphData] = useState([])
  const [graphUsers, setGraphUsers] = useState([])
  const [graphRange, setGraphRange] = useState('month')
  const [loadingGraph, setLoadingGraph] = useState(true)

  const [logForm, setLogForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    fetchApplications()
    fetchFeed()
  }, [])

  useEffect(() => {
    fetchGraph()
  }, [graphRange])

  async function fetchApplications() {
    setLoadingApps(true)
    try { setApplications(await apiGetApplications(profile.id)) }
    catch (err) { console.error(err) }
    setLoadingApps(false)
  }

  async function fetchFeed() {
    setLoadingFeed(true)
    try { setFeed(await apiGetJobFeed(profile.id)) }
    catch (err) { console.error(err) }
    setLoadingFeed(false)
  }

  async function fetchGraph() {
    setLoadingGraph(true)
    try {
      const { applications: apps, users } = await apiGetJobHistory(profile.id, graphRange)
      setGraphUsers(users)
      setGraphData(buildGraphData(apps, users, graphRange))
    } catch (err) { console.error(err) }
    setLoadingGraph(false)
  }

  function buildGraphData(apps, users, range) {
    const days = range === 'week' ? 7 : 30
    const now = new Date()
    const dateMap = {}
    for (let i = days; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dateMap[key] = {}
      users.forEach(u => { dateMap[key][u.id] = 0 })
    }
    apps.forEach(app => {
      const key = new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (dateMap[key]?.[app.user_id] !== undefined) dateMap[key][app.user_id]++
    })
    const totals = {}
    users.forEach(u => { totals[u.id] = 0 })
    return Object.entries(dateMap).map(([date, counts]) => {
      const point = { date }
      users.forEach(u => { totals[u.id] += counts[u.id] || 0; point[u.id] = totals[u.id] })
      return point
    })
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    setSearched(true)
    try {
      const data = await apiSearchJobs(query, { location, remote })
      setResults(data)
      if (data.length === 0) setSearchError('No results found. Try a different search.')
    } catch (err) {
      setSearchError(err.response?.data?.error || 'Search failed. Make sure JSEARCH_API_KEY is set in your backend .env.')
    }
    setSearching(false)
  }

  function openLogForm(prefill = {}) {
    setLogForm({
      company: prefill.employer_name || '',
      role: prefill.job_title || '',
      url: prefill.job_apply_link || '',
      status: 'applied',
      notes: ''
    })
    setSaveError(null)
  }

  async function handleLogSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      await apiLogApplication(profile.id, logForm)
      setLogForm(null)
      fetchApplications()
      fetchFeed()
      fetchGraph()
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to log application.')
    }
    setSaving(false)
  }

  async function handleStatusChange(id, status) {
    try {
      await apiUpdateStatus(id, profile.id, status)
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    } catch (err) { console.error(err) }
  }

  const counts = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interviewing: applications.filter(a => a.status === 'interviewing').length,
    offer: applications.filter(a => a.status === 'offer').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  }

  return (
    <div style={{ maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: '#fc4c02', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
          Job Board
        </div>
        <div style={{ fontFamily: 'Syne', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Jobs
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#16181c', border: '1px solid #2a2d35', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[['browse', 'Browse'], ['applications', 'My Apps'], ['activity', 'Activity']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background: tab === key ? '#fc4c02' : 'transparent',
              border: 'none',
              borderRadius: '7px',
              padding: '7px 18px',
              color: tab === key ? '#fff' : '#6b7280',
              fontFamily: 'DM Mono',
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              cursor: 'pointer'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Browse ─────────────────────────────────────────────── */}
      {tab === 'browse' && (
        <div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Job title or keyword..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ ...inputStyle, flex: '1', minWidth: '200px' }}
              onFocus={e => (e.target.style.borderColor = '#fc4c02')}
              onBlur={e => (e.target.style.borderColor = '#2a2d35')}
            />
            <input
              type="text"
              placeholder="Location (optional)"
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={{ ...inputStyle, width: '180px' }}
              onFocus={e => (e.target.style.borderColor = '#fc4c02')}
              onBlur={e => (e.target.style.borderColor = '#2a2d35')}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#9ca3af', fontSize: '0.8rem', fontFamily: 'DM Mono', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={remote} onChange={e => setRemote(e.target.checked)} style={{ accentColor: '#fc4c02' }} />
              Remote only
            </label>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              style={{
                background: (searching || !query.trim()) ? '#1e2128' : '#fc4c02',
                color: (searching || !query.trim()) ? '#6b7280' : '#fff',
                border: 'none', borderRadius: '8px', padding: '10px 20px',
                fontWeight: 600, fontSize: '0.875rem',
                cursor: (searching || !query.trim()) ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif'
              }}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div style={{ marginBottom: '20px' }}>
            <button onClick={() => openLogForm()} style={ghostBtnStyle}>+ Log application manually</button>
          </div>

          {searchError && <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '16px' }}>{searchError}</div>}

          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.map(job => (
                <JobCard key={job.job_id} job={job} onLog={() => openLogForm(job)} />
              ))}
            </div>
          ) : !searched ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>Search for jobs</div>
              <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                Powered by JSearch — pulls from LinkedIn, Indeed, and Glassdoor.
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── My Apps ────────────────────────────────────────────── */}
      {tab === 'applications' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <MiniStat label="Total" value={counts.total} color="#e8eaed" />
            <MiniStat label="Applied" value={counts.applied} color={STATUS.applied.color} />
            <MiniStat label="Interviewing" value={counts.interviewing} color={STATUS.interviewing.color} />
            <MiniStat label="Offers" value={counts.offer} color={STATUS.offer.color} />
            <MiniStat label="Rejected" value={counts.rejected} color={STATUS.rejected.color} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => openLogForm()} style={{ ...ghostBtnStyle, borderColor: '#fc4c02', color: '#fc4c02' }}>
              + Log Application
            </button>
          </div>

          {loadingApps ? (
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</div>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>No applications yet</div>
              <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                Browse jobs and hit "Log", or use the button above to add one manually.
              </div>
            </div>
          ) : (
            <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 150px 110px',
                padding: '10px 20px', background: '#1e2128',
                fontFamily: 'DM Mono', fontSize: '0.65rem', letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#6b7280'
              }}>
                <div>Role · Company</div>
                <div>Status</div>
                <div>Applied</div>
              </div>
              {applications.map((app, i) => (
                <ApplicationRow
                  key={app.id}
                  app={app}
                  isLast={i === applications.length - 1}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Activity ────────────────────────────────────────────── */}
      {tab === 'activity' && (
        <div>
          {/* Graph */}
          <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', padding: '24px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '1.1rem', fontWeight: 700 }}>Applications Over Time</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['week', 'month'].map(r => (
                  <button
                    key={r}
                    onClick={() => setGraphRange(r)}
                    style={{
                      fontFamily: 'DM Mono', fontSize: '0.7rem', padding: '6px 14px', borderRadius: '20px',
                      border: graphRange === r ? 'none' : '1px solid #2a2d35',
                      background: graphRange === r ? '#fc4c02' : 'transparent',
                      color: graphRange === r ? 'white' : '#6b7280',
                      cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em'
                    }}
                  >
                    {r === 'week' ? '7D' : '30D'}
                  </button>
                ))}
              </div>
            </div>
            {loadingGraph ? (
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</div>
            ) : graphUsers.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '0.875rem', padding: '20px 0' }}>
                No application data yet — log your first application to see it here.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={graphData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="date" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} interval={graphRange === 'week' ? 0 : 4} />
                  <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e2128', border: '1px solid #2a2d35', borderRadius: '8px', fontFamily: 'DM Mono', fontSize: '0.75rem' }}
                    labelStyle={{ color: '#e8eaed', marginBottom: '4px' }}
                    formatter={(value, name) => {
                      const user = graphUsers.find(u => u.id === name)
                      return [value, user?.id === profile.id ? 'you' : (user?.username || name)]
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontFamily: 'DM Mono', fontSize: '0.7rem', paddingTop: '16px' }}
                    formatter={value => {
                      const user = graphUsers.find(u => u.id === value)
                      return user?.id === profile.id ? 'you' : user?.username
                    }}
                  />
                  {graphUsers.map((user, i) => (
                    <Line key={user.id} type="monotone" dataKey={user.id}
                      stroke={user.id === profile.id ? '#fc4c02' : USER_COLORS[i + 1]}
                      strokeWidth={2} dot={false} activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Feed */}
          <div style={{ fontFamily: 'Syne', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Recent Activity</div>
          {loadingFeed ? (
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</div>
          ) : feed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>No activity yet</div>
              <div style={{ fontSize: '0.8rem' }}>Friends' job applications will show up here once they start tracking.</div>
            </div>
          ) : (
            <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', overflow: 'hidden' }}>
              {feed.map((item, i) => (
                <FeedItem key={item.id} item={item} isMe={item.user_id === profile.id} isLast={i === feed.length - 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Log Application Modal ──────────────────────────────── */}
      {logForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setLogForm(null) }}
        >
          <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>Log Application</div>
            <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Company *">
                <input type="text" placeholder="Google" value={logForm.company} required
                  onChange={e => setLogForm(f => ({ ...f, company: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#fc4c02')}
                  onBlur={e => (e.target.style.borderColor = '#2a2d35')}
                />
              </Field>
              <Field label="Role *">
                <input type="text" placeholder="Software Engineer Intern" value={logForm.role} required
                  onChange={e => setLogForm(f => ({ ...f, role: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#fc4c02')}
                  onBlur={e => (e.target.style.borderColor = '#2a2d35')}
                />
              </Field>
              <Field label="Job posting URL">
                <input type="url" placeholder="https://..." value={logForm.url}
                  onChange={e => setLogForm(f => ({ ...f, url: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#fc4c02')}
                  onBlur={e => (e.target.style.borderColor = '#2a2d35')}
                />
              </Field>
              <Field label="Status">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(STATUS).map(([key, s]) => (
                    <button key={key} type="button" onClick={() => setLogForm(f => ({ ...f, status: key }))}
                      style={{
                        padding: '6px 14px', borderRadius: '20px',
                        border: `1px solid ${logForm.status === key ? s.color : '#2a2d35'}`,
                        background: logForm.status === key ? s.bg : 'transparent',
                        color: logForm.status === key ? s.color : '#6b7280',
                        fontSize: '0.75rem', fontFamily: 'DM Mono', cursor: 'pointer'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Notes">
                <textarea placeholder="Referral, recruiter name, etc." value={logForm.notes} rows={2}
                  onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => (e.target.style.borderColor = '#fc4c02')}
                  onBlur={e => (e.target.style.borderColor = '#2a2d35')}
                />
              </Field>
              {saveError && <div style={{ color: '#ef4444', fontSize: '0.8rem', fontFamily: 'DM Mono' }}>{saveError}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="submit" disabled={saving} style={{
                  flex: 1, background: saving ? '#1e2128' : '#fc4c02',
                  color: saving ? '#6b7280' : '#fff', border: 'none', borderRadius: '10px',
                  padding: '11px', fontWeight: 600, fontSize: '0.9rem',
                  cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif'
                }}>
                  {saving ? 'Saving...' : 'Log Application'}
                </button>
                <button type="button" onClick={() => setLogForm(null)} style={{
                  background: 'none', border: '1px solid #2a2d35', borderRadius: '10px',
                  padding: '11px 20px', color: '#6b7280', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function JobCard({ job, onLog }) {
  const location = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ')
  const posted = job.job_posted_at_datetime_utc
    ? new Date(job.job_posted_at_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.job_title}
        </div>
        <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontFamily: 'DM Mono', marginBottom: '10px' }}>
          {job.employer_name}{location ? ` · ${location}` : ''}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {job.job_is_remote && <Badge label="Remote" color="#3ddc84" />}
          {job.job_employment_type && <Badge label={job.job_employment_type.replace(/_/g, ' ')} color="#6b7280" />}
          {posted && <Badge label={posted} color="#6b7280" />}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        {job.job_apply_link && (
          <a href={job.job_apply_link} target="_blank" rel="noopener noreferrer" style={{
            display: 'block', textAlign: 'center', padding: '7px 16px', borderRadius: '7px',
            border: '1px solid #2a2d35', color: '#9ca3af', fontSize: '0.8rem', textDecoration: 'none',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            View ↗
          </a>
        )}
        <button onClick={onLog} style={{
          padding: '7px 16px', borderRadius: '7px', border: '1px solid #fc4c02',
          background: 'transparent', color: '#fc4c02', fontSize: '0.8rem', cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          Log
        </button>
      </div>
    </div>
  )
}

function ApplicationRow({ app, isLast, onStatusChange }) {
  const [open, setOpen] = useState(false)
  const s = STATUS[app.status] || STATUS.applied

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid #2a2d35' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 110px', alignItems: 'center', padding: '14px 20px' }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{app.role}</div>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
            {app.company}
            {app.url && <a href={app.url} target="_blank" rel="noopener noreferrer" style={{ color: '#4b5563', marginLeft: '8px', textDecoration: 'none' }}>↗</a>}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: '20px',
              padding: '4px 12px', color: s.color, fontSize: '0.72rem',
              fontFamily: 'DM Mono', cursor: 'pointer'
            }}
          >
            {s.label} ▾
          </button>
          {open && (
            <div style={{ position: 'absolute', top: '110%', left: 0, background: '#1e2128', border: '1px solid #2a2d35', borderRadius: '8px', zIndex: 10, overflow: 'hidden', minWidth: '140px' }}>
              {Object.entries(STATUS).map(([key, st]) => (
                <button key={key} onClick={() => { onStatusChange(app.id, key); setOpen(false) }}
                  style={{
                    display: 'block', width: '100%', padding: '8px 14px',
                    background: key === app.status ? 'rgba(252,76,2,0.08)' : 'transparent',
                    border: 'none', color: st.color, fontSize: '0.75rem',
                    fontFamily: 'DM Mono', cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.75rem', color: '#6b7280' }}>
          {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
  )
}

function FeedItem({ item, isMe, isLast }) {
  const s = STATUS[item.status] || STATUS.applied
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid #2a2d35' }}>
      <div style={{
        width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
        background: isMe ? 'linear-gradient(135deg, #fc4c02, #ffb347)' : 'linear-gradient(135deg, #6366f1, #4da6ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.65rem', fontWeight: 700, fontFamily: 'Syne'
      }}>
        {(item.users?.username || '?').slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.875rem', color: '#e8eaed' }}>
          <strong>{isMe ? 'You' : item.users?.username}</strong> applied to{' '}
          <span style={{ fontWeight: 500 }}>{item.role}</span>{' '}at{' '}
          <span style={{ color: '#fc4c02' }}>{item.company}</span>
        </div>
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.65rem', color: '#6b7280', marginTop: '3px', display: 'flex', gap: '10px' }}>
          <span style={{ color: s.color, background: s.bg, padding: '2px 7px', borderRadius: '20px' }}>{s.label}</span>
          <span>{new Date(item.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontFamily: 'Syne', fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

function Badge({ label, color }) {
  return (
    <span style={{ fontFamily: 'DM Mono', fontSize: '0.65rem', color, background: `${color}18`, border: `1px solid ${color}40`, padding: '2px 8px', borderRadius: '20px' }}>
      {label}
    </span>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.75rem', fontFamily: 'DM Mono', color: '#9ca3af', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', background: '#0e0f11', border: '1px solid #2a2d35', borderRadius: '8px',
  padding: '10px 14px', color: '#e8eaed', fontSize: '0.875rem',
  fontFamily: 'DM Sans, sans-serif', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box'
}

const ghostBtnStyle = {
  background: 'none', border: '1px solid #2a2d35', borderRadius: '8px',
  padding: '8px 14px', color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
}
