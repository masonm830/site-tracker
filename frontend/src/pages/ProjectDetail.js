import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { getToken, isAdmin } from '../utils/auth';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9' },
  main: { maxWidth: 780, margin: '0 auto', padding: '32px 20px 60px' },
  back: {
    display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b',
    fontSize: 13, marginBottom: 20, cursor: 'pointer', background: 'none',
    border: 'none', padding: 0, fontFamily: 'inherit', fontWeight: 500,
  },
  // Project card
  projectCard: {
    background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
    padding: '28px 32px', marginBottom: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  projectName: { fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.5px' },
  projectAddress: { fontSize: 14, color: '#64748b', marginBottom: 0 },
  btnRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  shareBtn: {
    background: '#0f172a', color: '#fff', border: 'none', borderRadius: 9,
    padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
  },
  editProjectBtn: {
    background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0',
    borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
  },
  shareConfirm: {
    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
    padding: '12px 16px', fontSize: 13, color: '#15803d', marginTop: 14,
    wordBreak: 'break-all', fontWeight: 500,
  },
  metaRow: {
    display: 'flex', gap: 32, flexWrap: 'wrap', paddingTop: 20, marginTop: 20,
    borderTop: '1px solid #f1f5f9',
  },
  metaItem: { display: 'flex', flexDirection: 'column', gap: 3 },
  metaLabel: { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' },
  metaValue: { color: '#1e293b', fontWeight: 600, fontSize: 14 },
  // Inline project edit form
  inlineEditForm: {
    background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12,
    padding: '18px', marginTop: 18,
  },
  inlineEditTitle: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 },
  input: {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8,
    padding: '8px 12px', fontSize: 14, fontFamily: 'inherit',
    color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  inlineActions: { display: 'flex', gap: 8, marginTop: 12 },
  saveBtn: {
    background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8,
    padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  cancelBtn: {
    background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8,
    padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: '#475569', fontFamily: 'inherit',
  },
  // Log form
  logFormCard: {
    background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
    padding: '28px 32px', marginBottom: 28,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 18, letterSpacing: '-0.2px' },
  textarea: {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
    padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', resize: 'vertical',
    minHeight: 100, outline: 'none', color: '#0f172a', background: '#f8fafc',
    marginBottom: 14, boxSizing: 'border-box', lineHeight: 1.6,
  },
  fileLabel: {
    display: 'flex', alignItems: 'center', gap: 10, border: '2px dashed #e2e8f0',
    borderRadius: 10, padding: '14px 18px', cursor: 'pointer', marginBottom: 14,
    fontSize: 14, color: '#64748b', transition: 'border-color 0.15s, background 0.15s',
  },
  fileInput: { display: 'none' },
  preview: {
    width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10,
    marginBottom: 14, border: '1px solid #e2e8f0',
  },
  submitBtn: {
    background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10,
    padding: '11px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  uploadProgress: {
    fontSize: 13, color: '#3b82f6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
  },
  // Timeline
  timelineHeader: {
    fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.2px',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  logCount: {
    fontSize: 13, fontWeight: 500, color: '#64748b', background: '#f1f5f9',
    borderRadius: 20, padding: '2px 10px',
  },
  timeline: { display: 'flex', flexDirection: 'column', gap: 16 },
  timelineEntry: {
    background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  entryPhoto: { width: '100%', maxHeight: 340, objectFit: 'cover', display: 'block' },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 3 },
  photoGridImg: { width: '100%', height: 180, objectFit: 'cover', display: 'block' },
  entryBody: { padding: '18px 22px' },
  entryNote: { fontSize: 15, color: '#1e293b', lineHeight: 1.7, marginBottom: 14, whiteSpace: 'pre-wrap' },
  entryMeta: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  entryDate: { fontSize: 12, color: '#94a3b8', fontWeight: 500 },
  photoBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 3, background: '#f1f5f9',
    color: '#475569', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 500,
  },
  // Log entry actions
  entryActions: {
    display: 'flex', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9',
  },
  logEditBtn: {
    background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 12px',
    fontSize: 12, cursor: 'pointer', color: '#64748b', fontFamily: 'inherit', fontWeight: 500,
  },
  logDeleteBtn: {
    background: 'none', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 12px',
    fontSize: 12, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit', fontWeight: 500,
  },
  logConfirmText: { fontSize: 12, color: '#dc2626', fontWeight: 600, alignSelf: 'center' },
  logConfirmYes: {
    background: '#dc2626', border: 'none', borderRadius: 7, padding: '5px 14px',
    fontSize: 12, cursor: 'pointer', color: '#fff', fontFamily: 'inherit', fontWeight: 600,
  },
  logConfirmNo: {
    background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 12px',
    fontSize: 12, cursor: 'pointer', color: '#64748b', fontFamily: 'inherit',
  },
  // Log edit area
  logEditArea: { padding: '16px 22px', borderTop: '2px solid #f1f5f9', background: '#f8fafc' },
  photoLabel: {
    fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 8, display: 'block', marginTop: 4,
  },
  editThumbGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  editThumbWrapper: { position: 'relative', display: 'inline-block' },
  editThumbImg: {
    width: 76, height: 76, objectFit: 'cover', borderRadius: 8,
    border: '2px solid #e2e8f0', display: 'block',
  },
  editThumbNew: { border: '2px solid #3b82f6' },
  editThumbRemove: {
    position: 'absolute', top: -7, right: -7, background: '#ef4444', color: '#fff',
    border: '2px solid #fff', borderRadius: '50%', width: 20, height: 20, fontSize: 10,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit', lineHeight: 1,
  },
  noLogs: {
    textAlign: 'center', padding: '48px 20px', color: '#94a3b8', background: '#fff',
    borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 15,
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
    padding: '12px 16px', color: '#dc2626', fontSize: 14, marginBottom: 16,
  },
};

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStage, setUploadStage] = useState(null);
  const [logError, setLogError] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);

  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({});
  const [projectEditLoading, setProjectEditLoading] = useState(false);

  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);
  const [logEditNote, setLogEditNote] = useState('');
  const [logEditExistingPhotos, setLogEditExistingPhotos] = useState([]);
  const [logEditNewFiles, setLogEditNewFiles] = useState([]);
  const [logEditNewPreviews, setLogEditNewPreviews] = useState([]);
  const [logActionLoading, setLogActionLoading] = useState(false);
  const logEditFileRef = useRef();
  const fileRef = useRef();
  const admin = isAdmin();

  useEffect(() => {
    axios.get(`${API}/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => { setProject(res.data); setLogs(res.data.logs || []); })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!note.trim() && !file) return;
    setLogError(null);
    setSubmitting(true);
    try {
      let photo_url = null;
      if (file) {
        setUploadStage('Uploading photo...');
        const fd = new FormData();
        fd.append('file', file);
        const up = await axios.post(`${API}/api/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${getToken()}` },
        });
        photo_url = up.data.url;
      }
      setUploadStage('Saving log...');
      const logRes = await axios.post(`${API}/api/logs`, {
        project_id: id, note: note.trim(), photo_url,
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setLogs(prev => [logRes.data, ...prev]);
      setNote(''); setFile(null); setPreviewUrl(null); setUploadStage(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setLogError(err.response?.data?.detail || 'Failed to save log. Please try again.');
    } finally {
      setSubmitting(false); setUploadStage(null);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/share/${project.share_token}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3500);
    });
  }

  function startEditProject() {
    setProjectForm({ name: project.name, address: project.address, client_name: project.client_name, client_email: project.client_email });
    setEditingProject(true);
  }

  async function handleEditProjectSubmit() {
    setProjectEditLoading(true);
    try {
      const res = await axios.patch(`${API}/api/projects/${id}`, projectForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setProject(prev => ({ ...prev, ...res.data }));
      setEditingProject(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update project.');
    } finally {
      setProjectEditLoading(false);
    }
  }

  async function handleDeleteLog(logId) {
    setLogActionLoading(true);
    try {
      await axios.delete(`${API}/api/logs/${logId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setLogs(prev => prev.filter(l => l.id !== logId));
      setConfirmDeleteLogId(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete log.');
    } finally {
      setLogActionLoading(false);
    }
  }

  function startEditLog(log) {
    setEditingLogId(log.id);
    setLogEditNote(log.note || '');
    setLogEditExistingPhotos(log.photo_urls || []);
    setLogEditNewFiles([]);
    setLogEditNewPreviews([]);
    setConfirmDeleteLogId(null);
  }

  function handleLogEditFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLogEditNewFiles(prev => [...prev, ...files]);
    setLogEditNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    if (logEditFileRef.current) logEditFileRef.current.value = '';
  }

  function removeExistingPhoto(url) { setLogEditExistingPhotos(prev => prev.filter(u => u !== url)); }
  function removeNewFile(i) {
    setLogEditNewFiles(prev => prev.filter((_, idx) => idx !== i));
    setLogEditNewPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleEditLogSubmit(logId) {
    setLogActionLoading(true);
    try {
      const uploadedUrls = [];
      for (const f of logEditNewFiles) {
        const fd = new FormData();
        fd.append('file', f);
        const up = await axios.post(`${API}/api/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${getToken()}` },
        });
        uploadedUrls.push(up.data.url);
      }
      const res = await axios.patch(`${API}/api/logs/${logId}`, {
        note: logEditNote,
        photo_urls: [...logEditExistingPhotos, ...uploadedUrls],
      }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, ...res.data } : l));
      setEditingLogId(null);
      setLogEditExistingPhotos([]); setLogEditNewFiles([]); setLogEditNewPreviews([]);
      if (logEditFileRef.current) logEditFileRef.current.value = '';
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update log.');
    } finally {
      setLogActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={s.page}>
        <Header />
        <p style={{ textAlign: 'center', paddingTop: 80, color: '#94a3b8', fontSize: 15 }}>Loading project...</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <Header />
      <main style={s.main}>
        <button style={s.back} onClick={() => navigate('/')}>
          ← All Projects
        </button>

        {/* Project header */}
        <div style={s.projectCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h1 style={s.projectName}>{project.name}</h1>
              <p style={s.projectAddress}>{project.address}</p>
            </div>
            <div style={s.btnRow}>
              {admin && !editingProject && (
                <button style={s.editProjectBtn} onClick={startEditProject}>
                  ✏ Edit Project
                </button>
              )}
              <button
                style={s.shareBtn}
                onClick={handleShare}
                onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
              >
                🔗 Share with Client
              </button>
            </div>
          </div>

          {shareCopied && (
            <div style={s.shareConfirm}>
              ✓ Link copied! Send this to {project.client_name}:{' '}
              <span style={{ opacity: 0.75 }}>{window.location.origin}/share/{project.share_token}</span>
            </div>
          )}

          {editingProject && (
            <div style={s.inlineEditForm}>
              <div style={s.inlineEditTitle}>Edit Project Details</div>
              <div style={s.fieldRow}>
                <div>
                  <label style={s.label}>Project Name</label>
                  <input style={s.input} value={projectForm.name || ''} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <label style={s.label}>Site Address</label>
                  <input style={s.input} value={projectForm.address || ''} onChange={e => setProjectForm(f => ({ ...f, address: e.target.value }))} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
              </div>
              <div style={s.fieldRow}>
                <div>
                  <label style={s.label}>Client Name</label>
                  <input style={s.input} value={projectForm.client_name || ''} onChange={e => setProjectForm(f => ({ ...f, client_name: e.target.value }))} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <label style={s.label}>Client Email</label>
                  <input style={s.input} type="email" value={projectForm.client_email || ''} onChange={e => setProjectForm(f => ({ ...f, client_email: e.target.value }))} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
              </div>
              <div style={s.inlineActions}>
                <button style={{ ...s.saveBtn, opacity: projectEditLoading ? 0.6 : 1 }} onClick={handleEditProjectSubmit} disabled={projectEditLoading}>
                  {projectEditLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button style={s.cancelBtn} onClick={() => setEditingProject(false)} disabled={projectEditLoading}>Cancel</button>
              </div>
            </div>
          )}

          <div style={s.metaRow}>
            <div style={s.metaItem}>
              <span style={s.metaLabel}>Client</span>
              <span style={s.metaValue}>{project.client_name}</span>
            </div>
            <div style={s.metaItem}>
              <span style={s.metaLabel}>Email</span>
              <span style={s.metaValue}>{project.client_email}</span>
            </div>
            <div style={s.metaItem}>
              <span style={s.metaLabel}>Updates</span>
              <span style={s.metaValue}>{logs.length}</span>
            </div>
          </div>
        </div>

        {/* Add log form */}
        <div style={s.logFormCard}>
          <h2 style={s.sectionTitle}>Add Log Entry</h2>
          <form onSubmit={handleSubmit}>
            {logError && <div style={s.error}>{logError}</div>}
            <label style={s.label}>Notes</label>
            <textarea
              style={s.textarea}
              placeholder="Describe today's progress, observations, or next steps..."
              value={note}
              onChange={e => setNote(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
            />
            <label style={s.label}>Photo (optional)</label>
            <label
              style={s.fileLabel}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#f0f9ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 18 }}>📷</span>
              <span style={{ fontSize: 14 }}>{file ? file.name : 'Click to attach a photo'}</span>
              <input ref={fileRef} style={s.fileInput} type="file" accept="image/*" onChange={handleFileChange} />
            </label>
            {previewUrl && <img src={previewUrl} alt="Preview" style={s.preview} />}
            {uploadStage && (
              <div style={s.uploadProgress}><span>⏳</span> {uploadStage}</div>
            )}
            <button
              type="submit"
              style={{ ...s.submitBtn, background: submitting ? '#93c5fd' : '#3b82f6', cursor: submitting ? 'not-allowed' : 'pointer' }}
              disabled={submitting}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#2563eb'; }}
              onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = '#3b82f6'; }}
            >
              {submitting ? 'Saving...' : 'Add Log Entry'}
            </button>
          </form>
        </div>

        {/* Timeline */}
        <div style={s.timelineHeader}>
          Progress Timeline
          {logs.length > 0 && <span style={s.logCount}>{logs.length} {logs.length === 1 ? 'entry' : 'entries'}</span>}
        </div>

        {logs.length === 0 ? (
          <div style={s.noLogs}>No log entries yet — add your first one above.</div>
        ) : (
          <div style={s.timeline}>
            {logs.map(log => {
              const photos = log.photo_urls || [];
              return (
                <div key={log.id} style={s.timelineEntry}>
                  {photos.length === 1 && <img src={photos[0]} alt="Site" style={s.entryPhoto} />}
                  {photos.length > 1 && (
                    <div style={s.photoGrid}>
                      {photos.map((url, i) => <img key={i} src={url} alt={`Construction update ${i + 1}`} style={s.photoGridImg} />)}
                    </div>
                  )}
                  <div style={s.entryBody}>
                    {log.note && <p style={s.entryNote}>{log.note}</p>}
                    <div style={s.entryMeta}>
                      <span style={s.entryDate}>{formatDateTime(log.created_at)}</span>
                      {log.updated_at && (
                        <span style={{ ...s.entryDate, color: '#cbd5e1' }}>· Edited {formatDateTime(log.updated_at)}</span>
                      )}
                      {photos.length > 0 && (
                        <span style={s.photoBadge}>📷 {photos.length}</span>
                      )}
                    </div>

                    <div style={s.entryActions}>
                      {editingLogId === log.id ? (
                        <>
                          <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, alignSelf: 'center' }}>Editing</span>
                          <button style={s.logConfirmNo} onClick={() => setEditingLogId(null)} disabled={logActionLoading}>Cancel</button>
                        </>
                      ) : confirmDeleteLogId === log.id ? (
                        <>
                          <span style={s.logConfirmText}>Delete this entry?</span>
                          <button style={{ ...s.logConfirmYes, opacity: logActionLoading ? 0.6 : 1 }} onClick={() => handleDeleteLog(log.id)} disabled={logActionLoading}>
                            {logActionLoading ? '...' : 'Delete'}
                          </button>
                          <button style={s.logConfirmNo} onClick={() => setConfirmDeleteLogId(null)} disabled={logActionLoading}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button style={s.logEditBtn} onClick={() => startEditLog(log)}>Edit</button>
                          <button style={s.logDeleteBtn} onClick={() => { setConfirmDeleteLogId(log.id); setEditingLogId(null); }}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingLogId === log.id && (
                    <div style={s.logEditArea}>
                      <label style={s.label}>Note</label>
                      <textarea
                        style={{ ...s.textarea, minHeight: 80, marginBottom: 12 }}
                        value={logEditNote}
                        onChange={e => setLogEditNote(e.target.value)}
                        onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                      />
                      <span style={s.photoLabel}>
                        Photos
                        {(logEditExistingPhotos.length + logEditNewFiles.length) > 0 &&
                          ` (${logEditExistingPhotos.length + logEditNewFiles.length})`}
                      </span>
                      <div style={s.editThumbGrid}>
                        {logEditExistingPhotos.map((url, i) => (
                          <div key={`ex-${i}`} style={s.editThumbWrapper}>
                            <img src={url} alt="" style={s.editThumbImg} />
                            <button style={s.editThumbRemove} onClick={() => removeExistingPhoto(url)} type="button">✕</button>
                          </div>
                        ))}
                        {logEditNewPreviews.map((preview, i) => (
                          <div key={`new-${i}`} style={s.editThumbWrapper}>
                            <img src={preview} alt="" style={{ ...s.editThumbImg, ...s.editThumbNew }} />
                            <button style={s.editThumbRemove} onClick={() => removeNewFile(i)} type="button">✕</button>
                          </div>
                        ))}
                      </div>
                      <label
                        style={{ ...s.fileLabel, marginBottom: 12 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#f0f9ff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontSize: 16 }}>📷</span>
                        <span style={{ fontSize: 13 }}>Add photos</span>
                        <input ref={logEditFileRef} style={s.fileInput} type="file" accept="image/*" multiple onChange={handleLogEditFileChange} />
                      </label>
                      <div style={s.inlineActions}>
                        <button style={{ ...s.saveBtn, opacity: logActionLoading ? 0.6 : 1 }} onClick={() => handleEditLogSubmit(log.id)} disabled={logActionLoading}>
                          {logActionLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button style={s.cancelBtn} onClick={() => setEditingLogId(null)} disabled={logActionLoading}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProjectDetail;
