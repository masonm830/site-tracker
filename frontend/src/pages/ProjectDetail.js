import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { getToken, isAdmin } from '../utils/auth';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc' },
  main: { maxWidth: 760, margin: '0 auto', padding: '32px 20px' },
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#64748b',
    fontSize: 14,
    marginBottom: 20,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: 'inherit',
  },
  projectCard: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: '24px 28px',
    marginBottom: 24,
  },
  projectName: { fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: 4 },
  projectAddress: { fontSize: 15, color: '#64748b', marginBottom: 16 },
  metaRow: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap',
    paddingTop: 16,
    borderTop: '1px solid #f1f5f9',
    fontSize: 14,
  },
  metaItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  metaLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' },
  metaValue: { color: '#1e293b', fontWeight: 500 },
  shareBtn: {
    background: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'inherit',
  },
  editProjectBtn: {
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'inherit',
  },
  shareConfirm: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    color: '#1d4ed8',
    marginTop: 12,
    wordBreak: 'break-all',
  },
  inlineEditForm: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '16px',
    marginTop: 16,
  },
  inlineEditTitle: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 },
  fieldGroup: { marginBottom: 10 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 },
  input: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '7px 10px',
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#0f172a',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inlineActions: { display: 'flex', gap: 8, marginTop: 4 },
  saveBtn: {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '7px 16px',
    fontSize: 13,
    cursor: 'pointer',
    color: '#475569',
    fontFamily: 'inherit',
  },
  logFormCard: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: '24px 28px',
    marginBottom: 24,
  },
  sectionTitle: { fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 16 },
  textarea: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 15,
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: 100,
    outline: 'none',
    color: '#0f172a',
    background: '#fff',
    marginBottom: 16,
    boxSizing: 'border-box',
  },
  fileLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '2px dashed #d1d5db',
    borderRadius: 8,
    padding: '14px 18px',
    cursor: 'pointer',
    marginBottom: 16,
    fontSize: 14,
    color: '#64748b',
    transition: 'border-color 0.15s',
  },
  fileInput: { display: 'none' },
  preview: {
    width: '100%',
    maxHeight: 220,
    objectFit: 'cover',
    borderRadius: 8,
    marginBottom: 16,
    border: '1px solid #e2e8f0',
  },
  submitBtn: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '11px 24px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  timeline: { display: 'flex', flexDirection: 'column', gap: 16 },
  timelineEntry: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  entryPhoto: { width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 3,
  },
  photoGridImg: { width: '100%', height: 180, objectFit: 'cover', display: 'block' },
  photoBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: '#f1f5f9',
    color: '#475569',
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 500,
    marginLeft: 8,
  },
  entryBody: { padding: '16px 20px' },
  entryNote: { fontSize: 15, color: '#1e293b', lineHeight: 1.6, marginBottom: 10 },
  entryDate: { fontSize: 12, color: '#94a3b8' },
  editThumbGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  editThumbWrapper: { position: 'relative', display: 'inline-block' },
  editThumbImg: {
    width: 72,
    height: 72,
    objectFit: 'cover',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    display: 'block',
  },
  editThumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: 20,
    height: 20,
    fontSize: 11,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    lineHeight: 1,
  },
  editThumbNew: {
    border: '2px solid #3b82f6',
  },
  entryActions: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #f1f5f9',
  },
  logEditBtn: {
    background: 'none',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: '#475569',
    fontFamily: 'inherit',
    fontWeight: 500,
  },
  logDeleteBtn: {
    background: 'none',
    border: '1px solid #fca5a5',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: '#dc2626',
    fontFamily: 'inherit',
    fontWeight: 500,
  },
  logConfirmText: { fontSize: 12, color: '#64748b', alignSelf: 'center' },
  logConfirmYes: {
    background: '#dc2626',
    border: 'none',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: '#fff',
    fontFamily: 'inherit',
    fontWeight: 500,
  },
  logConfirmNo: {
    background: 'none',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: '#475569',
    fontFamily: 'inherit',
  },
  logEditArea: {
    padding: '12px 20px',
    borderTop: '1px solid #f1f5f9',
    background: '#f8fafc',
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
    display: 'block',
  },
  currentPhotoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  currentThumb: {
    width: 64,
    height: 48,
    objectFit: 'cover',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    flexShrink: 0,
  },
  removePhotoBtn: {
    background: 'none',
    border: '1px solid #fca5a5',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    color: '#dc2626',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  photoRemovedNote: {
    fontSize: 12,
    color: '#dc2626',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    padding: '6px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  undoBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'underline',
    padding: 0,
  },
  newPhotoPreviewRow: {
    position: 'relative',
    marginBottom: 8,
    display: 'inline-block',
  },
  clearNewPhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    background: 'rgba(15,23,42,0.7)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: 22,
    height: 22,
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    fontFamily: 'inherit',
  },
  noLogs: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#94a3b8',
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    fontSize: 15,
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 16,
  },
  uploadProgress: {
    fontSize: 13,
    color: '#3b82f6',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
};

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
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

  // Project edit state
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({});
  const [projectEditLoading, setProjectEditLoading] = useState(false);

  // Log actions state
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
      .then(res => {
        setProject(res.data);
        setLogs(res.data.logs || []);
      })
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
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await axios.post(`${API}/api/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${getToken()}`,
          },
        });
        photo_url = uploadRes.data.url;
      }

      setUploadStage('Saving log...');
      const logRes = await axios.post(`${API}/api/logs`, {
        project_id: id,
        note: note.trim(),
        photo_url,
      }, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setLogs(prev => [logRes.data, ...prev]);
      setNote('');
      setFile(null);
      setPreviewUrl(null);
      setUploadStage(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setLogError(err.response?.data?.detail || 'Failed to save log. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadStage(null);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/share/${project.share_token}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    });
  }

  function startEditProject() {
    setProjectForm({
      name: project.name,
      address: project.address,
      client_name: project.client_name,
      client_email: project.client_email,
    });
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
      await axios.delete(`${API}/api/logs/${logId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
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

  function removeExistingPhoto(url) {
    setLogEditExistingPhotos(prev => prev.filter(u => u !== url));
  }

  function removeNewFile(index) {
    setLogEditNewFiles(prev => prev.filter((_, i) => i !== index));
    setLogEditNewPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleEditLogSubmit(logId) {
    setLogActionLoading(true);
    try {
      const uploadedUrls = [];
      for (const file of logEditNewFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await axios.post(`${API}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${getToken()}` },
        });
        uploadedUrls.push(uploadRes.data.url);
      }
      const body = {
        note: logEditNote,
        photo_urls: [...logEditExistingPhotos, ...uploadedUrls],
      };
      const res = await axios.patch(`${API}/api/logs/${logId}`, body, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, ...res.data } : l));
      setEditingLogId(null);
      setLogEditExistingPhotos([]);
      setLogEditNewFiles([]);
      setLogEditNewPreviews([]);
      if (logEditFileRef.current) logEditFileRef.current.value = '';
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update log.');
    } finally {
      setLogActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <Header />
        <p style={{ textAlign: 'center', paddingTop: 60, color: '#94a3b8' }}>Loading project...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Header />
      <main style={styles.main}>
        <button style={styles.back} onClick={() => navigate('/')}>
          ← All Projects
        </button>

        {/* Project info */}
        <div style={styles.projectCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={styles.projectName}>{project.name}</h1>
              <p style={styles.projectAddress}>{project.address}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {admin && !editingProject && (
                <button style={styles.editProjectBtn} onClick={startEditProject}>
                  Edit Project
                </button>
              )}
              <button style={styles.shareBtn} onClick={handleShare}>
                🔗 Share with Client
              </button>
            </div>
          </div>

          {shareCopied && (
            <div style={styles.shareConfirm}>
              ✓ Link copied! Share this with {project.client_name}:
              <br />
              {window.location.origin}/share/{project.share_token}
            </div>
          )}

          {editingProject && (
            <div style={styles.inlineEditForm}>
              <div style={styles.inlineEditTitle}>Edit Project Details</div>
              <div style={styles.fieldRow}>
                <div>
                  <label style={styles.label}>Project Name</label>
                  <input
                    style={styles.input}
                    value={projectForm.name || ''}
                    onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={styles.label}>Site Address</label>
                  <input
                    style={styles.input}
                    value={projectForm.address || ''}
                    onChange={e => setProjectForm(f => ({ ...f, address: e.target.value }))}
                  />
                </div>
              </div>
              <div style={styles.fieldRow}>
                <div>
                  <label style={styles.label}>Client Name</label>
                  <input
                    style={styles.input}
                    value={projectForm.client_name || ''}
                    onChange={e => setProjectForm(f => ({ ...f, client_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={styles.label}>Client Email</label>
                  <input
                    style={styles.input}
                    type="email"
                    value={projectForm.client_email || ''}
                    onChange={e => setProjectForm(f => ({ ...f, client_email: e.target.value }))}
                  />
                </div>
              </div>
              <div style={styles.inlineActions}>
                <button
                  style={{ ...styles.saveBtn, opacity: projectEditLoading ? 0.6 : 1 }}
                  onClick={handleEditProjectSubmit}
                  disabled={projectEditLoading}
                >
                  {projectEditLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  style={styles.cancelBtn}
                  onClick={() => setEditingProject(false)}
                  disabled={projectEditLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={styles.metaRow}>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Client</span>
              <span style={styles.metaValue}>{project.client_name}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Email</span>
              <span style={styles.metaValue}>{project.client_email}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Log Entries</span>
              <span style={styles.metaValue}>{logs.length}</span>
            </div>
          </div>
        </div>

        {/* Log entry form */}
        <div style={styles.logFormCard}>
          <h2 style={styles.sectionTitle}>Add Log Entry</h2>
          <form onSubmit={handleSubmit}>
            {logError && <div style={styles.error}>{logError}</div>}

            <label style={styles.label}>Note</label>
            <textarea
              style={styles.textarea}
              placeholder="Describe today's progress, observations, or next steps..."
              value={note}
              onChange={e => setNote(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />

            <label style={styles.label}>Photo (optional)</label>
            <label
              style={styles.fileLabel}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}
            >
              <span style={{ fontSize: 20 }}>📷</span>
              <span>{file ? file.name : 'Click to attach a photo'}</span>
              <input
                ref={fileRef}
                style={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>

            {previewUrl && (
              <img src={previewUrl} alt="Preview" style={styles.preview} />
            )}

            {uploadStage && (
              <div style={styles.uploadProgress}>
                <span>⏳</span> {uploadStage}
              </div>
            )}

            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                background: submitting ? '#93c5fd' : '#3b82f6',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Add Log Entry'}
            </button>
          </form>
        </div>

        {/* Timeline */}
        <h2 style={{ ...styles.sectionTitle, marginBottom: 16 }}>
          Progress Timeline
          {logs.length > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b', marginLeft: 8 }}>({logs.length} entries)</span>}
        </h2>

        {logs.length === 0 ? (
          <div style={styles.noLogs}>No log entries yet. Add your first one above.</div>
        ) : (
          <div style={styles.timeline}>
            {logs.map(log => (
              <div key={log.id} style={styles.timelineEntry}>
                {(log.photo_urls || []).length === 1 && (
                  <img src={log.photo_urls[0]} alt="Site" style={styles.entryPhoto} />
                )}
                {(log.photo_urls || []).length > 1 && (
                  <div style={styles.photoGrid}>
                    {log.photo_urls.map((url, i) => (
                      <img key={i} src={url} alt={`Site photo ${i + 1}`} style={styles.photoGridImg} />
                    ))}
                  </div>
                )}
                <div style={styles.entryBody}>
                  {log.note && <p style={styles.entryNote}>{log.note}</p>}
                  <span style={styles.entryDate}>Posted: {formatDateTime(log.created_at)}</span>
                  {log.updated_at && (
                    <span style={{ ...styles.entryDate, marginLeft: 12 }}>
                      Updated: {formatDateTime(log.updated_at)}
                    </span>
                  )}
                  {(log.photo_urls || []).length > 0 && (
                    <span style={styles.photoBadge}>
                      📷 {log.photo_urls.length} {log.photo_urls.length === 1 ? 'photo' : 'photos'}
                    </span>
                  )}

                  <div style={styles.entryActions}>
                    {editingLogId === log.id ? (
                      <>
                        <span style={styles.logConfirmText}>Editing...</span>
                        <button
                          style={styles.logConfirmNo}
                          onClick={() => setEditingLogId(null)}
                          disabled={logActionLoading}
                        >
                          Cancel
                        </button>
                      </>
                    ) : confirmDeleteLogId === log.id ? (
                      <>
                        <span style={styles.logConfirmText}>Delete this entry?</span>
                        <button
                          style={{ ...styles.logConfirmYes, opacity: logActionLoading ? 0.6 : 1 }}
                          onClick={() => handleDeleteLog(log.id)}
                          disabled={logActionLoading}
                        >
                          {logActionLoading ? '...' : 'Delete'}
                        </button>
                        <button
                          style={styles.logConfirmNo}
                          onClick={() => setConfirmDeleteLogId(null)}
                          disabled={logActionLoading}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button style={styles.logEditBtn} onClick={() => startEditLog(log)}>
                          Edit
                        </button>
                        <button style={styles.logDeleteBtn} onClick={() => { setConfirmDeleteLogId(log.id); setEditingLogId(null); }}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingLogId === log.id && (
                  <div style={styles.logEditArea}>
                    <label style={styles.label}>Note</label>
                    <textarea
                      style={{ ...styles.textarea, minHeight: 80, marginBottom: 8 }}
                      value={logEditNote}
                      onChange={e => setLogEditNote(e.target.value)}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e => e.target.style.borderColor = '#d1d5db'}
                    />
                    {/* Photo management */}
                    <span style={styles.photoLabel}>
                      Photos
                      {(logEditExistingPhotos.length + logEditNewFiles.length) > 0 && (
                        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>
                          ({logEditExistingPhotos.length + logEditNewFiles.length})
                        </span>
                      )}
                    </span>

                    <div style={styles.editThumbGrid}>
                      {/* Existing photos */}
                      {logEditExistingPhotos.map((url, i) => (
                        <div key={`ex-${i}`} style={styles.editThumbWrapper}>
                          <img src={url} alt={`Photo ${i + 1}`} style={styles.editThumbImg} />
                          <button
                            style={styles.editThumbRemove}
                            onClick={() => removeExistingPhoto(url)}
                            type="button"
                            title="Remove photo"
                          >✕</button>
                        </div>
                      ))}
                      {/* New photos staged for upload */}
                      {logEditNewPreviews.map((preview, i) => (
                        <div key={`new-${i}`} style={styles.editThumbWrapper}>
                          <img src={preview} alt={`New photo ${i + 1}`} style={{ ...styles.editThumbImg, ...styles.editThumbNew }} />
                          <button
                            style={styles.editThumbRemove}
                            onClick={() => removeNewFile(i)}
                            type="button"
                            title="Remove"
                          >✕</button>
                        </div>
                      ))}
                    </div>

                    {/* Add photos picker */}
                    <label
                      style={{ ...styles.fileLabel, marginBottom: 8 }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}
                    >
                      <span style={{ fontSize: 16 }}>📷</span>
                      <span style={{ fontSize: 13 }}>Add photos</span>
                      <input
                        ref={logEditFileRef}
                        style={styles.fileInput}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleLogEditFileChange}
                      />
                    </label>
                    <div style={styles.inlineActions}>
                      <button
                        style={{ ...styles.saveBtn, opacity: logActionLoading ? 0.6 : 1 }}
                        onClick={() => handleEditLogSubmit(log.id)}
                        disabled={logActionLoading}
                      >
                        {logActionLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        style={styles.cancelBtn}
                        onClick={() => setEditingLogId(null)}
                        disabled={logActionLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProjectDetail;
