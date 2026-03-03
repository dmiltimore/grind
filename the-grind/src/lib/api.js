import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001'
})

// ── Leaderboard ───────────────────────────────────────────────────
export const getLeaderboard = () =>
  api.get('/leaderboard').then(r => r.data)

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