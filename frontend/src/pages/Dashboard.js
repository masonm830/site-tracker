import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { getToken, isAdmin } from '../utils/auth';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const COVER_COLORS = ['#1e3a5f', '#064e3b', '#4c1d95', '#7c2d12', '#134e4a', '#1e1b4b', '#3b0764'];

function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}
function getCoverColor(name) {
  return COVER_COLORS[name.charCodeAt(0) % COVER_COLORS.length];
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9' },
  main: { maxWidth: 1200, margin: '0 auto', padding: '36px 24px' },
  topRow: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    marginBottom: 32, flexWrap: 'wrap', gap: 16,
  },
  heading: { fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' },
  subheading: { fontSize: 14, color: '#64748b', marginTop: 4 },
  newBtn: {
    background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10,
    padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
    letterSpacing: '-0.2px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  },
  // Card
  card: {
    background: '#fff', borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
    cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s',
    position: 'relative',
  },
  cover: {
    height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  initials: {
    fontSize: 32, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '-1px',
  },
  coverOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.25) 100%)',
  },
  adminBtns: {
    position: 'absolute', top: 10, right: 10,
    display: 'flex', gap: 6, zIndex: 2,
  },
  iconBtn: {
    width: 30, height: 30, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer', fontSize: 13,
    background: 'rgba(15,23,42,0.55)', color: '#fff',
    backdropFilter: 'blur(4px)',
    transition: 'background 0.15s',
  },
  cardBody: { padding: '16px 20px 20px' },
  cardName: { fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 4, lineHeight: 1.3, letterSpacing: '-0.2px' },
  cardAddress: { fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.5 },
  cardMeta: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTop: '1px solid #f1f5f9',
  },
  clientPill: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  clientAvatar: {
    width: 22, height: 22, borderRadius: '50%', background: '#e2e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, color: '#475569', flexShrink: 0,
  },
  clientName: { fontSize: 13, fontWeight: 600, color: '#475569' },
  cardDate: { fontSize: 12, color: '#94a3b8' },
  // Delete confirm strip
  deleteStrip: {
    borderTop: '1px solid #fecaca', padding: '10px 20px',
    background: '#fef2f2', display: 'flex', alignItems: 'center', gap: 10,
  },
  deleteStripText: { fontSize: 13, color: '#dc2626', fontWeight: 500, flex: 1 },
  deleteYes: {
    background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7,
    padding: '5px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  deleteNo: {
    background: 'none', border: '1px solid #fca5a5', borderRadius: 7,
    padding: '5px 14px', fontSize: 13, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit',
  },
  // Edit form
  editCard: {
    background: '#fff', borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 0 0 2px #3b82f6, 0 4px 16px rgba(59,130,246,0.15)',
    padding: '24px',
  },
  editTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 },
  fieldGroup: { marginBottom: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 },
  input: {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8,
    padding: '8px 12px', fontSize: 14, fontFamily: 'inherit',
    color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
  },
  editActions: { display: 'flex', gap: 8, marginTop: 16 },
  saveBtn: {
    background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8,
    padding: '9px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  cancelBtn: {
    background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8,
    padding: '9px 20px', fontSize: 14, cursor: 'pointer', color: '#475569', fontFamily: 'inherit',
  },
  // Empty
  empty: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8, letterSpacing: '-0.3px' },
  emptyText: { fontSize: 15, color: '#64748b', marginBottom: 24 },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
    padding: '14px 18px', color: '#dc2626', marginBottom: 24,
  },
};

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  const admin = isAdmin();

  useEffect(() => {
    axios.get(`${API}/api/projects`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => setProjects(res.data))
      .catch(() => setError('Could not load projects. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(p) {
    setEditingProjectId(p.id);
    setEditForm({ name: p.name, address: p.address, client_name: p.client_name, client_email: p.client_email });
    setConfirmDeleteId(null);
  }

  async function handleEditSubmit(projectId) {
    setActionLoading(true);
    try {
      const res = await axios.patch(`${API}/api/projects/${projectId}`, editForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...res.data } : p));
      setEditingProjectId(null);
      setEditForm({});
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update project.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteProject(projectId) {
    setActionLoading(true);
    try {
      await axios.delete(`${API}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setConfirmDeleteId(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete project.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <Header right={
        <button
          style={s.newBtn}
          onClick={() => navigate('/projects/new')}
          onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
        >
          + New Project
        </button>
      } />

      <main style={s.main}>
        <div style={s.topRow}>
          <div>
            <h1 style={s.heading}>Projects</h1>
            <p style={s.subheading}>
              {loading ? 'Loading...' : `${projects.length} active project${projects.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', paddingTop: 60, fontSize: 15 }}>
            Loading projects...
          </p>
        ) : projects.length === 0 && !error ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🏗️</div>
            <div style={s.emptyTitle}>No projects yet</div>
            <p style={s.emptyText}>Create your first project to start tracking progress.</p>
            <button
              style={s.newBtn}
              onClick={() => navigate('/projects/new')}
              onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
            >
              + New Project
            </button>
          </div>
        ) : (
          <div style={s.grid}>
            {projects.map(p => {
              if (editingProjectId === p.id) {
                return (
                  <div key={p.id} style={s.editCard}>
                    <div style={s.editTitle}>Edit Project</div>
                    {[
                      { field: 'name', label: 'Project Name' },
                      { field: 'address', label: 'Site Address' },
                      { field: 'client_name', label: 'Client Name' },
                      { field: 'client_email', label: 'Client Email', type: 'email' },
                    ].map(({ field, label, type }) => (
                      <div key={field} style={s.fieldGroup}>
                        <label style={s.label}>{label}</label>
                        <input
                          style={s.input}
                          type={type || 'text'}
                          value={editForm[field] || ''}
                          onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                          onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; }}
                          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                        />
                      </div>
                    ))}
                    <div style={s.editActions}>
                      <button
                        style={{ ...s.saveBtn, opacity: actionLoading ? 0.6 : 1 }}
                        onClick={() => handleEditSubmit(p.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        style={s.cancelBtn}
                        onClick={() => { setEditingProjectId(null); setEditForm({}); }}
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              const color = getCoverColor(p.name);
              const initials = getInitials(p.name);
              const isConfirmingDelete = confirmDeleteId === p.id;

              return (
                <div
                  key={p.id}
                  style={s.card}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {/* Cover area */}
                  <div style={{ ...s.cover, background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}>
                    <div style={s.coverOverlay} />
                    <span style={s.initials}>{initials}</span>
                  </div>

                  {/* Admin icon buttons */}
                  {admin && (
                    <div style={s.adminBtns}>
                      <button
                        style={s.iconBtn}
                        title="Edit project"
                        onClick={e => { e.stopPropagation(); startEdit(p); }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.8)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,23,42,0.55)'}
                      >
                        ✏
                      </button>
                      <button
                        style={s.iconBtn}
                        title="Delete project"
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(p.id); setEditingProjectId(null); }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.8)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,23,42,0.55)'}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Clickable body */}
                  <div
                    style={s.cardBody}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <div style={s.cardName}>{p.name}</div>
                    <div style={s.cardAddress}>{p.address}</div>
                    <div style={s.cardMeta}>
                      <div style={s.clientPill}>
                        <div style={s.clientAvatar}>
                          {p.client_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={s.clientName}>{p.client_name}</span>
                      </div>
                      <span style={s.cardDate}>{formatDate(p.created_at)}</span>
                    </div>
                  </div>

                  {/* Inline delete confirmation */}
                  {isConfirmingDelete && (
                    <div style={s.deleteStrip}>
                      <span style={s.deleteStripText}>Delete this project and all its data?</span>
                      <button
                        style={{ ...s.deleteNo }}
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                      <button
                        style={{ ...s.deleteYes, opacity: actionLoading ? 0.6 : 1 }}
                        onClick={e => { e.stopPropagation(); handleDeleteProject(p.id); }}
                        disabled={actionLoading}
                      >
                        {actionLoading ? '...' : 'Delete'}
                      </button>
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

export default Dashboard;
