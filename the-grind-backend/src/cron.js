const cron = require('node-cron')
const supabase = require('./supabase')
const { syncUser } = require('./leetcode')

async function syncAllUsers() {
  console.log('Starting sync for all users...')

  // Fetch every user who has a LeetCode username linked
  const { data: users, error } = await supabase
    .from('users')
    .select('id, leetcode_username')
    .not('leetcode_username', 'is', null)

  if (error) {
    console.error('Failed to fetch users:', error)
    return
  }

  console.log(`Syncing ${users.length} users...`)

  // Sync each user one at a time
  for (const user of users) {
    try {
      const stats = await syncUser(user.id, user.leetcode_username)
      console.log(`✓ Synced ${user.leetcode_username}:`, stats)
    } catch (err) {
      console.error(`✗ Failed to sync ${user.leetcode_username}:`, err.message)
    }
  }

  console.log('Sync complete.')
}

// Run every 6 hours
cron.schedule('0 */6 * * *', () => {
  syncAllUsers()
})

// Also export so we can trigger manually
module.exports = { syncAllUsers }