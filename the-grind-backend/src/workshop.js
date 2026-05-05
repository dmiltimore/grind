const supabase = require('./supabase')

const DEFAULT_CONTENT = `# Your Name
your.email@example.com | (123) 456-7890 | linkedin.com/in/yourname | github.com/yourname

---

## Education

**University Name** — City, State
B.S. in Computer Science | GPA: 3.X | Expected May 20XX

---

## Experience

**Company Name** — Software Engineer Intern
*Month 20XX – Month 20XX*
- Accomplished X by doing Y, which led to Z (quantify impact when possible)
- Built a feature using React and Node.js that improved load time by 30%

---

## Projects

**Project Name** | [GitHub](https://github.com) | [Demo](https://yourproject.com)
*React, Node.js, PostgreSQL*
- Brief description of what the project does and the problem it solves
- Key technical achievement or interesting implementation detail

---

## Skills

**Languages:** JavaScript, Python, Java, C++
**Frameworks:** React, Node.js, Express
**Tools:** Git, Docker, AWS, PostgreSQL
`

async function getMyResumes(userId) {
  const { data, error } = await supabase
    .from('resumes')
    .select('id, title, is_shared, forked_from, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

async function getResume(id) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*, users(username)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function createResume(userId, title = 'Untitled Resume') {
  const { data, error } = await supabase
    .from('resumes')
    .insert({ user_id: userId, title, content: DEFAULT_CONTENT })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function updateResume(id, userId, { title, content }) {
  const updates = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title
  if (content !== undefined) updates.content = content
  const { data, error } = await supabase
    .from('resumes')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function deleteResume(id, userId) {
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

async function toggleShare(id, userId) {
  const { data: current } = await supabase
    .from('resumes').select('is_shared').eq('id', id).eq('user_id', userId).single()
  const { data, error } = await supabase
    .from('resumes')
    .update({ is_shared: !current.is_shared })
    .eq('id', id).eq('user_id', userId)
    .select().single()
  if (error) throw new Error(error.message)
  return data
}

async function forkResume(resumeId, userId) {
  const { data: original } = await supabase
    .from('resumes').select('title, content').eq('id', resumeId).single()
  const { data, error } = await supabase
    .from('resumes')
    .insert({ user_id: userId, title: `${original.title} (copy)`, content: original.content, forked_from: resumeId })
    .select().single()
  if (error) throw new Error(error.message)
  return data
}

async function getFriendsResumes(userId) {
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')
  const friendIds = (friendships || []).map(f => f.user_id === userId ? f.friend_id : f.user_id)
  if (friendIds.length === 0) return []
  const { data, error } = await supabase
    .from('resumes')
    .select('id, title, updated_at, users(username)')
    .in('user_id', friendIds)
    .eq('is_shared', true)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

async function getComments(resumeId) {
  const { data, error } = await supabase
    .from('resume_comments')
    .select('*, users(username)')
    .eq('resume_id', resumeId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

async function addComment(resumeId, userId, content) {
  const { data, error } = await supabase
    .from('resume_comments')
    .insert({ resume_id: resumeId, user_id: userId, content })
    .select('*, users(username)')
    .single()
  if (error) throw new Error(error.message)
  return data
}

module.exports = { getMyResumes, getResume, createResume, updateResume, deleteResume, toggleShare, forkResume, getFriendsResumes, getComments, addComment }
