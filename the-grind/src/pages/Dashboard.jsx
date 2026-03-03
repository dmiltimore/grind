export default function Dashboard({ profile }) {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {profile?.username}</p>
    </div>
  )
}