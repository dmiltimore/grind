const axios = require('axios')
const supabase = require('./supabase')

const searchCache = new Map()
const CACHE_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

async function searchJobs({ query, location, page = 1, remote = false }) {
  if (!process.env.JSEARCH_API_KEY) throw new Error('JSEARCH_API_KEY not set in .env')
  const q = location ? `${query} in ${location}` : query
  const cacheKey = `${q}|${page}|${remote}`
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.results

  const { data } = await axios.get('https://jsearch.p.rapidapi.com/search', {
    params: { query: q, page: String(page), num_pages: '1', ...(remote && { remote_jobs_only: 'true' }) },
    headers: {
      'X-RapidAPI-Key': process.env.JSEARCH_API_KEY,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  })
  const results = data.data || []
  searchCache.set(cacheKey, { results, ts: Date.now() })
  return results
}

async function logApplication(userId, { company, role, url = '', status = 'applied', notes = '' }) {
  const { data, error } = await supabase
    .from('job_applications')
    .insert({ user_id: userId, company, role, url, status, notes })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function getApplications(userId) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', userId)
    .order('applied_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

async function updateApplicationStatus(id, userId, status) {
  const { data, error } = await supabase
    .from('job_applications')
    .update({ status })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function getJobFeed(userId) {
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')

  const friendIds = (friendships || []).map(f =>
    f.user_id === userId ? f.friend_id : f.user_id
  )
  friendIds.push(userId)

  const { data, error } = await supabase
    .from('job_applications')
    .select('*, users(username)')
    .in('user_id', friendIds)
    .order('applied_at', { ascending: false })
    .limit(30)
  if (error) throw new Error(error.message)
  return data || []
}

async function getJobHistory(userId, range = 'month') {
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')

  const friendIds = (friendships || []).map(f =>
    f.user_id === userId ? f.friend_id : f.user_id
  )
  friendIds.push(userId)

  const since = new Date()
  since.setDate(since.getDate() - (range === 'week' ? 7 : 30))

  const { data: applications } = await supabase
    .from('job_applications')
    .select('user_id, applied_at')
    .in('user_id', friendIds)
    .gte('applied_at', since.toISOString())
    .order('applied_at', { ascending: true })

  const { data: users } = await supabase
    .from('users')
    .select('id, username')
    .in('id', friendIds)

  return { applications: applications || [], users: users || [] }
}

module.exports = { searchJobs, logApplication, getApplications, updateApplicationStatus, getJobFeed, getJobHistory }
