const supabase = require('./supabase')

// Get the most recent Monday at midnight
function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function calculatePoints(easy, medium, hard) {
  return (easy * 1) + (medium * 2) + (hard * 3)
}

async function getWeeklyStatsForUser(userId) {
  const weekStart = getWeekStart()

  const { data: baseline } = await supabase
    .from('lc_snapshots')
    .select('easy, medium, hard, total')
    .eq('user_id', userId)
    .lt('snapped_at', weekStart.toISOString())
    .order('snapped_at', { ascending: false })
    .limit(1)
    .single()

  const { data: current } = await supabase
    .from('lc_snapshots')
    .select('easy, medium, hard, total')
    .eq('user_id', userId)
    .order('snapped_at', { ascending: false })
    .limit(1)
    .single()

  if (!current) return null

  const base = baseline || { easy: 0, medium: 0, hard: 0 }

  const weeklyEasy = Math.max(0, current.easy - base.easy)
  const weeklyMedium = Math.max(0, current.medium - base.medium)
  const weeklyHard = Math.max(0, current.hard - base.hard)
  const points = calculatePoints(weeklyEasy, weeklyMedium, weeklyHard)

  return { easy: weeklyEasy, medium: weeklyMedium, hard: weeklyHard, points }
}

async function getLeaderboard(userId = null) {
  let query = supabase
    .from('users')
    .select('id, username, leetcode_username')
    .not('leetcode_username', 'is', null)

  if (userId) {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted')

    const friendIds = friendships?.map(f =>
      f.user_id === userId ? f.friend_id : f.user_id
    ) || []

    friendIds.push(userId)
    query = query.in('id', friendIds)
  }

  const { data: users, error } = await query
  if (error) throw error

  const results = await Promise.all(
    users.map(async user => {
      const stats = await getWeeklyStatsForUser(user.id)
      return {
        userId: user.id,
        username: user.username,
        leetcodeUsername: user.leetcode_username,
        ...stats
      }
    })
  )

  return results
    .filter(r => r.points !== undefined)
    .sort((a, b) => b.points - a.points)
    .map((user, index) => ({ ...user, rank: index + 1 }))
}

async function runWeeklyReset() {
  console.log('Running weekly reset...')

  const leaderboard = await getLeaderboard()
  if (leaderboard.length === 0) {
    console.log('No users to reset.')
    return
  }

  const weekStart = getWeekStart()

  const rows = leaderboard.map(user => ({
    week_start: weekStart.toISOString().split('T')[0],
    user_id: user.userId,
    easy: user.easy,
    medium: user.medium,
    hard: user.hard,
    points: user.points,
    rank: user.rank
  }))

  const { error } = await supabase
    .from('weekly_leaderboards')
    .upsert(rows, { onConflict: 'week_start,user_id' })

  if (error) {
    console.error('Failed to write leaderboard:', error)
    return
  }

  const winner = leaderboard[0]
  console.log(`🏆 Week of ${weekStart.toISOString().split('T')[0]} winner: ${winner.username} with ${winner.points} points`)
  console.log('Weekly reset complete.')
}

module.exports = { getWeeklyStatsForUser, getLeaderboard, getWeekStart, runWeeklyReset }