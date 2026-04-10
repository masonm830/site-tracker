import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { getToken, isAdmin } from '../utils/auth';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc' },
  main: { maxWidth: 1100, margin: '0 auto', padding: '32px 20px' },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 12,
  },
  heading: { fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 },
  subheading: { fontSize: 14, color: '#64748b', marginTop: 4 },
  newBtn: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },
  cardWrapper: { display: 'flex', flexDirection: 'column' },
  card: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: '22px 24px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.15s',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottom: 'none',
  },
  cardNoActions: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: '22px 24px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.15s',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  cardBadge: {
    display: 'inline-block',
    background: '#eff6ff',
    color: '#2563eb',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 10,
  },
  cardName: { fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 6 },
  cardAddress: { fontSize: 14, color: '#64748b', marginBottom: 14, lineHeight: 1.4 },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTop: '1px solid #f1f5f9',
    fontSize: 13,
    color: '#94a3b8',
  },
  clientName: { fontWeight: 600, color: '#475569', fontSize: 13 },
  cardActions: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderTop: 'none',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: '8px 12px',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  editBtn: {
    background: 'none',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 13,
    cursor: 'pointer',
    color: '#475569',
    fontFamily: 'inherit',
    fontWeight: 500,
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid #fca5a5',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 13,
    cursor: 'pointer',
    color: '#dc2626',
    fontFamily: 'inherit',
    fontWeight: 500,
  },
  confirmText: { fontSize: 13, color: '#64748b' },
  confirmYes: {
    background: '#dc2626',
    border: 'none',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 13,
    cursor: 'pointer',
    color: '#fff',
    fontFamily: 'inherit',
    fontWeight: 500,
  },
  confirmNo: {
    background: 'none',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 13,
    cursor: 'pointer',
    color: '#475569',
    fontFamily: 'inherit',
  },
  editForm: {
    background: '#fff',
    border: '1px solid #3b82f6',
    borderRadius: 12,
    padding: '20px 24px',
  },
  editFormTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 },
  fieldGroup: { marginBottom: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 },
  input: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#0f172a',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  editActions: { display: 'flex', gap: 8, marginTop: 14 },
  saveBtn: {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '8px 18px',
    fontSize: 14,
    cursor: 'pointer',
    color: '#475569',
    fontFamily: 'inherit',
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#94a3b8',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 600, color: '#475569', marginBottom: 8 },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '14px 18px',
    color: '#dc2626',
    marginBottom: 20,
  },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

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

  function cancelEdit() {
    setEditingProjectId(null);
    setEditForm({});
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

  const admin = isAdmin();

  return (
    <div style={styles.page}>
      <Header right={
        <button style={styles.newBtn} onClick={() => navigate('/projects/new')}>
          + New Project
        </button>
      } />
      <main style={styles.main}>
        <div style={styles.topRow}>
          <div>
            <h1 style={styles.heading}>Projects</h1>
            <p style={styles.subheading}>
              {projects.length} active project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', paddingTop: 60 }}>Loading projects...</p>
        ) : projects.length === 0 && !error ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🏗️</div>
            <div style={styles.emptyTitle}>No projects yet</div>
            <p>Create your first project to get started.</p>
            <button style={styles.newBtn} onClick={() => navigate('/projects/new')}
              onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}>
              + New Project
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {projects.map(p => {
              const isEditing = editingProjectId === p.id;
              const isConfirmingDelete = confirmDeleteId === p.id;

              if (isEditing) {
                return (
                  <div key={p.id} style={styles.editForm}>
                    <div style={styles.editFormTitle}>Edit Project</div>
                    {['name', 'address', 'client_name', 'client_email'].map(field => (
                      <div key={field} style={styles.fieldGroup}>
                        <label style={styles.label}>
                          {field === 'client_name' ? 'Client Name' : field === 'client_email' ? 'Client Email' : field.charAt(0).toUpperCase() + field.slice(1)}
                        </label>
                        <input
                          style={styles.input}
                          type={field === 'client_email' ? 'email' : 'text'}
                          value={editForm[field] || ''}
                          onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div style={styles.editActions}>
                      <button
                        style={{ ...styles.saveBtn, opacity: actionLoading ? 0.6 : 1 }}
                        onClick={() => handleEditSubmit(p.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button style={styles.cancelBtn} onClick={cancelEdit} disabled={actionLoading}>
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={p.id} style={styles.cardWrapper}>
                  <a
                    style={admin ? styles.card : styles.cardNoActions}
                    href={`/projects/${p.id}`}
                    onClick={e => { e.preventDefault(); navigate(`/projects/${p.id}`); }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <span style={styles.cardBadge}>Active</span>
                    <div style={styles.cardName}>{p.name}</div>
                    <div style={styles.cardAddress}>{p.address}</div>
                    <div style={styles.cardFooter}>
                      <span style={styles.clientName}>{p.client_name}</span>
                      <span>{formatDate(p.created_at)}</span>
                    </div>
                  </a>

                  {admin && (
                    <div style={styles.cardActions}>
                      {isConfirmingDelete ? (
                        <>
                          <span style={styles.confirmText}>Delete this project?</span>
                          <button
                            style={{ ...styles.confirmYes, opacity: actionLoading ? 0.6 : 1 }}
                            onClick={e => { e.stopPropagation(); handleDeleteProject(p.id); }}
                            disabled={actionLoading}
                          >
                            {actionLoading ? '...' : 'Delete'}
                          </button>
                          <button
                            style={styles.confirmNo}
                            onClick={e => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            disabled={actionLoading}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            style={styles.editBtn}
                            onClick={e => { e.stopPropagation(); startEdit(p); }}
                          >
                            Edit
                          </button>
                          <button
                            style={styles.deleteBtn}
                            onClick={e => { e.stopPropagation(); setConfirmDeleteId(p.id); setEditingProjectId(null); }}
                          >
                            Delete
                          </button>
                        </>
                      )}
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
