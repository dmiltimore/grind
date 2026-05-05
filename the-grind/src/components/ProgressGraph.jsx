import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getSubmissionHistory } from '../lib/api'

const USER_COLORS = ['#fc4c02', '#4da6ff', '#a855f7', '#3ddc84', '#ffb347']

export default function ProgressGraph({ profile }) {
  const [data, setData] = useState([])
  const [users, setUsers] = useState([])
  const [range, setRange] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [range])

  async function fetchData() {
    setLoading(true)
    try {
      const { submissions, users: userList } = await getSubmissionHistory(profile.id, range)
      setUsers(userList || [])
      setData(buildChartData(submissions || [], userList || [], range))
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  function buildChartData(submissions, userList, range) {
    const days = range === 'week' ? 7 : 30
    const now = new Date()

    // Build a map of date -> userId -> cumulative count
    const dateMap = {}

    for (let i = days; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dateMap[key] = {}
      userList.forEach(u => { dateMap[key][u.id] = 0 })
    }

    // Count submissions per day per user
    submissions.forEach(sub => {
      const key = new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (dateMap[key] && dateMap[key][sub.user_id] !== undefined) {
        dateMap[key][sub.user_id]++
      }
    })

    // Make cumulative
    const userTotals = {}
    userList.forEach(u => { userTotals[u.id] = 0 })

    return Object.entries(dateMap).map(([date, counts]) => {
      const point = { date }
      userList.forEach(u => {
        userTotals[u.id] += counts[u.id] || 0
        point[u.id] = userTotals[u.id]
      })
      return point
    })
  }

  return (
    <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', padding: '24px', marginTop: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontFamily: 'Syne', fontSize: '1.1rem', fontWeight: 700 }}>Progress</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['week', 'month'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                fontFamily: 'DM Mono',
                fontSize: '0.7rem',
                padding: '6px 14px',
                borderRadius: '20px',
                border: range === r ? 'none' : '1px solid #2a2d35',
                background: range === r ? '#fc4c02' : 'transparent',
                color: range === r ? 'white' : '#6b7280',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              {r === 'week' ? '7D' : '30D'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="date"
              tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              interval={range === 'week' ? 0 : 4}
            />
            <YAxis
              tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#1e2128',
                border: '1px solid #2a2d35',
                borderRadius: '8px',
                fontFamily: 'DM Mono',
                fontSize: '0.75rem'
              }}
              labelStyle={{ color: '#e8eaed', marginBottom: '4px' }}
              formatter={(value, name) => {
                const user = users.find(u => u.id === name)
                const label = user?.id === profile.id ? 'you' : (user?.username || name)
                return [value, label]
              }}
            />
            <Legend
              wrapperStyle={{ fontFamily: 'DM Mono', fontSize: '0.7rem', paddingTop: '16px' }}
              formatter={(value) => {
                const user = users.find(u => u.id === value)
                return user?.id === profile.id ? 'you' : user?.username
              }}
            />
            {users.map((user, index) => (
              <Line
                key={user.id}
                type="monotone"
                dataKey={user.id}
                stroke={user.id === profile.id ? '#fc4c02' : USER_COLORS[index + 1]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}