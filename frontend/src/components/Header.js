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
};

function Header({ right }) {
  return (
    <header style={styles.header}>
      <a href="/" style={styles.logo}>
        <span style={styles.logoIcon}>ST</span>
        SiteTracker
      </a>
      {right && <div>{right}</div>}
    </header>
  );
}

export default Header;
