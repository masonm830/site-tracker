import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { getToken, isAdmin } from '../utils/auth';

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

function Projects() {
  const navigate = useNavigate();

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin()) navigate('/progress', { replace: true });
  }, [navigate]);

  const [projects, setProjects] = useState([]);
  const [punchCounts, setPunchCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin()) return;
    const headers = { Authorization: `Bearer ${getToken()}` };
    Promise.all([
      axios.get(`${API}/api/projects`, { headers }),
      axios.get(`${API}/api/punch-list`, { headers }),
    ]).then(([pRes, plRes]) => {
      setProjects(pRes.data);
      // Count punch list items per project
      const counts = {};
      for (const item of plRes.data) {
        counts[item.project_id] = (counts[item.project_id] || 0) + 1;
      }
      setPunchCounts(counts);
    }).finally(() => setLoading(false));
  }, []);

  function startEdit(p) {
    setEditingId(p.id);
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
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update project.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(projectId) {
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

  if (!isAdmin()) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#707880' }}>
      <Header right={
        <button
          onClick={() => navigate('/projects/new')}
          style={{
            background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
        >
          + New Project
        </button>
      } />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Projects</h1>
          <p style={{ fontSize: 14, color: '#cbd5e1', marginTop: 4 }}>
            {loading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <p style={{ color: '#e2e8f0', textAlign: 'center', paddingTop: 60 }}>Loading projects…</p>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>No projects yet</div>
            <button
              onClick={() => navigate('/projects/new')}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + New Project
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1.5fr 90px 90px 120px',
              gap: 0,
              padding: '11px 20px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}>
              <span>Project</span>
              <span>Address</span>
              <span>Client</span>
              <span style={{ textAlign: 'center' }}>Logs</span>
              <span style={{ textAlign: 'center' }}>Punch Items</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {projects.map((p, idx) => {
              if (editingId === p.id) {
                return (
                  <div key={p.id} style={{ padding: '20px 20px', borderBottom: idx < projects.length - 1 ? '1px solid #f1f5f9' : 'none', background: '#eff6ff' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 14 }}>Edit Project</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Project Name</label>
                        <input style={inp} value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Address</label>
                        <input style={inp} value={editForm.address || ''} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Client Name</label>
                        <input style={inp} value={editForm.client_name || ''} onChange={e => setEditForm(f => ({ ...f, client_name: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Client Email</label>
                        <input style={inp} type="email" value={editForm.client_email || ''} onChange={e => setEditForm(f => ({ ...f, client_email: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEditSubmit(p.id)}
                        disabled={actionLoading}
                        style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: actionLoading ? 0.6 : 1 }}
                      >
                        {actionLoading ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditForm({}); }}
                        disabled={actionLoading}
                        style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              const isConfirmingDelete = confirmDeleteId === p.id;

              return (
                <div key={p.id} style={{ borderBottom: idx < projects.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 2fr 1.5fr 90px 90px 120px',
                      gap: 0,
                      padding: '16px 20px',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div onClick={() => navigate(`/projects/${p.id}`)}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(p.created_at)}</div>
                    </div>
                    <div onClick={() => navigate(`/projects/${p.id}`)} style={{ fontSize: 13, color: '#475569', paddingRight: 16 }}>{p.address}</div>
                    <div onClick={() => navigate(`/projects/${p.id}`)}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{p.client_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.client_email}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#3b82f6' }}>{(p.logs || []).length}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>{punchCounts[p.id] || 0}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={e => { e.stopPropagation(); startEdit(p); }}
                        style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                      >Edit</button>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(p.id); setEditingId(null); }}
                        style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                      >Delete</button>
                    </div>
                  </div>

                  {isConfirmingDelete && (
                    <div style={{ borderTop: '1px solid #fecaca', background: '#fef2f2', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500, flex: 1 }}>Delete "{p.name}" and all its data?</span>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={actionLoading}
                        style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 7, padding: '5px 14px', fontSize: 13, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}
                      >Cancel</button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={actionLoading}
                        style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: actionLoading ? 0.6 : 1 }}
                      >{actionLoading ? '…' : 'Delete'}</button>
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

export default Projects;
