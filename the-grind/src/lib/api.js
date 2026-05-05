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

// ── Jobs ───────────────────────────────────────────────────────────────
export const searchJobs = (q, { location = '', page = 1, remote = false } = {}) =>
  api.get(`/jobs/search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&page=${page}&remote=${remote}`).then(r => r.data)

export const logApplication = (userId, data) =>
  api.post('/jobs/apply', { userId, ...data }).then(r => r.data)

export const getApplications = (userId) =>
  api.get(`/jobs/applications/${userId}`).then(r => r.data)

export const updateApplicationStatus = (id, userId, status) =>
  api.patch(`/jobs/application/${id}`, { userId, status }).then(r => r.data)

export const getJobFeed = (userId) =>
  api.get(`/jobs/feed/${userId}`).then(r => r.data)

export const getJobHistory = (userId, range = 'month') =>
  api.get(`/jobs/history/${userId}?range=${range}`).then(r => r.data)

// ── Workshop ───────────────────────────────────────────────────────────
export const getMyResumes = (userId) =>
  api.get(`/resumes/${userId}`).then(r => r.data)

export const getFriendsResumes = (userId) =>
  api.get(`/resumes/${userId}/friends`).then(r => r.data)

export const getResume = (id) =>
  api.get(`/resume/${id}`).then(r => r.data)

export const createResume = (userId, title) =>
  api.post('/resumes', { userId, title }).then(r => r.data)

export const updateResume = (id, userId, { title, content }) =>
  api.put(`/resume/${id}`, { userId, title, content }).then(r => r.data)

export const deleteResume = (id, userId) =>
  api.delete(`/resume/${id}`, { data: { userId } }).then(r => r.data)

export const toggleShareResume = (id, userId) =>
  api.patch(`/resume/${id}/share`, { userId }).then(r => r.data)

export const forkResume = (id, userId) =>
  api.post(`/resume/${id}/fork`, { userId }).then(r => r.data)

export const getResumeComments = (id) =>
  api.get(`/resume/${id}/comments`).then(r => r.data)

export const addResumeComment = (id, userId, content) =>
  api.post(`/resume/${id}/comments`, { userId, content }).then(r => r.data)