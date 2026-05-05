import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else if (!isLogin) {
      setSuccess(true)
    }
    setLoading(false)
  }

  function toggle() {
    setIsLogin(!isLogin)
    setError(null)
    setSuccess(false)
  }

  if (success) {
    return (
      <div style={outerStyle}>
        <div style={cardStyle}>
          <Logo />
          <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '14px' }}>📬</div>
            <div style={{ fontFamily: 'Syne', fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>
              Check your email
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.7 }}>
              We sent a confirmation link to<br />
              <span style={{ color: '#e8eaed' }}>{email}</span>
            </div>
          </div>
          <button onClick={toggle} style={linkBtnStyle}>
            ← Back to log in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <Logo />

        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {isLogin
              ? 'Log in to keep grinding.'
              : 'Join the grind and compete with friends.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#fc4c02')}
              onBlur={e => (e.target.style.borderColor = '#2a2d35')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ ...inputStyle, paddingRight: '52px' }}
                onFocus={e => (e.target.style.borderColor = '#fc4c02')}
                onBlur={e => (e.target.style.borderColor = '#2a2d35')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '0.7rem',
                  fontFamily: 'DM Mono',
                  padding: '4px',
                  letterSpacing: '0.03em'
                }}
              >
                {showPassword ? 'hide' : 'show'}
              </button>
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
            disabled={loading}
            style={{
              background: loading ? '#1e2128' : '#fc4c02',
              color: loading ? '#6b7280' : '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              marginTop: '2px',
              letterSpacing: '0.01em',
              transition: 'background 0.15s, opacity 0.15s'
            }}
            onMouseEnter={e => { if (!loading) e.target.style.opacity = '0.88' }}
            onMouseLeave={e => { e.target.style.opacity = '1' }}
          >
            {loading ? 'Loading...' : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <button onClick={toggle} style={linkBtnStyle}>
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
      <div style={{
        fontFamily: 'monospace',
        fontWeight: 800,
        fontSize: '1.4rem',
        color: '#fc4c02',
        letterSpacing: '-0.01em'
      }}>
        ⚡ The Grind
      </div>
    </div>
  )
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
  maxWidth: '400px',
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

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#6b7280',
  fontSize: '0.8rem',
  fontFamily: 'DM Sans, sans-serif',
  textDecoration: 'none'
}
