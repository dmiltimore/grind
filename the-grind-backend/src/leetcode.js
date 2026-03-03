const axios = require('axios')
const supabase = require('./supabase')

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql'

async function fetchLeetCodeStats(username) {
  const query = `
    query getUserStats($username: String!) {
      matchedUser(username: $username) {
        username
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `

  const response = await axios.post(LEETCODE_GRAPHQL, {
    query,
    variables: { username }
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com'
    }
  })

  const stats = response.data?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum
  if (!stats) throw new Error(`User ${username} not found`)

  const easy = stats.find(s => s.difficulty === 'Easy')?.count || 0
  const medium = stats.find(s => s.difficulty === 'Medium')?.count || 0
  const hard = stats.find(s => s.difficulty === 'Hard')?.count || 0

  return { easy, medium, hard, total: easy + medium + hard }
}

async function syncUser(userId, leetcodeUsername) {
  const stats = await fetchLeetCodeStats(leetcodeUsername)

  const { error } = await supabase
    .from('lc_snapshots')
    .insert({
      user_id: userId,
      easy: stats.easy,
      medium: stats.medium,
      hard: stats.hard,
      total: stats.total
    })

  if (error) throw error
  return stats
}

module.exports = { fetchLeetCodeStats, syncUser }