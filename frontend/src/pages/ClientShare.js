import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc' },
  header: {
    background: '#0f172a',
    padding: '0 24px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  headerLogo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    letterSpacing: '-0.3px',
  },
  logoIcon: {
    width: 26,
    height: 26,
    background: '#3b82f6',
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800,
    color: '#fff',
  },
  headerBadge: {
    background: 'rgba(255,255,255,0.1)',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 500,
  },
  hero: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
    color: '#fff',
    padding: '48px 24px 52px',
  },
  heroInner: { maxWidth: 700, margin: '0 auto' },
  projectLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#60a5fa',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 10,
  },
  projectName: {
    fontSize: 32,
    fontWeight: 800,
    marginBottom: 8,
    lineHeight: 1.2,
  },
  projectAddress: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  heroMeta: {
    display: 'flex',
    gap: 32,
    flexWrap: 'wrap',
  },
  heroMetaItem: { display: 'flex', flexDirection: 'column', gap: 3 },
  heroMetaLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  heroMetaValue: { fontSize: 15, fontWeight: 500, color: '#e2e8f0' },
  main: { maxWidth: 700, margin: '0 auto', padding: '40px 20px 60px' },
  timelineHeader: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottom: '2px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryCount: { fontSize: 14, fontWeight: 400, color: '#64748b' },
  timeline: { display: 'flex', flexDirection: 'column', gap: 24 },
  entry: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  entryPhoto: {
    width: '100%',
    display: 'block',
    maxHeight: 420,
    objectFit: 'cover',
  },
  entryBody: { padding: '20px 24px' },
  entryNote: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 1.65,
    marginBottom: 12,
    whiteSpace: 'pre-wrap',
  },
  entryFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTop: '1px solid #f1f5f9',
  },
  entryDateBadge: {
    background: '#f1f5f9',
    color: '#64748b',
    borderRadius: 6,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 500,
  },
  photoOnlyEntry: {},
  noLogs: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94a3b8',
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
  },
  noLogsIcon: { fontSize: 36, marginBottom: 12 },
  footer: {
    textAlign: 'center',
    padding: '24px',
    borderTop: '1px solid #e2e8f0',
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 16,
  },
  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    fontSize: 16,
    background: '#f8fafc',
  },
  notFound: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    background: '#f8fafc',
    gap: 12,
  },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function ClientShare() {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/projects/share/${token}`)
      .then(res => {
        setProject(res.data);
        setLogs(res.data.logs || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div style={styles.loadingPage}>Loading project...</div>;
  }

  if (notFound) {
    return (
      <div style={styles.notFound}>
        <span style={{ fontSize: 48 }}>🔍</span>
        <h2 style={{ color: '#475569', margin: 0 }}>Project not found</h2>
        <p>This link may be invalid or the project may have been removed.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLogo}>
          <span style={styles.logoIcon}>ST</span>
          SiteTracker
        </div>
        <span style={styles.headerBadge}>Client View</span>
      </header>

      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.projectLabel}>Project Progress Report</div>
          <h1 style={styles.projectName}>{project.name}</h1>
          <p style={styles.projectAddress}>{project.address}</p>
          <div style={styles.heroMeta}>
            <div style={styles.heroMetaItem}>
              <span style={styles.heroMetaLabel}>Prepared for</span>
              <span style={styles.heroMetaValue}>{project.client_name}</span>
            </div>
            <div style={styles.heroMetaItem}>
              <span style={styles.heroMetaLabel}>Updates</span>
              <span style={styles.heroMetaValue}>{logs.length} log {logs.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            {logs.length > 0 && (
              <div style={styles.heroMetaItem}>
                <span style={styles.heroMetaLabel}>Last Update</span>
                <span style={styles.heroMetaValue}>{formatDate(logs[0].created_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <main style={styles.main}>
        <div style={styles.timelineHeader}>
          Progress Timeline
          <span style={styles.entryCount}>{logs.length} update{logs.length !== 1 ? 's' : ''}</span>
        </div>

        {logs.length === 0 ? (
          <div style={styles.noLogs}>
            <div style={styles.noLogsIcon}>📋</div>
            <p>No updates have been posted yet. Check back soon.</p>
          </div>
        ) : (
          <div style={styles.timeline}>
            {logs.map((log, i) => (
              <div key={log.id} style={styles.entry}>
                {log.photo_url && (
                  <img src={log.photo_url} alt={`Site update ${i + 1}`} style={styles.entryPhoto} />
                )}
                <div style={styles.entryBody}>
                  {log.note && <p style={styles.entryNote}>{log.note}</p>}
                  <div style={styles.entryFooter}>
                    <span style={styles.entryDateBadge}>{formatDate(log.created_at)}</span>
                    <span style={{ ...styles.entryDateBadge, background: 'transparent', paddingLeft: 0 }}>
                      {formatTime(log.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        Powered by SiteTracker &mdash; Construction Progress Management
      </footer>
    </div>
  );
}

export default ClientShare;
