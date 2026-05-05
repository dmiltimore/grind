import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Friends from './pages/Friends'
import Profile from './pages/Profile'
import Layout from './components/Layout'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  if (loading) return <div className="loading">Loading...</div>
  if (!session) return <Auth />
  if (!profile) return <Onboarding session={session} onComplete={fetchProfile} />

  return (
    <BrowserRouter>
      <Layout session={session} profile={profile}>
        <Routes>
          <Route path="/" element={<Dashboard profile={profile} />} />
          <Route path="/friends" element={<Friends profile={profile} />} />
          <Route path="/profile" element={<Profile profile={profile} onUpdate={() => fetchProfile(session.user.id)} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}