import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Profile({ profile, onUpdate }) {
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [newUsername, setNewUsername] = useState(profile.username)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSnapshots()
  }, [])

  async function fetchSnapshots() {
    setLoading(true)
    const { data, error } = await supabase
      .from('lc_snapshots')
      .select('*')
      .eq('user_id', profile.id)
      .order('snapped_at', { ascending: false })
      .limit(20)

    if (!error) setSnapshots(data)
    setLoading(false)
  }

  function startEdit() {
    setNewUsername(profile.username)
    setSaveError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setSaveError(null)
  }

  async function saveUsername() {
    const name = newUsername.trim()
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
      setSaveError('3–20 characters, letters / numbers / underscores only.')
      return
    }
    if (name === profile.username) {
      setEditing(false)
      return
    }
    setSaving(true)
    setSaveError(null)

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('username', name)
      .neq('id', profile.id)
      .limit(1)

    if (existing?.length > 0) {
      setSaveError('That username is already taken.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('users')
      .update({ username: name })
      .eq('id', profile.id)

    if (error) {
      setSaveError(error.message)
    } else {
      setEditing(false)
      onUpdate()
    }
    setSaving(false)
  }

  const latest = snapshots[0]
  const initials = profile.username?.slice(0, 2).toUpperCase()

  return (
    <div style={{ maxWidth: '700px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          width: '56px', height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fc4c02, #ffb347)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Syne', fontSize: '1.1rem', fontWeight: 800,
          flexShrink: 0
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: '#fc4c02', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Profile
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  autoFocus
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveUsername(); if (e.key === 'Escape') cancelEdit() }}
                  maxLength={20}
                  style={{
                    background: '#0e0f11',
                    border: '1px solid #fc4c02',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#e8eaed',
                    fontFamily: 'Syne',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    outline: 'none',
                    width: '200px'
                  }}
                />
                <button
                  onClick={saveUsername}
                  disabled={saving}
                  style={{
                    background: '#fc4c02',
                    border: 'none',
                    borderRadius: '7px',
                    padding: '6px 14px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'DM Sans, sans-serif'
                  }}
                >
                  {saving ? '...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    background: 'none',
                    border: '1px solid #2a2d35',
                    borderRadius: '7px',
                    padding: '6px 14px',
                    color: '#6b7280',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif'
                  }}
                >
                  Cancel
                </button>
              </div>
              {saveError && (
                <div style={{ fontSize: '0.75rem', color: '#ef4444', fontFamily: 'DM Mono' }}>
                  {saveError}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {profile.username}
              </div>
              <button
                onClick={startEdit}
                style={{
                  background: 'none',
                  border: '1px solid #2a2d35',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: '#6b7280',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontFamily: 'DM Mono',
                  letterSpacing: '0.03em'
                }}
              >
                edit
              </button>
            </div>
          )}

          <a
            href={`https://leetcode.com/${profile.leetcode_username}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#6b7280', fontSize: '0.8rem', fontFamily: 'DM Mono', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}
          >
            leetcode.com/{profile.leetcode_username} ↗
          </a>
        </div>
      </div>

      {/* All-time stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
        <StatCard label="Total Solved" value={latest?.total || 0} color="#e8eaed" />
        <StatCard label="Easy" value={latest?.easy || 0} color="#3ddc84" />
        <StatCard label="Medium" value={latest?.medium || 0} color="#ffb347" />
        <StatCard label="Hard" value={latest?.hard || 0} color="#ef4444" />
      </div>

      {/* Snapshot history */}
      <div style={{ fontFamily: 'Syne', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
        Snapshot History
      </div>
      <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{
          padding: '12px 20px',
          background: '#1e2128',
          fontFamily: 'DM Mono',
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#6b7280',
          display: 'grid',
          gridTemplateColumns: '1fr 80px 80px 80px 80px'
        }}>
          <div>Snapshot</div>
          <div style={{ textAlign: 'center' }}>Easy</div>
          <div style={{ textAlign: 'center' }}>Medium</div>
          <div style={{ textAlign: 'center' }}>Hard</div>
          <div style={{ textAlign: 'right' }}>Total</div>
        </div>

        {loading ? (
          <div style={{ padding: '20px', color: '#6b7280', fontSize: '0.875rem' }}>Loading...</div>
        ) : snapshots.length === 0 ? (
          <div style={{ padding: '24px 20px', color: '#6b7280', fontSize: '0.875rem' }}>
            No snapshots yet — your stats will appear here once the first sync runs.
          </div>
        ) : (
          snapshots.map((snap, index) => (
            <div key={snap.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 80px 80px 80px',
              padding: '12px 20px',
              borderBottom: index === snapshots.length - 1 ? 'none' : '1px solid #2a2d35',
              fontSize: '0.875rem'
            }}>
              <div style={{ color: '#6b7280', fontFamily: 'DM Mono', fontSize: '0.75rem' }}>
                {new Date(snap.snapped_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
              <div style={{ textAlign: 'center', color: '#3ddc84', fontFamily: 'DM Mono' }}>{snap.easy}</div>
              <div style={{ textAlign: 'center', color: '#ffb347', fontFamily: 'DM Mono' }}>{snap.medium}</div>
              <div style={{ textAlign: 'center', color: '#ef4444', fontFamily: 'DM Mono' }}>{snap.hard}</div>
              <div style={{ textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 600 }}>{snap.total}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#16181c',
      border: '1px solid #2a2d35',
      borderRadius: '12px',
      padding: '20px'
    }}>
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Syne', fontSize: '1.9rem', fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}
