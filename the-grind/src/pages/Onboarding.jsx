import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Onboarding({ session }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
  e.preventDefault()
  setLoading(true)
  setError(null)

  const { error } = await supabase
    .from('users')
    .insert({
      id: session.user.id,
      username: username.toLowerCase(),
      leetcode_username: username
    })

  if (error) setError(error.message)
  setLoading(false)
  }

  async function validateLeetCodeUsername(username) {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
        }
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
    } catch (err) {
      return false
    }
  }

  return (
    <div>
      <h1>Link your LeetCode account</h1>
      <p>Enter your LeetCode username so we can track your progress.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="LeetCode username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Checking...' : 'Link account'}
        </button>
      </form>
    </div>
  )
}