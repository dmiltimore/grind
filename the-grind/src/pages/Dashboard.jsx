import { useEffect, useState } from 'react'
import { getLeaderboard } from '../lib/api'

export default function Dashboard({ profile }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard()
      .then(data => setLeaderboard(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#fc4c02', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
          Weekly Leaderboard
        </div>
        <div style={{ fontFamily: 'sans-serif', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          The Grind
        </div>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading...</p>
      ) : (
        <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', overflow: 'hidden' }}>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 80px 80px 80px 90px',
            padding: '12px 20px',
            background: '#1e2128',
            fontFamily: 'monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#6b7280'
          }}>
            <div></div>
            <div>User</div>
            <div style={{ textAlign: 'center' }}>Easy</div>
            <div style={{ textAlign: 'center' }}>Medium</div>
            <div style={{ textAlign: 'center' }}>Hard</div>
            <div style={{ textAlign: 'right' }}>Points</div>
          </div>

          {/* Rows */}
          {leaderboard.length === 0 ? (
            <div style={{ padding: '24px 20px', color: '#6b7280', fontSize: '0.875rem' }}>
              No data yet — sync your LeetCode account to get started.
            </div>
          ) : (
            leaderboard.map((user, index) => (
              <LeaderboardRow
                key={user.userId}
                user={user}
                isMe={user.userId === profile.id}
                isLast={index === leaderboard.length - 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function LeaderboardRow({ user, isMe, isLast }) {
  const rankEmoji = user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : user.rank

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1fr 80px 80px 80px 90px',
      alignItems: 'center',
      padding: '14px 20px',
      borderBottom: isLast ? 'none' : '1px solid #2a2d35',
      background: isMe ? 'rgba(252,76,2,0.06)' : 'transparent',
      transition: 'background 0.15s'
    }}>

      {/* Rank */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: user.rank <= 3 ? '1rem' : '0.8rem',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        {rankEmoji}
      </div>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px', height: '28px',
          borderRadius: '50%',
          background: isMe ? 'linear-gradient(135deg, #fc4c02, #ffb347)' : 'linear-gradient(135deg, #6366f1, #4da6ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 700, flexShrink: 0
        }}>
          {user.username?.slice(0, 2).toUpperCase()}
        </div>
        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{user.username}</span>
        {isMe && (
          <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#fc4c02' }}>you</span>
        )}
      </div>

      {/* Easy */}
      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#3ddc84', textAlign: 'center' }}>
        {user.easy}
      </div>

      {/* Medium */}
      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#ffb347', textAlign: 'center' }}>
        {user.medium}
      </div>

      {/* Hard */}
      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#ef4444', textAlign: 'center' }}>
        {user.hard}
      </div>

      {/* Points */}
      <div style={{ fontWeight: 800, fontSize: '1.05rem', textAlign: 'right', color: isMe ? '#fc4c02' : '#e8eaed' }}>
        {user.points}
      </div>
    </div>
  )
}