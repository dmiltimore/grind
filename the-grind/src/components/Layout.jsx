import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout({ children, profile }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0f11', color: '#e8eaed' }}>

      {/* Sidebar */}
      <div style={{
        width: '240px',
        background: '#16181c',
        borderRight: '1px solid #2a2d35',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: 'monospace',
          fontWeight: 800,
          fontSize: '1.2rem',
          padding: '0 12px 24px',
          color: '#fc4c02'
        }}>
          ⚡ The Grind
        </div>

        <NavItem to="/" label="🏠 Dashboard" />
        <NavItem to="/friends" label="👥 Friends" />
        <NavItem to="/profile" label="👤 Profile" />

        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          fontSize: '0.7rem',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          Coming Soon
        </div>
        <div style={{ padding: '9px 12px', color: '#4b5563', fontSize: '0.875rem' }}>💼 Job Board</div>
        <div style={{ padding: '9px 12px', color: '#4b5563', fontSize: '0.875rem' }}>🎤 Mock Interview</div>

        {/* User info */}
        <div style={{ flex: 1 }} />
        <div style={{
          padding: '12px',
          background: 'rgba(252,76,2,0.08)',
          border: '1px solid rgba(252,76,2,0.2)',
          borderRadius: '10px',
          fontSize: '0.8rem'
        }}>
          <div style={{ color: '#fc4c02', fontSize: '0.65rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Logged in as
          </div>
          <div style={{ color: '#e8eaed' }}>@{profile?.username}</div>
          <div
            onClick={() => supabase.auth.signOut()}
            style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '8px', cursor: 'pointer' }}
          >
            Sign out
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      end
      style={({ isActive }) => ({
        display: 'block',
        padding: '9px 12px',
        borderRadius: '8px',
        fontSize: '0.875rem',
        textDecoration: 'none',
        color: isActive ? '#fc4c02' : '#9ca3af',
        background: isActive ? 'rgba(252,76,2,0.12)' : 'transparent',
        fontWeight: isActive ? 500 : 400
      })}
    >
      {label}
    </NavLink>
  )
}