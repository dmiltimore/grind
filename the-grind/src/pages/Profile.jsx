export default function Profile({ profile }) {
  return (
    <div>
      <h1>Profile</h1>
      <p>@{profile?.username}</p>
      <p>LeetCode: {profile?.leetcode_username}</p>
    </div>
  )
}