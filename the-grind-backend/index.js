require('dotenv').config()
const express = require('express')
const cors = require('cors')

// ── Internal modules ──────────────────────────────────────────────
const supabase = require('./src/supabase')
const { syncUser } = require('./src/leetcode')
const { syncAllUsers } = require('./src/cron')
const { getLeaderboard, runWeeklyReset, getActivityFeed } = require('./src/points')
const { searchUsers, sendFriendRequest, acceptFriendRequest, getFriends, getPendingRequests } = require('./src/friends')
const { searchJobs, logApplication, getApplications, updateApplicationStatus, getJobFeed, getJobHistory } = require('./src/jobs')
const { getMyResumes, getResume, createResume, updateResume, deleteResume, toggleShare, forkResume, getFriendsResumes, getComments, addComment } = require('./src/workshop')

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

// ── Jobs ──────────────────────────────────────────────────────────
app.get('/jobs/search', async (req, res) => {
  try {
    const { q, location, page, remote } = req.query
    if (!q) return res.status(400).json({ error: 'Query required' })
    const jobs = await searchJobs({ query: q, location, page: Number(page) || 1, remote: remote === 'true' })
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/jobs/apply', async (req, res) => {
  try {
    const { userId, ...rest } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })
    const application = await logApplication(userId, rest)
    res.json(application)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/jobs/applications/:userId', async (req, res) => {
  try {
    const apps = await getApplications(req.params.userId)
    res.json(apps)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/jobs/application/:id', async (req, res) => {
  try {
    const { userId, status } = req.body
    const app = await updateApplicationStatus(req.params.id, userId, status)
    res.json(app)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/jobs/feed/:userId', async (req, res) => {
  try {
    const feed = await getJobFeed(req.params.userId)
    res.json(feed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/jobs/history/:userId', async (req, res) => {
  try {
    const { range } = req.query
    const history = await getJobHistory(req.params.userId, range)
    res.json(history)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Workshop ──────────────────────────────────────────────────────
app.get('/resumes/:userId', async (req, res) => {
  try { res.json(await getMyResumes(req.params.userId)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/resumes/:userId/friends', async (req, res) => {
  try { res.json(await getFriendsResumes(req.params.userId)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/resume/:id', async (req, res) => {
  try { res.json(await getResume(req.params.id)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/resumes', async (req, res) => {
  try {
    const { userId, title } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })
    res.json(await createResume(userId, title))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/resume/:id', async (req, res) => {
  try {
    const { userId, title, content } = req.body
    res.json(await updateResume(req.params.id, userId, { title, content }))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/resume/:id', async (req, res) => {
  try {
    const { userId } = req.body
    await deleteResume(req.params.id, userId)
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.patch('/resume/:id/share', async (req, res) => {
  try {
    const { userId } = req.body
    res.json(await toggleShare(req.params.id, userId))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/resume/:id/fork', async (req, res) => {
  try {
    const { userId } = req.body
    res.json(await forkResume(req.params.id, userId))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/resume/:id/comments', async (req, res) => {
  try { res.json(await getComments(req.params.id)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/resume/:id/comments', async (req, res) => {
  try {
    const { userId, content } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' })
    res.json(await addComment(req.params.id, userId, content.trim()))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Cron job scheduled — syncing every 6 hours')
})