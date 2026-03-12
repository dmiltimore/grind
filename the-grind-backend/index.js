require('dotenv').config()
const express = require('express')
const cors = require('cors')

// ── Internal modules ──────────────────────────────────────────────
const supabase = require('./src/supabase')
const { syncUser } = require('./src/leetcode')
const { syncAllUsers } = require('./src/cron')
const { getLeaderboard, runWeeklyReset, getActivityFeed } = require('./src/points')
const { searchUsers, sendFriendRequest, acceptFriendRequest, getFriends, getPendingRequests } = require('./src/friends')

const app = express()

// ── Middleware ────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── Health ────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// ── Leaderboard ───────────────────────────────────────────────────
app.get('/leaderboard', async (req, res) => {
  try {
    const { userId } = req.query
    const leaderboard = await getLeaderboard(userId || null)
    res.json(leaderboard)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── LeetCode Sync ─────────────────────────────────────────────────
app.post('/sync/:userId', async (req, res) => {
  const { userId } = req.params

  const { data: user, error } = await supabase
    .from('users')
    .select('leetcode_username')
    .eq('id', userId)
    .single()

  if (error || !user) return res.status(404).json({ error: 'User not found' })

  const stats = await syncUser(userId, user.leetcode_username)
  res.json({ success: true, stats })
})

app.post('/sync-all', async (req, res) => {
  syncAllUsers()
  res.json({ message: 'Sync started' })
})

// ── Weekly Reset ──────────────────────────────────────────────────
app.post('/reset', async (req, res) => {
  try {
    await runWeeklyReset()
    res.json({ message: 'Weekly reset complete' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Friends ───────────────────────────────────────────────────────
app.get('/users/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).json({ error: 'Query required' })
    const users = await searchUsers(q)
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/friends/request', async (req, res) => {
  try {
    const { userId, friendId } = req.body
    const result = await sendFriendRequest(userId, friendId)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/friends/accept', async (req, res) => {
  try {
    const { friendshipId, userId } = req.body
    const result = await acceptFriendRequest(friendshipId, userId)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/friends/:userId', async (req, res) => {
  try {
    const friends = await getFriends(req.params.userId)
    res.json(friends)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/friends/:userId/pending', async (req, res) => {
  try {
    const requests = await getPendingRequests(req.params.userId)
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Activity Feed ─────────────────────────────────────────────────
app.get('/feed/:userId', async (req, res) => {
  try {
    const feed = await getActivityFeed(req.params.userId)
    res.json(feed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Submission History ──────────────────────────────────────────────────
app.get('/submissions/:userId', async (req, res) => {
  try {
    const { range } = req.query // 'week' or 'month'
    const userId = req.params.userId

    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted')

    const friendIds = friendships?.map(f =>
      f.user_id === userId ? f.friend_id : f.user_id
    ) || []
    friendIds.push(userId)

    const since = new Date()
    if (range === 'week') since.setDate(since.getDate() - 7)
    else since.setDate(since.getDate() - 30)

    const { data: submissions } = await supabase
      .from('lc_submissions')
      .select('user_id, submitted_at, difficulty')
      .in('user_id', friendIds)
      .gte('submitted_at', since.toISOString())
      .order('submitted_at', { ascending: true })

    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .in('id', friendIds)

    res.json({ submissions, users })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Cron job scheduled — syncing every 6 hours')
})