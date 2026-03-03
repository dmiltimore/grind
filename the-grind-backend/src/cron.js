const cron = require('node-cron')
const supabase = require('./supabase')
const { syncUser } = require('./leetcode')
const { runWeeklyReset } = require('./points')

async function syncAllUsers() {
  console.log('Starting sync for all users...')

  const { data: users, error } = await supabase
    .from('users')
    .select('id, leetcode_username')
    .not('leetcode_username', 'is', null)

  if (error) {
    console.error('Failed to fetch users:', error)
    return
  }

  console.log(`Syncing ${users.length} users...`)

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

// Sync every 6 hours
cron.schedule('0 */6 * * *', () => {
  syncAllUsers()
})

// Run weekly reset every Sunday at 11:59 PM
cron.schedule('59 23 * * 0', () => {
  runWeeklyReset()
})

module.exports = { syncAllUsers }