import { useEffect, useState } from 'react'
import { getLeaderboard, getActivityFeed } from '../lib/api'
import ProgressGraph from '../components/ProgressGraph'

export default function Dashboard({ profile }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState('')
  const [feed, setFeed] = useState([])

  useEffect(() => {
    getLeaderboard(profile.id)
      .then(data => setLeaderboard(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))

    getActivityFeed(profile.id)
      .then(data => setFeed(data))
      .catch(err => console.error(err))

    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilReset())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  function getTimeUntilReset() {
    const now = new Date()
    const sunday = new Date()
    sunday.setDate(now.getDate() + (7 - now.getDay()) % 7)
    sunday.setHours(23, 59, 0, 0)
    if (sunday <= now) sunday.setDate(sunday.getDate() + 7)

    const diff = sunday - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const secs = Math.floor((diff % (1000 * 60)) / 1000)
    return `${days}d ${hours}h ${mins}m ${secs}s`
  }

  const me = leaderboard.find(u => u.userId === profile.id)

  return (
    <div style={{ maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: '#fc4c02', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Weekly Leaderboard
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            The Grind
          </div>
        </div>
        <div style={{
          fontFamily: 'DM Mono',
          fontSize: '0.75rem',
          background: 'rgba(61,220,132,0.1)',
          color: '#3ddc84',
          border: '1px solid rgba(61,220,132,0.3)',
          padding: '8px 16px',
          borderRadius: '20px'
        }}>
          🔄 Resets in {timeLeft}
        </div>
      </div>

      {/* Stats cards */}
      {me && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
          <StatCard label="This Week · Pts" value={me.points} color="#fc4c02" sub={`Rank #${me.rank}`} />
          <StatCard label="Easy" value={me.easy} color="#3ddc84" sub={`${me.easy} pts`} />
          <StatCard label="Medium" value={me.medium} color="#ffb347" sub={`${me.medium * 2} pts`} />
          <StatCard label="Hard" value={me.hard} color="#ef4444" sub={`${me.hard * 3} pts`} />
        </div>
      )}

      {/* Leaderboard */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading...</p>
      ) : (
        <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 80px 80px 80px 90px',
            padding: '12px 20px',
            background: '#1e2128',
            fontFamily: 'DM Mono',
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

      {/* Activity Feed */}
      {feed.length > 0 && (
        <div style={{ marginTop: '28px' }}>
          <div style={{ fontFamily: 'Syne', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            Recent Activity
          </div>
          <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', overflow: 'hidden' }}>
            {feed.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                borderBottom: index === feed.length - 1 ? 'none' : '1px solid #2a2d35'
              }}>
                <div style={{
                  width: '30px', height: '30px',
                  borderRadius: '50%',
                  background: item.userId === profile.id
                    ? 'linear-gradient(135deg, #fc4c02, #ffb347)'
                    : 'linear-gradient(135deg, #6366f1, #4da6ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                  fontFamily: 'Syne'
                }}>
                  {item.username?.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', color: '#e8eaed' }}>
                    <strong>{item.userId === profile.id ? 'You' : item.username}</strong> solved{' '}
                    <span style={{
                      color: item.difficulty === 'Easy' ? '#3ddc84' : item.difficulty === 'Medium' ? '#ffb347' : '#ef4444',
                      fontWeight: 500
                    }}>
                      {item.title}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: '0.65rem', color: '#6b7280', marginTop: '3px', display: 'flex', gap: '10px' }}>
                    <span style={{
                      color: item.difficulty === 'Easy' ? '#3ddc84' : item.difficulty === 'Medium' ? '#ffb347' : '#ef4444',
                      background: item.difficulty === 'Easy' ? 'rgba(61,220,132,0.1)' : item.difficulty === 'Medium' ? 'rgba(255,179,71,0.1)' : 'rgba(239,68,68,0.1)',
                      padding: '2px 7px',
                      borderRadius: '20px'
                    }}>
                      {item.difficulty}
                    </span>
                    <span>+{item.points} pts</span>
                    <span>{new Date(item.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Graph */}
      <ProgressGraph profile={profile} />

    </div>
  )
}

function StatCard({ label, value, color, sub }) {
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
      <div style={{ fontFamily: 'Syne', fontSize: '1.9rem', fontWeight: 800, color, lineHeight: 1, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: '#6b7280' }}>
        {sub}
      </div>
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
      background: isMe ? 'rgba(252,76,2,0.06)' : 'transparent'
    }}>
      <div style={{
        fontFamily: 'DM Mono',
        fontSize: user.rank <= 3 ? '1rem' : '0.8rem',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        {rankEmoji}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px', height: '28px',
          borderRadius: '50%',
          background: isMe ? 'linear-gradient(135deg, #fc4c02, #ffb347)' : 'linear-gradient(135deg, #6366f1, #4da6ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
          fontFamily: 'Syne'
        }}>
          {user.username?.slice(0, 2).toUpperCase()}
        </div>
        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{user.username}</span>
        {isMe && (
          <span style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', color: '#fc4c02' }}>you</span>
        )}
      </div>

      <div style={{ fontFamily: 'DM Mono', fontSize: '0.85rem', color: '#3ddc84', textAlign: 'center' }}>{user.easy}</div>
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.85rem', color: '#ffb347', textAlign: 'center' }}>{user.medium}</div>
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.85rem', color: '#ef4444', textAlign: 'center' }}>{user.hard}</div>
      <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.05rem', textAlign: 'right', color: isMe ? '#fc4c02' : '#e8eaed' }}>
        {user.points}
      </div>
    </div>
  )
}