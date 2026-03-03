import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoadingProfile(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) fetchProfile(session.user.id)
        else { setProfile(null); setLoadingProfile(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoadingProfile(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(data)
    setLoadingProfile(false)
  }

  if (loadingProfile) return <p>Loading...</p>
  if (!session) return <Auth />
  if (!profile) return <Onboarding session={session} />

  return (
    <div>
      <p>Welcome, {profile.username}!</p>
      <p>LeetCode: {profile.leetcode_username}</p>
      <button onClick={() => supabase.auth.signOut()}>Sign out</button>
    </div>
  )
}