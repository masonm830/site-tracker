import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { getToken } from '../utils/auth';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const styles = {
  page: { minHeight: '100vh', background: '#707880' },
  main: { maxWidth: 560, margin: '0 auto', padding: '40px 20px' },
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#e2e8f0',
    textDecoration: 'none',
    fontSize: 14,
    marginBottom: 24,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: 'inherit',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    padding: '36px 32px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  title: { fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  fieldGroup: { marginBottom: 20 },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
    color: '#0f172a',
    background: '#fff',
  },
  divider: {
    borderTop: '1px solid #f1f5f9',
    margin: '8px 0 20px',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 16,
  },
  submitBtn: {
    width: '100%',
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '13px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
    fontFamily: 'inherit',
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 20,
  },
};

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: checked ? '#3b82f6' : '#cbd5e1',
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 22 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', address: '', client_name: '', client_email: '', weekly_email_enabled: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleFocus = (e) => { e.target.style.borderColor = '#3b82f6'; };
  const handleBlur = (e) => { e.target.style.borderColor = '#d1d5db'; };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/api/projects`, form, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      console.error('[NewProject] Create project error:', err.response ?? err);
      setError(err.response?.data?.detail || 'Failed to create project. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <Header />
      <main style={styles.main}>
        <button style={styles.back} onClick={() => navigate('/')}>
          ← Back to Projects
        </button>

        <div style={styles.card}>
          <h1 style={styles.title}>New Project</h1>
          <p style={styles.subtitle}>Fill in the project details to get started.</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.sectionLabel}>Project Info</div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Project Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. Riverside Office Renovation"
                value={form.name}
                onChange={set('name')}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Site Address</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. 123 Main St, Springfield, IL 62701"
                value={form.address}
                onChange={set('address')}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
              />
            </div>

            <div style={styles.divider} />
            <div style={styles.sectionLabel}>Client Info</div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Client Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. John Smith"
                value={form.client_name}
                onChange={set('client_name')}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Client Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="e.g. john@example.com"
                value={form.client_email}
                onChange={set('client_email')}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
              />
            </div>

            <div style={{ ...styles.divider, marginTop: 20 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Send weekly progress emails to client</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Automated Friday update sent to client email</div>
              </div>
              <Toggle
                checked={form.weekly_email_enabled}
                onChange={val => setForm(f => ({ ...f, weekly_email_enabled: val }))}
              />
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                background: submitting ? '#94a3b8' : '#0f172a',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default NewProject;
