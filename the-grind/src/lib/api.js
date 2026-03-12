import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001'
})

// ── Leaderboard ───────────────────────────────────────────────────
export const getLeaderboard = (userId) =>
  api.get(`/leaderboard?userId=${userId}`).then(r => r.data)

// ── LeetCode Sync ─────────────────────────────────────────────────
export const syncUser = (userId) =>
  api.post(`/sync/${userId}`).then(r => r.data)

// ── Friends ───────────────────────────────────────────────────────
export const searchUsers = (query) =>
  api.get(`/users/search?q=${query}`).then(r => r.data)

export const sendFriendRequest = (userId, friendId) =>
  api.post('/friends/request', { userId, friendId }).then(r => r.data)

export const acceptFriendRequest = (friendshipId, userId) =>
  api.post('/friends/accept', { friendshipId, userId }).then(r => r.data)

export const getFriends = (userId) =>
  api.get(`/friends/${userId}`).then(r => r.data)

export const getPendingRequests = (userId) =>
  api.get(`/friends/${userId}/pending`).then(r => r.data)

// ── Activity Feed ──────────────────────────────────────────────────
export const getActivityFeed = (userId) =>
  api.get(`/feed/${userId}`).then(r => r.data)

// ── Submission History ──────────────────────────────────────────────────
export const getSubmissionHistory = (userId, range = 'month') =>
  api.get(`/submissions/${userId}?range=${range}`).then(r => r.data)