const supabase = require('./supabase')

// Search for a user by username
async function searchUsers(query) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, leetcode_username')
    .ilike('username', `%${query}%`)
    .limit(10)

  if (error) throw error
  return data
}

// Send a friend request
async function sendFriendRequest(userId, friendId) {
  if (userId === friendId) throw new Error('Cannot add yourself')

  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
    .single()

  if (existing) throw new Error(`Friendship already exists with status: ${existing.status}`)

  const { data, error } = await supabase
    .from('friendships')
    .insert({ user_id: userId, friend_id: friendId, status: 'pending' })
    .select()
    .single()

  if (error) throw error
  return data
}

// Accept a friend request
async function acceptFriendRequest(friendshipId, userId) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .eq('friend_id', userId) // only the recipient can accept
    .select()
    .single()

  if (error) throw error
  return data
}

// Get all friends for a user
async function getFriends(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      status,
      user_id,
      friend_id,
      requester:users!friendships_user_id_fkey(id, username, leetcode_username),
      recipient:users!friendships_friend_id_fkey(id, username, leetcode_username)
    `)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')

  if (error) throw error

  // Normalize so we always get "the other person"
  return data.map(f => {
    const isRequester = f.user_id === userId
    const friend = isRequester ? f.recipient : f.requester
    return { friendshipId: f.id, ...friend }
  })
}

// Get pending friend requests received by a user
async function getPendingRequests(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      status,
      requester:users!friendships_user_id_fkey(id, username)
    `)
    .eq('friend_id', userId)
    .eq('status', 'pending')

  if (error) throw error
  return data
}

module.exports = { searchUsers, sendFriendRequest, acceptFriendRequest, getFriends, getPendingRequests }