import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { getToken } from '../utils/auth';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const STATUS_CYCLE = { open: 'in_progress', in_progress: 'completed', completed: 'open' };

const STATUS_STYLE = {
  open: { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
  in_progress: { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  completed: { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
};

const PRIORITY_STYLE = {
  low: { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' },
  medium: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  high: { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
};

const STATUS_LABEL = { open: 'Open', in_progress: 'In Progress', completed: 'Completed' };
const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' };

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

function Badge({ type, value, onClick }) {
  const style = type === 'status' ? STATUS_STYLE[value] : PRIORITY_STYLE[value];
  const label = type === 'status' ? STATUS_LABEL[value] : PRIORITY_LABEL[value];
  return (
    <span
      onClick={onClick}
      style={{
        fontSize: 11,
        fontWeight: 700,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: 6,
        padding: '2px 8px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PunchList() {
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    project_id: '',
    description: '',
    trade_responsible: '',
    priority: 'medium',
    due_date: '',
    photo_urls: [],
    notes: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [cyclingId, setCyclingId] = useState(null);
  const fileInputRef = useRef();
  const editFileRef = useRef();

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };
    Promise.all([
      axios.get(`${API}/api/projects`, { headers }),
      axios.get(`${API}/api/punch-list`, { headers }),
    ]).then(([pRes, iRes]) => {
      setProjects(pRes.data);
      setItems(iRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));

  const filtered = items.filter(item => {
    if (filterProject && item.project_id !== filterProject) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    if (filterPriority && item.priority !== filterPriority) return false;
    return true;
  });

  const counts = {
    open: items.filter(i => i.status === 'open').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    completed: items.filter(i => i.status === 'completed').length,
  };

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
    if (!form.project_id || !form.description) {
      alert('Project and description are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.due_date) delete payload.due_date;
      const res = await axios.post(`${API}/api/punch-list`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setItems(prev => [res.data, ...prev]);
      setShowForm(false);
      setForm({ project_id: '', description: '', trade_responsible: '', priority: 'medium', due_date: '', photo_urls: [], notes: '' });
    } catch {
      alert('Failed to save item.');
    } finally {
      setSaving(false);
    }
  }

  async function cycleStatus(item) {
    const nextStatus = STATUS_CYCLE[item.status];
    setCyclingId(item.id);
    try {
      const payload = { status: nextStatus };
      const res = await axios.patch(`${API}/api/punch-list/${item.id}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setItems(prev => prev.map(i => i.id === item.id ? res.data : i));
    } catch {
      alert('Failed to update status.');
    } finally {
      setCyclingId(null);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditForm({
      description: item.description,
      trade_responsible: item.trade_responsible || '',
      priority: item.priority,
      due_date: item.due_date || '',
      notes: item.notes || '',
      photo_urls: item.photo_urls || [],
    });
    setConfirmDeleteId(null);
  }

  async function handleEditSave(id) {
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.due_date) payload.due_date = null;
      const res = await axios.patch(`${API}/api/punch-list/${id}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setItems(prev => prev.map(i => i.id === id ? res.data : i));
      setEditingId(null);
    } catch {
      alert('Failed to update item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`${API}/api/punch-list/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setItems(prev => prev.filter(i => i.id !== id));
      setConfirmDeleteId(null);
    } catch {
      alert('Failed to delete item.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#707880' }}>
      <Header />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Punch List</h1>
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {showForm ? '✕ Cancel' : '+ Add Item'}
          </button>
        </div>

        {/* Summary row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {['open', 'in_progress', 'completed'].map(s => (
            <div
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              style={{
                background: filterStatus === s ? STATUS_STYLE[s].bg : '#fff',
                border: `1.5px solid ${filterStatus === s ? STATUS_STYLE[s].border : '#e2e8f0'}`,
                borderRadius: 10,
                padding: '10px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 800, color: STATUS_STYLE[s].color }}>{counts[s]}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ ...inp, width: 'auto', minWidth: 160 }}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ ...inp, width: 'auto', minWidth: 130 }}>
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 0 0 2px #3b82f6, 0 4px 16px rgba(59,130,246,0.1)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Add Punch List Item</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Project *</label>
                <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} style={inp}>
                  <option value="">Select project…</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Trade Responsible</label>
                <input style={inp} placeholder="e.g. Plumbing" value={form.trade_responsible} onChange={e => setForm(f => ({ ...f, trade_responsible: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Description *</label>
              <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} placeholder="What needs to be done…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={inp}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Due Date</label>
                <input type="date" style={inp} value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notes</label>
              <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="Any additional notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Photos</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: form.photo_urls.length ? 10 : 0 }}>
                {form.photo_urls.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <button onClick={() => setForm(f => ({ ...f, photo_urls: f.photo_urls.filter((_, j) => j !== i) }))} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10 }}>✕</button>
                  </div>
                ))}
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ background: '#f1f5f9', color: '#475569', border: '1.5px dashed #cbd5e1', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {uploading ? 'Uploading…' : '+ Add Photos'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSubmit} disabled={saving || uploading} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Add Item'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 18px', fontSize: 14, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Item list */}
        {loading ? (
          <p style={{ color: '#e2e8f0', textAlign: 'center', paddingTop: 60 }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>No items found</div>
            <div style={{ fontSize: 14 }}>Click "Add Item" to create your first punch list item.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(item => {
              const isCompleted = item.status === 'completed';

              if (editingId === item.id) {
                return (
                  <div key={item.id} style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 0 0 2px #3b82f6' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Edit Item</div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Description</label>
                      <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Trade Responsible</label>
                        <input style={inp} value={editForm.trade_responsible || ''} onChange={e => setEditForm(f => ({ ...f, trade_responsible: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Priority</label>
                        <select style={inp} value={editForm.priority || 'medium'} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Due Date</label>
                        <input type="date" style={inp} value={editForm.due_date || ''} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notes</label>
                      <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
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
                      <button onClick={() => handleEditSave(item.id)} disabled={saving} style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    opacity: isCompleted ? 0.75 : 1,
                  }}
                >
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <Badge type="priority" value={item.priority} />
                          <Badge
                            type="status"
                            value={item.status}
                            onClick={() => cycleStatus(item)}
                          />
                          {cyclingId === item.id && <span style={{ fontSize: 11, color: '#94a3b8' }}>updating…</span>}
                        </div>
                        <p style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: isCompleted ? '#94a3b8' : '#0f172a',
                          margin: '0 0 6px',
                          lineHeight: 1.4,
                          textDecoration: isCompleted ? 'line-through' : 'none',
                        }}>
                          {item.description}
                        </p>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                          {item.trade_responsible && (
                            <span>Trade: <strong style={{ color: '#374151' }}>{item.trade_responsible}</strong></span>
                          )}
                          <span>Project: <strong style={{ color: '#374151' }}>{projectMap[item.project_id] || '—'}</strong></span>
                          {item.due_date && (
                            <span style={{ color: new Date(item.due_date) < new Date() && !isCompleted ? '#dc2626' : '#64748b' }}>
                              Due: <strong>{formatDate(item.due_date)}</strong>
                            </span>
                          )}
                          {isCompleted && item.completed_at && (
                            <span style={{ color: '#15803d' }}>Completed: <strong>{formatDate(item.completed_at)}</strong></span>
                          )}
                        </div>
                        {item.notes && (
                          <p style={{ fontSize: 13, color: '#64748b', margin: '8px 0 0', lineHeight: 1.5 }}>{item.notes}</p>
                        )}
                        {(item.photo_urls || []).length > 0 && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                            {item.photo_urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer">
                                <img src={url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => startEdit(item)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Edit</button>
                        <button onClick={() => setConfirmDeleteId(item.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Delete</button>
                      </div>
                    </div>
                  </div>
                  {confirmDeleteId === item.id && (
                    <div style={{ borderTop: '1px solid #fecaca', background: '#fef2f2', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500, flex: 1 }}>Delete this item?</span>
                      <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 7, padding: '5px 14px', fontSize: 13, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Cancel</button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
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

export default PunchList;
