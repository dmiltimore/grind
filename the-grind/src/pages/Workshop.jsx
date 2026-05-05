import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  getMyResumes, getFriendsResumes, getResume, createResume,
  updateResume, deleteResume, toggleShareResume, forkResume,
  getResumeComments, addResumeComment
} from '../lib/api'

export default function Workshop({ profile }) {
  const [view, setView] = useState('library')
  const [myResumes, setMyResumes] = useState([])
  const [friendsResumes, setFriendsResumes] = useState([])
  const [loadingLib, setLoadingLib] = useState(true)

  const [activeResume, setActiveResume] = useState(null)
  const [editorContent, setEditorContent] = useState('')
  const [editorTitle, setEditorTitle] = useState('')
  const [saveStatus, setSaveStatus] = useState('saved')
  const [isOwner, setIsOwner] = useState(false)

  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [forking, setForking] = useState(null)

  const saveTimerRef = useRef(null)

  useEffect(() => { fetchLibrary() }, [])

  async function fetchLibrary() {
    setLoadingLib(true)
    try {
      const [mine, friends] = await Promise.all([
        getMyResumes(profile.id),
        getFriendsResumes(profile.id)
      ])
      setMyResumes(mine)
      setFriendsResumes(friends)
    } catch (err) { console.error(err) }
    setLoadingLib(false)
  }

  async function openEditor(id, asOwner) {
    try {
      const [resume, c] = await Promise.all([
        getResume(id),
        getResumeComments(id)
      ])
      setActiveResume(resume)
      setEditorContent(resume.content || '')
      setEditorTitle(resume.title || 'Untitled Resume')
      setIsOwner(asOwner ?? resume.user_id === profile.id)
      setSaveStatus('saved')
      setComments(c)
      setView('editor')
    } catch (err) { console.error(err) }
  }

  async function handleNewResume() {
    try {
      const resume = await createResume(profile.id)
      await openEditor(resume.id, true)
      fetchLibrary()
    } catch (err) { console.error(err) }
  }

  function scheduleAutoSave(content, title) {
    setSaveStatus('unsaved')
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => doSave(content, title), 1500)
  }

  function handleContentChange(val) {
    setEditorContent(val)
    scheduleAutoSave(val, editorTitle)
  }

  function handleTitleChange(val) {
    setEditorTitle(val)
    scheduleAutoSave(editorContent, val)
  }

  async function doSave(content, title) {
    if (!activeResume || !isOwner) return
    setSaveStatus('saving')
    try {
      await updateResume(activeResume.id, profile.id, { content, title })
      setSaveStatus('saved')
    } catch (err) {
      console.error(err)
      setSaveStatus('unsaved')
    }
  }

  function handleBack() {
    clearTimeout(saveTimerRef.current)
    if (saveStatus !== 'saved') doSave(editorContent, editorTitle)
    setView('library')
    setActiveResume(null)
    fetchLibrary()
  }

  async function handleToggleShare(resumeId) {
    try {
      const updated = await toggleShareResume(resumeId, profile.id)
      setMyResumes(prev => prev.map(r => r.id === resumeId ? { ...r, is_shared: updated.is_shared } : r))
      if (activeResume?.id === resumeId) setActiveResume(a => ({ ...a, is_shared: updated.is_shared }))
    } catch (err) { console.error(err) }
  }

  async function handleDelete(resumeId) {
    try {
      await deleteResume(resumeId, profile.id)
      setMyResumes(prev => prev.filter(r => r.id !== resumeId))
      setConfirmDelete(null)
    } catch (err) { console.error(err) }
  }

  async function handleFork(resumeId) {
    setForking(resumeId)
    try {
      const forked = await forkResume(resumeId, profile.id)
      await openEditor(forked.id, true)
      fetchLibrary()
    } catch (err) { console.error(err) }
    setForking(null)
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmittingComment(true)
    try {
      const comment = await addResumeComment(activeResume.id, profile.id, newComment.trim())
      setComments(prev => [...prev, comment])
      setNewComment('')
    } catch (err) { console.error(err) }
    setSubmittingComment(false)
  }

  function handleTabKey(e) {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const { selectionStart: s, selectionEnd: end, value } = e.target
    const next = value.slice(0, s) + '  ' + value.slice(end)
    handleContentChange(next)
    requestAnimationFrame(() => { e.target.selectionStart = e.target.selectionEnd = s + 2 })
  }

  // ── Editor view ────────────────────────────────────────────────────
  if (view === 'editor' && activeResume) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', marginTop: '-32px', marginLeft: '-40px', marginRight: '-40px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', background: '#16181c', borderBottom: '1px solid #2a2d35', flexShrink: 0 }}>
          <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', padding: '4px 8px', borderRadius: '6px' }}>
            ← Back
          </button>
          <div style={{ width: '1px', height: '20px', background: '#2a2d35' }} />
          {isOwner ? (
            <input
              value={editorTitle}
              onChange={e => handleTitleChange(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: '#e8eaed', fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', flex: 1 }}
            />
          ) : (
            <div style={{ flex: 1, fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem' }}>
              {editorTitle}
              <span style={{ fontFamily: 'DM Mono', fontWeight: 400, fontSize: '0.7rem', color: '#6b7280', marginLeft: '10px' }}>
                by @{activeResume.users?.username}
              </span>
            </div>
          )}
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.65rem', color: saveStatus === 'saved' ? '#3ddc84' : saveStatus === 'saving' ? '#ffb347' : '#6b7280', letterSpacing: '0.05em', flexShrink: 0 }}>
            {isOwner ? (saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : '● Unsaved') : ''}
          </div>
          {isOwner ? (
            <button
              onClick={() => handleToggleShare(activeResume.id)}
              style={{
                background: activeResume.is_shared ? 'rgba(61,220,132,0.1)' : 'transparent',
                border: `1px solid ${activeResume.is_shared ? 'rgba(61,220,132,0.4)' : '#2a2d35'}`,
                borderRadius: '20px', padding: '4px 12px',
                color: activeResume.is_shared ? '#3ddc84' : '#6b7280',
                fontFamily: 'DM Mono', fontSize: '0.7rem', cursor: 'pointer', letterSpacing: '0.03em'
              }}
            >
              {activeResume.is_shared ? '🔓 Shared' : '🔒 Private'}
            </button>
          ) : (
            <button
              onClick={() => handleFork(activeResume.id)}
              disabled={forking === activeResume.id}
              style={{ background: '#fc4c02', border: 'none', borderRadius: '8px', padding: '6px 14px', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {forking === activeResume.id ? 'Copying...' : '⑂ Fork to my Workshop'}
            </button>
          )}
        </div>

        {/* Split pane */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Markdown source — left */}
          {isOwner && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #2a2d35', overflow: 'hidden' }}>
              <div style={{ padding: '6px 16px', background: '#1e2128', borderBottom: '1px solid #2a2d35', fontFamily: 'DM Mono', fontSize: '0.65rem', color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Markdown
              </div>
              <textarea
                value={editorContent}
                onChange={e => handleContentChange(e.target.value)}
                onKeyDown={handleTabKey}
                spellCheck={false}
                style={{
                  flex: 1, background: '#0e0f11', border: 'none', outline: 'none', resize: 'none',
                  padding: '24px 28px', color: '#c9d1d9', fontFamily: 'DM Mono', fontSize: '0.8rem',
                  lineHeight: 1.8, overflowY: 'auto', tabSize: 2
                }}
              />
            </div>
          )}

          {/* Preview — right */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#e8e8e8' }}>
            <div style={{ padding: '6px 16px', background: '#d0d0d0', borderBottom: '1px solid #bbb', fontFamily: 'DM Mono', fontSize: '0.65rem', color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Preview
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '680px', boxShadow: '0 2px 16px rgba(0,0,0,0.18)', borderRadius: '2px' }}>
                <div className="resume-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {editorContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div style={{ borderTop: '1px solid #2a2d35', background: '#16181c', maxHeight: '280px', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '14px 20px 0', fontFamily: 'DM Mono', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Comments · {comments.length}
          </div>
          <div style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {comments.length === 0 && (
              <div style={{ color: '#4b5563', fontSize: '0.8rem', fontFamily: 'DM Mono', padding: '4px 0' }}>
                No comments yet.
              </div>
            )}
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                  background: c.user_id === profile.id ? 'linear-gradient(135deg, #fc4c02, #ffb347)' : 'linear-gradient(135deg, #6366f1, #4da6ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 700, fontFamily: 'Syne'
                }}>
                  {(c.users?.username || '?').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.user_id === profile.id ? 'You' : c.users?.username}</span>
                    <span style={{ fontFamily: 'DM Mono', fontSize: '0.65rem', color: '#6b7280' }}>
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.5 }}>{c.content}</div>
                </div>
              </div>
            ))}

            {/* Add comment */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', paddingTop: '4px', paddingBottom: '8px' }}>
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Leave a comment..."
                style={{ flex: 1, background: '#0e0f11', border: '1px solid #2a2d35', borderRadius: '8px', padding: '7px 12px', color: '#e8eaed', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#fc4c02')}
                onBlur={e => (e.target.style.borderColor = '#2a2d35')}
              />
              <button type="submit" disabled={submittingComment || !newComment.trim()} style={{
                background: (submittingComment || !newComment.trim()) ? '#1e2128' : '#fc4c02',
                color: (submittingComment || !newComment.trim()) ? '#6b7280' : '#fff',
                border: 'none', borderRadius: '8px', padding: '7px 16px',
                fontWeight: 600, fontSize: '0.8rem', cursor: submittingComment ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif', flexShrink: 0
              }}>
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Library view ───────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: '#fc4c02', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Resume Workshop</div>
          <div style={{ fontFamily: 'Syne', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>My Resumes</div>
        </div>
        <button
          onClick={handleNewResume}
          style={{ background: '#fc4c02', border: 'none', borderRadius: '10px', padding: '10px 20px', color: '#fff', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
        >
          + New Resume
        </button>
      </div>

      {/* My resumes */}
      {loadingLib ? (
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</div>
      ) : myResumes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280', marginBottom: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📄</div>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>No resumes yet</div>
          <div style={{ fontSize: '0.8rem' }}>Hit "New Resume" to create your first one.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '40px' }}>
          {myResumes.map(r => (
            <ResumeCard
              key={r.id}
              resume={r}
              isOwner
              onOpen={() => openEditor(r.id, true)}
              onToggleShare={() => handleToggleShare(r.id)}
              onDelete={() => setConfirmDelete(r.id)}
            />
          ))}
        </div>
      )}

      {/* Friends' resumes */}
      {friendsResumes.length > 0 && (
        <>
          <div style={{ fontFamily: 'Syne', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            Friends' Resumes
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {friendsResumes.map(r => (
              <ResumeCard
                key={r.id}
                resume={r}
                isOwner={false}
                onOpen={() => openEditor(r.id, false)}
                onFork={() => handleFork(r.id)}
                forking={forking === r.id}
              />
            ))}
          </div>
        </>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null) }}
        >
          <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '14px', padding: '28px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>Delete resume?</div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px' }}>This can't be undone.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, background: '#ef4444', border: 'none', borderRadius: '10px', padding: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Delete
              </button>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: 'none', border: '1px solid #2a2d35', borderRadius: '10px', padding: '10px', color: '#6b7280', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResumeCard({ resume, isOwner, onOpen, onToggleShare, onDelete, onFork, forking }) {
  const updated = new Date(resume.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return (
    <div style={{ background: '#16181c', border: '1px solid #2a2d35', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {resume.title}
        </div>
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: '#6b7280', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isOwner ? (
            <span style={{
              color: resume.is_shared ? '#3ddc84' : '#4b5563',
              background: resume.is_shared ? 'rgba(61,220,132,0.1)' : 'transparent',
              padding: '1px 6px', borderRadius: '10px',
              border: `1px solid ${resume.is_shared ? 'rgba(61,220,132,0.3)' : '#2a2d35'}`
            }}>
              {resume.is_shared ? 'Shared' : 'Private'}
            </span>
          ) : (
            <span style={{ color: '#9ca3af' }}>@{resume.users?.username}</span>
          )}
          <span>· {updated}</span>
          {resume.forked_from && <span style={{ color: '#6366f1' }}>· forked</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onOpen} style={{ flex: 1, background: '#fc4c02', border: 'none', borderRadius: '8px', padding: '8px', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          {isOwner ? 'Edit' : 'View'}
        </button>
        {isOwner ? (
          <>
            <button onClick={onToggleShare} style={{ background: 'none', border: '1px solid #2a2d35', borderRadius: '8px', padding: '8px 12px', color: '#9ca3af', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Mono' }}>
              {resume.is_shared ? 'Unshare' : 'Share'}
            </button>
            <button onClick={onDelete} style={{ background: 'none', border: '1px solid #2a2d35', borderRadius: '8px', padding: '8px 12px', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Mono' }}>
              ✕
            </button>
          </>
        ) : (
          <button onClick={onFork} disabled={forking} style={{ background: 'none', border: '1px solid #2a2d35', borderRadius: '8px', padding: '8px 12px', color: '#9ca3af', fontSize: '0.75rem', cursor: forking ? 'not-allowed' : 'pointer', fontFamily: 'DM Mono' }}>
            {forking ? '...' : '⑂ Fork'}
          </button>
        )}
      </div>
    </div>
  )
}
