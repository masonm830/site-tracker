import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { getToken } from '../utils/auth';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const inp = {
  width: '100%',
  border: '1.5px solid #e2e8f0',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#0f172a',
  background: '#f8fafc',
  outline: 'none',
  boxSizing: 'border-box',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TradeActivity() {
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('');
  const [filterIssues, setFilterIssues] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    project_id: '',
    trade_company: '',
    work_description: '',
    is_issue: false,
    issue_description: '',
    photo_urls: [],
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const fileInputRef = useRef();
  const editFileRef = useRef();

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };
    Promise.all([
      axios.get(`${API}/api/projects`, { headers }),
      axios.get(`${API}/api/trade-logs`, { headers }),
    ]).then(([pRes, lRes]) => {
      setProjects(pRes.data);
      setLogs(lRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));

  const filtered = logs.filter(l => {
    if (filterProject && l.project_id !== filterProject) return false;
    if (filterIssues && !l.is_issue) return false;
    return true;
  });

  async function uploadPhotos(files) {
    const headers = { Authorization: `Bearer ${getToken()}` };
    const urls = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`${API}/api/upload`, fd, { headers });
      urls.push(res.data.url);
    }
    return urls;
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await uploadPhotos(files);
      setForm(f => ({ ...f, photo_urls: [...f.photo_urls, ...urls] }));
    } catch {
      alert('Photo upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleEditFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await uploadPhotos(files);
      setEditForm(f => ({ ...f, photo_urls: [...(f.photo_urls || []), ...urls] }));
    } catch {
      alert('Photo upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit() {
    if (!form.project_id || !form.trade_company || !form.work_description) {
      alert('Project, trade company, and work description are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${API}/api/trade-logs`, form, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setLogs(prev => [res.data, ...prev]);
      setShowForm(false);
      setForm({ project_id: '', trade_company: '', work_description: '', is_issue: false, issue_description: '', photo_urls: [] });
    } catch {
      alert('Failed to save trade log.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(log) {
    setEditingId(log.id);
    setEditForm({
      trade_company: log.trade_company,
      work_description: log.work_description,
      is_issue: log.is_issue,
      issue_description: log.issue_description || '',
      photo_urls: log.photo_urls || [],
    });
    setConfirmDeleteId(null);
  }

  async function handleEditSave(id) {
    setSaving(true);
    try {
      const res = await axios.patch(`${API}/api/trade-logs/${id}`, editForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setLogs(prev => prev.map(l => l.id === id ? res.data : l));
      setEditingId(null);
    } catch {
      alert('Failed to update trade log.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`${API}/api/trade-logs/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setLogs(prev => prev.filter(l => l.id !== id));
      setConfirmDeleteId(null);
    } catch {
      alert('Failed to delete trade log.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#707880' }}>
      <Header />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Trade Activity</h1>
            <p style={{ fontSize: 14, color: '#cbd5e1', marginTop: 4 }}>
              {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            style={{
              background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {showForm ? '✕ Cancel' : '+ Log Activity'}
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            style={{ ...inp, width: 'auto', minWidth: 180 }}
          >
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#475569' }}>
            <input
              type="checkbox"
              checked={filterIssues}
              onChange={e => setFilterIssues(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            Issues only
          </label>
        </div>

        {/* Inline form */}
        {showForm && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            boxShadow: '0 0 0 2px #3b82f6, 0 4px 16px rgba(59,130,246,0.1)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Log Trade Activity</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Project *</label>
                <select
                  value={form.project_id}
                  onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                  style={inp}
                >
                  <option value="">Select project…</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Trade Company *</label>
                <input
                  style={inp}
                  placeholder="e.g. ABC Electrical"
                  value={form.trade_company}
                  onChange={e => setForm(f => ({ ...f, trade_company: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Work Description *</label>
              <textarea
                style={{ ...inp, minHeight: 80, resize: 'vertical' }}
                placeholder="What work was performed…"
                value={form.work_description}
                onChange={e => setForm(f => ({ ...f, work_description: e.target.value }))}
              />
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div
                  onClick={() => setForm(f => ({ ...f, is_issue: !f.is_issue }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: form.is_issue ? '#ef4444' : '#cbd5e1',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: form.is_issue ? 22 : 3,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: form.is_issue ? '#ef4444' : '#64748b' }}>
                  This is an issue / damage
                </span>
              </label>
            </div>
            {form.is_issue && (
              <div style={{ marginTop: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Issue Description</label>
                <textarea
                  style={{ ...inp, minHeight: 70, resize: 'vertical', borderColor: '#fca5a5' }}
                  placeholder="Describe the issue or damage…"
                  value={form.issue_description}
                  onChange={e => setForm(f => ({ ...f, issue_description: e.target.value }))}
                />
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Photos</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: form.photo_urls.length ? 10 : 0 }}>
                {form.photo_urls.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <button
                      onClick={() => setForm(f => ({ ...f, photo_urls: f.photo_urls.filter((_, j) => j !== i) }))}
                      style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                  </div>
                ))}
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ background: '#f1f5f9', color: '#475569', border: '1.5px dashed #cbd5e1', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {uploading ? 'Uploading…' : '+ Add Photos'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={handleSubmit}
                disabled={saving || uploading}
                style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving…' : 'Save Log'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 18px', fontSize: 14, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Log list */}
        {loading ? (
          <p style={{ color: '#e2e8f0', textAlign: 'center', paddingTop: 60 }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>No activity logged yet</div>
            <div style={{ fontSize: 14 }}>Click "Log Activity" to get started.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(log => {
              if (editingId === log.id) {
                return (
                  <div key={log.id} style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 0 0 2px #3b82f6' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Edit Log</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Trade Company</label>
                        <input style={inp} value={editForm.trade_company || ''} onChange={e => setEditForm(f => ({ ...f, trade_company: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Work Description</label>
                      <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={editForm.work_description || ''} onChange={e => setEditForm(f => ({ ...f, work_description: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div
                        onClick={() => setEditForm(f => ({ ...f, is_issue: !f.is_issue }))}
                        style={{ width: 44, height: 24, borderRadius: 12, background: editForm.is_issue ? '#ef4444' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                      >
                        <div style={{ position: 'absolute', top: 3, left: editForm.is_issue ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: editForm.is_issue ? '#ef4444' : '#64748b' }}>Issue / damage</span>
                    </div>
                    {editForm.is_issue && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Issue Description</label>
                        <textarea style={{ ...inp, minHeight: 60, resize: 'vertical', borderColor: '#fca5a5' }} value={editForm.issue_description || ''} onChange={e => setEditForm(f => ({ ...f, issue_description: e.target.value }))} />
                      </div>
                    )}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Photos</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: (editForm.photo_urls || []).length ? 10 : 0 }}>
                        {(editForm.photo_urls || []).map((url, i) => (
                          <div key={i} style={{ position: 'relative' }}>
                            <img src={url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                            <button onClick={() => setEditForm(f => ({ ...f, photo_urls: f.photo_urls.filter((_, j) => j !== i) }))} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10 }}>✕</button>
                          </div>
                        ))}
                      </div>
                      <input type="file" ref={editFileRef} accept="image/*" multiple style={{ display: 'none' }} onChange={handleEditFileChange} />
                      <button onClick={() => editFileRef.current?.click()} disabled={uploading} style={{ background: '#f1f5f9', color: '#475569', border: '1.5px dashed #cbd5e1', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {uploading ? 'Uploading…' : '+ Add Photos'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleEditSave(log.id)} disabled={saving} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={log.id}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    borderLeft: log.is_issue ? '4px solid #ef4444' : '4px solid transparent',
                  }}
                >
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{log.trade_company}</span>
                          {log.is_issue && (
                            <span style={{ fontSize: 11, fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Issue
                            </span>
                          )}
                          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{projectMap[log.project_id] || 'Unknown Project'}</span>
                        </div>
                        <p style={{ fontSize: 14, color: '#374151', margin: '0 0 6px', lineHeight: 1.5 }}>{log.work_description}</p>
                        {log.is_issue && log.issue_description && (
                          <p style={{ fontSize: 13, color: '#dc2626', margin: '0 0 6px', background: '#fef2f2', borderRadius: 6, padding: '6px 10px', lineHeight: 1.5 }}>
                            {log.issue_description}
                          </p>
                        )}
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(log.created_at)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => startEdit(log)}
                          style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                        >Edit</button>
                        <button
                          onClick={() => setConfirmDeleteId(log.id)}
                          style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                        >Delete</button>
                      </div>
                    </div>
                    {(log.photo_urls || []).length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        {log.photo_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  {confirmDeleteId === log.id && (
                    <div style={{ borderTop: '1px solid #fecaca', background: '#fef2f2', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500, flex: 1 }}>Delete this log entry?</span>
                      <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 7, padding: '5px 14px', fontSize: 13, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Cancel</button>
                      <button onClick={() => handleDelete(log.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
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

export default TradeActivity;
