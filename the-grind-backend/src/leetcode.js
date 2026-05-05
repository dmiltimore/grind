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

async function fetchRecentSubmissions(username) {
  const query = `
    query recentSubmissions($username: String!) {
      recentAcSubmissionList(username: $username, limit: 20) {
        id
        title
        titleSlug
        timestamp
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

  return response.data?.data?.recentAcSubmissionList || []
}

async function getDifficultyForSlug(titleSlug) {
  const query = `
    query getQuestionDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        difficulty
      }
    }
  `

  try {
    const response = await axios.post(LEETCODE_GRAPHQL, {
      query,
      variables: { titleSlug }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com'
      }
    })
    return response.data?.data?.question?.difficulty || null
  } catch {
    return null
  }
}

async function syncUser(userId, leetcodeUsername) {
  // Fetch stats and submissions in parallel
  const [stats, submissions] = await Promise.all([
    fetchLeetCodeStats(leetcodeUsername),
    fetchRecentSubmissions(leetcodeUsername)
  ])

  // Save snapshot
  const { error: snapshotError } = await supabase
    .from('lc_snapshots')
    .insert({
      user_id: userId,
      easy: stats.easy,
      medium: stats.medium,
      hard: stats.hard,
      total: stats.total
    })

  if (snapshotError) throw snapshotError

  // Save submissions (upsert to avoid duplicates)
  if (submissions.length > 0) {
    const rows = await Promise.all(submissions.map(async sub => {
      const difficulty = await getDifficultyForSlug(sub.titleSlug)
      return {
        user_id: userId,
        submission_id: sub.id,
        title: sub.title,
        title_slug: sub.titleSlug,
        difficulty,
        submitted_at: new Date(parseInt(sub.timestamp) * 1000).toISOString()
      }
    }))

    const { error: subError } = await supabase 
      .from('lc_submissions')
      .upsert(rows, { onConflict: 'user_id,submission_id' })

    if (subError) console.error('Failed to save submissions:', subError)
  }

  return stats
}

module.exports = { fetchLeetCodeStats, fetchRecentSubmissions, syncUser }