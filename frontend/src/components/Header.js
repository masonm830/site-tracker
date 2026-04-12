import { useLocation } from 'react-router-dom';
import { getUser, logout, isAdmin } from '../utils/auth';

const BASE_NAV = [
  { label: 'Home', path: '/' },
  { label: 'Daily Logs', path: '/progress' },
  { label: 'Trades', path: '/trades' },
  { label: 'Punch List', path: '/punchlist' },
];
const ADMIN_NAV = [
  { label: 'Home', path: '/' },
  { label: 'Daily Logs', path: '/progress' },
  { label: 'Trades', path: '/trades' },
  { label: 'Punch List', path: '/punchlist' },
  { label: 'Projects', path: '/projects' },
];

function Header({ right }) {
  const user = getUser();
  const admin = isAdmin();
  const location = useLocation();
  const NAV_LINKS = admin ? ADMIN_NAV : BASE_NAV;

  return (
    <header style={{
      background: '#0f172a',
      color: '#fff',
      padding: '0 28px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <a href="/" style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.4px',
          color: '#fff',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <span style={{
            width: 30,
            height: 30,
            background: '#3b82f6',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '-0.5px',
            flexShrink: 0,
          }}>ST</span>
          SiteTracker
        </a>

        {user && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV_LINKS.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <a
                  key={link.path}
                  href={link.path}
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#fff' : '#94a3b8',
                    textDecoration: 'none',
                    padding: '5px 12px',
                    borderRadius: 7,
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#e2e8f0';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {right && <div>{right}</div>}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                {user.email}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: admin ? '#60a5fa' : '#94a3b8',
                background: admin ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.12)',
                padding: '1px 6px',
                borderRadius: 4,
              }}>
                {admin ? 'Admin' : 'Superintendent'}
              </span>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #1e293b',
                borderRadius: 7,
                padding: '6px 14px',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.background = '#1e293b';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = '#1e293b';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
