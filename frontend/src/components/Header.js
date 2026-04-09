import { getUser, logout } from '../utils/auth';

const styles = {
  header: {
    background: '#0f172a',
    color: '#fff',
    padding: '0 24px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-0.5px',
    color: '#fff',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 28,
    height: 28,
    background: '#3b82f6',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 800,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  userEmail: {
    fontSize: 13,
    color: '#94a3b8',
  },
  logoutBtn: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: '5px 12px',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'color 0.15s, border-color 0.15s',
  },
};

function Header({ right }) {
  const user = getUser();

  return (
    <header style={styles.header}>
      <a href="/" style={styles.logo}>
        <span style={styles.logoIcon}>ST</span>
        SiteTracker
      </a>
      <div style={styles.right}>
        {right && <div>{right}</div>}
        {user && (
          <>
            <span style={styles.userEmail}>{user.email}</span>
            <button
              style={styles.logoutBtn}
              onClick={logout}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = '#64748b';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = '#334155';
              }}
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
