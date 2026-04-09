import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { getToken } from '../utils/auth';

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
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/api/projects`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => setProjects(res.data))
      .catch(() => setError('Could not load projects. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

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
            {projects.map(p => (
              <a
                key={p.id}
                style={styles.card}
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
