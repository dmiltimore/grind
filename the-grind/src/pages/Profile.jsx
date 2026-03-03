import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Profile({ profile }) {
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)

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

  const latest = snapshots[0]

  return (
    <div style={{ maxWidth: '700px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#fc4c02', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
          Profile
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          @{profile.username}
        </div>
        <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '4px' }}>
          LeetCode: {profile.leetcode_username}
        </div>
      </div>

      {/* All time stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
        <StatCard label="Total Solved" value={latest?.total || 0} color="#e8eaed" />
        <StatCard label="Easy" value={latest?.easy || 0} color="#3ddc84" />
        <StatCard label="Medium" value={latest?.medium || 0} color="#ffb347" />
        <StatCard label="Hard" value={latest?.hard || 0} color="#ef4444" />
      </div>

      {/* Snapshot history */}
      <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px',
          background: '#1e2128',
          fontFamily: 'monospace',
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
          <div style={{ padding: '20px', color: '#6b7280', fontSize: '0.875rem' }}>No snapshots yet.</div>
        ) : (
          snapshots.map((snap, index) => (
            <div key={snap.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 80px 80px 80px',
              padding: '12px 20px',
              borderBottom: index === snapshots.length - 1 ? 'none' : '1px solid #2a2d35',
              fontSize: '0.875rem'
            }}>
              <div style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {new Date(snap.snapped_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
              <div style={{ textAlign: 'center', color: '#3ddc84', fontFamily: 'monospace' }}>{snap.easy}</div>
              <div style={{ textAlign: 'center', color: '#ffb347', fontFamily: 'monospace' }}>{snap.medium}</div>
              <div style={{ textAlign: 'center', color: '#ef4444', fontFamily: 'monospace' }}>{snap.hard}</div>
              <div style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{snap.total}</div>
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
      <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}