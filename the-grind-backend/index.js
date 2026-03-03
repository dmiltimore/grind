require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { syncUser } = require('./src/leetcode')
const { syncAllUsers } = require('./src/cron')
const supabase = require('./src/supabase')

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

const { getLeaderboard } = require('./src/points')

// Get the current weekly leaderboard
app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await getLeaderboard()
    res.json(leaderboard)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Manually trigger a sync for a single user
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

// Manually trigger a sync for all users
app.post('/sync-all', async (req, res) => {
  syncAllUsers()
  res.json({ message: 'Sync started' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Cron job scheduled — syncing every 6 hours')
})