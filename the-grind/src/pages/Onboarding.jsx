import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Onboarding({ session, onComplete }) {
  const [displayName, setDisplayName] = useState('')
  const [leetcodeUsername, setLeetcodeUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const name = displayName.trim()
    const lc = leetcodeUsername.trim()

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
      setError('Display name must be 3–20 characters and only contain letters, numbers, or underscores.')
      return
    }

    setLoading(true)

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('username', name)
      .limit(1)

    if (existing?.length > 0) {
      setError('That username is already taken.')
      setLoading(false)
      return
    }

    const valid = await validateLeetCodeUsername(lc)
    if (!valid) {
      setError(`"${lc}" doesn't look like a valid LeetCode username. Double-check it and try again.`)
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('users')
      .insert({
        id: session.user.id,
        username: name,
        leetcode_username: lc
      })

    if (error) {
      setError(error.message)
    } else {
      onComplete(session.user.id)
    }
    setLoading(false)
  }

  const canSubmit = displayName.trim().length >= 3 && leetcodeUsername.trim().length >= 1

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.4rem', color: '#fc4c02' }}>
            ⚡ The Grind
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
            Set up your account
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
            Pick a display name for The Grind, then link your LeetCode account to start tracking.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Display name</label>
            <input
              type="text"
              placeholder="e.g. dalton"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              autoFocus
              maxLength={20}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#fc4c02')}
              onBlur={e => (e.target.style.borderColor = '#2a2d35')}
            />
            <div style={{ fontSize: '0.72rem', color: '#4b5563', fontFamily: 'DM Mono' }}>
              This is what friends see on the leaderboard. Letters, numbers, underscores only.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>LeetCode username</label>
            <input
              type="text"
              placeholder="e.g. neal_wu"
              value={leetcodeUsername}
              onChange={e => setLeetcodeUsername(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#fc4c02')}
              onBlur={e => (e.target.style.borderColor = '#2a2d35')}
            />
            <div style={{ fontSize: '0.72rem', color: '#4b5563', fontFamily: 'DM Mono' }}>
              Used to sync your solved problems. Must be your exact LeetCode handle.
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#ef4444',
              fontSize: '0.8rem',
              lineHeight: 1.5
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            style={{
              background: (loading || !canSubmit) ? '#1e2128' : '#fc4c02',
              color: (loading || !canSubmit) ? '#6b7280' : '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: (loading || !canSubmit) ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'background 0.15s'
            }}
          >
            {loading ? 'Checking LeetCode...' : 'Start grinding →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4b5563',
              fontSize: '0.75rem',
              fontFamily: 'DM Sans, sans-serif'
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

async function validateLeetCodeUsername(username) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) { username }
    }
  `
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username } })
    })
    const data = await res.json()
    return data?.data?.matchedUser !== null
  } catch {
    return true
  }
}

const outerStyle = {
  minHeight: '100vh',
  background: '#0e0f11',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px'
}

const cardStyle = {
  width: '100%',
  maxWidth: '440px',
  background: '#16181c',
  border: '1px solid #2a2d35',
  borderRadius: '16px',
  padding: '36px 32px'
}

const inputStyle = {
  width: '100%',
  background: '#0e0f11',
  border: '1px solid #2a2d35',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#e8eaed',
  fontSize: '0.875rem',
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box'
}

const labelStyle = {
  fontSize: '0.75rem',
  fontFamily: 'DM Mono',
  color: '#9ca3af',
  letterSpacing: '0.04em'
}
