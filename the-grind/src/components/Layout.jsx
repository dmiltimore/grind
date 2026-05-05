import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function Layout({ children, profile }) {
  const isMobile = useIsMobile()

  if (isMobile) return <MobileLayout profile={profile}>{children}</MobileLayout>
  return <DesktopLayout profile={profile}>{children}</DesktopLayout>
}

function DesktopLayout({ children, profile }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e0f11', color: '#e8eaed' }}>
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
        <NavItem to="/jobs" label="💼 Job Board" />
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
        <NavItem to="/workshop" label="📄 Resume Workshop" />
        <div style={{ padding: '9px 12px', color: '#4b5563', fontSize: '0.875rem' }}>🎤 Mock Interview</div>

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

      <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

function MobileLayout({ children, profile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0e0f11', color: '#e8eaed' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: '#16181c',
        borderBottom: '1px solid #2a2d35',
        flexShrink: 0
      }}>
        <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: '#fc4c02' }}>
          ⚡ The Grind
        </div>
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: '#6b7280' }}>
          @{profile?.username}
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, padding: '24px 16px 88px', overflowY: 'auto' }}>
        {children}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#16181c',
        borderTop: '1px solid #2a2d35',
        display: 'flex',
        zIndex: 100
      }}>
        <MobileTab to="/" icon="🏠" label="Dashboard" />
        <MobileTab to="/friends" icon="👥" label="Friends" />
        <MobileTab to="/jobs" icon="💼" label="Jobs" />
        <MobileTab to="/profile" icon="👤" label="Profile" />
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

function MobileTab({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      style={({ isActive }) => ({
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 0 12px',
        textDecoration: 'none',
        color: isActive ? '#fc4c02' : '#6b7280',
        fontSize: '0.65rem',
        fontFamily: 'DM Mono',
        letterSpacing: '0.04em',
        gap: '4px',
        borderTop: isActive ? '2px solid #fc4c02' : '2px solid transparent',
        marginTop: '-1px'
      })}
    >
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      {label}
    </NavLink>
  )
}
