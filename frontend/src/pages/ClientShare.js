import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function formatDateLong(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}
function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
      .then(res => { setProject(res.data); setLogs(res.data.logs || []); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#64748b', fontSize: 15 }}>
        Loading project...
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', gap: 16 }}>
        <div style={{ fontSize: 56 }}>🔍</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>Project not found</h2>
        <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>This link may be invalid or the project may have been removed.</p>
      </div>
    );
  }

  const firstLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const lastLog = logs.length > 0 ? logs[0] : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'inherit' }}>

      {/* Header bar */}
      <div style={{
        background: '#0f172a', padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
          <span style={{
            width: 28, height: 28, background: '#3b82f6', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800,
          }}>ST</span>
          SiteTracker
        </div>
        <span style={{
          fontSize: 12, fontWeight: 600, color: '#64748b',
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '4px 14px', letterSpacing: '0.02em',
        }}>Client View</span>
      </div>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f1f3d 100%)',
        padding: '56px 32px 64px',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#60a5fa',
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12,
          }}>
            Project Progress Report
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-1px' }}>
            {project.name}
          </h1>
          <p style={{ fontSize: 16, color: '#94a3b8', margin: '0 0 40px', fontWeight: 400 }}>
            {project.address}
          </p>

          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Prepared for
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>{project.client_name}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Total Updates
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
                {logs.length} {logs.length === 1 ? 'log entry' : 'log entries'}
              </div>
            </div>
            {firstLog && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  First Update
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>{formatDateShort(firstLog.created_at)}</div>
              </div>
            )}
            {lastLog && logs.length > 1 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Latest Update
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>{formatDateShort(lastLog.created_at)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{
          fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 28,
          paddingBottom: 16, borderBottom: '2px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          letterSpacing: '-0.3px',
        }}>
          Progress Timeline
          <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>
            {logs.length} {logs.length === 1 ? 'update' : 'updates'}
          </span>
        </div>

        {logs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '64px 24px', background: '#fff',
            borderRadius: 20, border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>No updates have been posted yet. Check back soon.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {logs.map((log, i) => {
              const photos = log.photo_urls || (log.photo_url ? [log.photo_url] : []);
              const isEdited = !!log.updated_at;

              return (
                <div key={log.id} style={{
                  background: '#fff', borderRadius: 20, overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)',
                  border: '1px solid #e2e8f0',
                }}>
                  {/* Photos */}
                  {photos.length === 1 && (
                    <img
                      src={photos[0]}
                      alt={`Site update ${i + 1}`}
                      style={{ width: '100%', display: 'block', maxHeight: 480, objectFit: 'cover' }}
                    />
                  )}
                  {photos.length > 1 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 3,
                    }}>
                      {photos.map((url, j) => (
                        <img
                          key={j}
                          src={url}
                          alt={`Site update ${i + 1} photo ${j + 1}`}
                          style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Card body */}
                  <div style={{ padding: '24px 28px' }}>
                    {/* Date header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: log.note ? 16 : 0, flexWrap: 'wrap', gap: 8,
                    }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                          {formatDateLong(log.created_at)}
                        </div>
                        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                          {formatTime(log.created_at)}
                          {photos.length > 0 && (
                            <span style={{ marginLeft: 10, color: '#cbd5e1' }}>
                              · {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                            </span>
                          )}
                        </div>
                      </div>
                      {isEdited && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: '#64748b',
                          background: '#f1f5f9', border: '1px solid #e2e8f0',
                          borderRadius: 6, padding: '3px 9px', letterSpacing: '0.03em',
                        }}>
                          Edited
                        </span>
                      )}
                    </div>

                    {log.note && (
                      <>
                        {(photos.length > 0 || true) && (
                          <div style={{ height: 1, background: '#f1f5f9', marginBottom: 16 }} />
                        )}
                        <p style={{
                          fontSize: 15, color: '#334155', lineHeight: 1.75, margin: 0,
                          whiteSpace: 'pre-wrap', fontWeight: 400,
                        }}>
                          {log.note}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#0f172a', padding: '32px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 24, height: 24, background: '#3b82f6', borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#fff',
          }}>ST</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>SiteTracker</span>
        </div>
        <p style={{ fontSize: 13, color: '#475569', margin: 0, textAlign: 'center' }}>
          Construction progress management &mdash; keeping clients informed.
        </p>
      </footer>
    </div>
  );
}

export default ClientShare;
