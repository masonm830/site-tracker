import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

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
  logFormCard: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: '24px 28px',
    marginBottom: 24,
  },
  sectionTitle: { fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
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
  entryBody: { padding: '16px 20px' },
  entryNote: { fontSize: 15, color: '#1e293b', lineHeight: 1.6, marginBottom: 10 },
  entryDate: { fontSize: 12, color: '#94a3b8' },
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
  const fileRef = useRef();

  useEffect(() => {
    axios.get(`${API}/api/projects/${id}`)
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
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        photo_url = uploadRes.data.url;
      }

      setUploadStage('Saving log...');
      const logRes = await axios.post(`${API}/api/logs`, {
        project_id: id,
        note: note.trim(),
        photo_url,
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
            <button style={styles.shareBtn} onClick={handleShare}>
              🔗 Share with Client
            </button>
          </div>

          {shareCopied && (
            <div style={styles.shareConfirm}>
              ✓ Link copied! Share this with {project.client_name}:
              <br />
              {window.location.origin}/share/{project.share_token}
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
                {log.photo_url && (
                  <img src={log.photo_url} alt="Site" style={styles.entryPhoto} />
                )}
                <div style={styles.entryBody}>
                  {log.note && <p style={styles.entryNote}>{log.note}</p>}
                  <span style={styles.entryDate}>{formatDateTime(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProjectDetail;
