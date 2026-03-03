import { useEffect, useState } from 'react'
import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getPendingRequests
} from '../lib/api'

export default function Friends({ profile }) {
  const [friends, setFriends] = useState([])
  const [pending, setPending] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchFriendsData()
  }, [])

  async function fetchFriendsData() {
    setLoading(true)
    try {
      const [friendsData, pendingData] = await Promise.all([
        getFriends(profile.id),
        getPendingRequests(profile.id)
      ])
      setFriends(friendsData)
      setPending(pendingData)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const results = await searchUsers(searchQuery)
      // Filter out yourself and existing friends
      const friendIds = friends.map(f => f.id)
      setSearchResults(results.filter(u => u.id !== profile.id && !friendIds.includes(u.id)))
    } catch (err) {
      console.error(err)
    }
    setSearching(false)
  }

  async function handleSendRequest(friendId) {
    try {
      await sendFriendRequest(profile.id, friendId)
      setMessage('Friend request sent!')
      setSearchResults(searchResults.filter(u => u.id !== friendId))
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to send request')
    }
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleAccept(friendshipId) {
    try {
      await acceptFriendRequest(friendshipId, profile.id)
      setMessage('Friend request accepted!')
      fetchFriendsData()
    } catch (err) {
      setMessage('Failed to accept request')
    }
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div style={{ maxWidth: '700px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#fc4c02', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
          Social
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Friends
        </div>
      </div>

      {/* Message toast */}
      {message && (
        <div style={{
          background: 'rgba(61,220,132,0.1)',
          border: '1px solid rgba(61,220,132,0.3)',
          color: '#3ddc84',
          padding: '10px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.875rem',
          fontFamily: 'monospace'
        }}>
          {message}
        </div>
      )}

      {/* Search */}
      <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Add Friends
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(e)}
            style={{
              flex: 1,
              background: '#1e2128',
              border: '1px solid #2a2d35',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#e8eaed',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{
              background: '#fc4c02',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {searchResults.map(user => (
              <div key={user.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#1e2128',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px', height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #4da6ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700
                  }}>
                    {user.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.username}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>@{user.leetcode_username}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleSendRequest(user.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #fc4c02',
                    color: '#fc4c02',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#ffb347', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Pending Requests
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.map(req => (
              <div key={req.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#1e2128',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {req.requester?.username}
                </div>
                <button
                  onClick={() => handleAccept(req.id)}
                  style={{
                    background: '#3ddc84',
                    color: '#0e0f11',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', padding: '20px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Your Friends · {friends.length}
        </div>

        {loading ? (
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</p>
        ) : friends.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No friends yet — search for someone to add.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {friends.map(friend => (
              <div key={friend.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: '#1e2128',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #4da6ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700
                }}>
                  {friend.username?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{friend.username}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>@{friend.leetcode_username}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}