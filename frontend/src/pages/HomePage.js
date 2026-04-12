import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { getToken } from '../utils/auth';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const CARDS = [
  {
    title: 'Daily Logs',
    description: 'Track and share jobsite progress with clients',
    link: '/progress',
    icon: '📋',
    bg: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
  },
  {
    title: 'Trade Activity',
    description: 'Log subcontractor work and document issues',
    link: '/trades',
    icon: '🔧',
    bg: 'linear-gradient(135deg, #451a03 0%, #92400e 100%)',
  },
  {
    title: 'Punch List',
    description: 'Track items that need completion before handoff',
    link: '/punchlist',
    icon: '✅',
    bg: 'linear-gradient(135deg, #022c22 0%, #065f46 100%)',
  },
];

// --- Weather Widget ---

function getWeatherTheme(code) {
  if (code === 0)  return { accent: '#f59e0b', bg: '#fffbeb', icon: '☀️' };
  if (code <= 3)   return { accent: '#94a3b8', bg: '#f8fafc', icon: '⛅' };
  if (code <= 48)  return { accent: '#64748b', bg: '#f1f5f9', icon: '🌫️' };
  if (code <= 67)  return { accent: '#3b82f6', bg: '#eff6ff', icon: '🌧️' };
  if (code <= 77)  return { accent: '#0ea5e9', bg: '#f0f9ff', icon: '❄️' };
  if (code <= 82)  return { accent: '#3b82f6', bg: '#eff6ff', icon: '🌦️' };
  return           { accent: '#7c3aed', bg: '#f5f3ff', icon: '⛈️' };
}

function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loaded, setLoaded] = useState(false);

  function fetchWeather() {
    axios.get(`${API}/api/weather`)
      .then(res => setWeather(res.data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    fetchWeather();
    const id = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const theme = weather
    ? getWeatherTheme(weather.current.weather_code)
    : { accent: '#64748b', bg: '#f8fafc', icon: '🌡️' };

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      alignSelf: 'flex-start',
    }}>
      <div style={{
        padding: '14px 18px 10px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Phoenix Weather
        </span>
        <span style={{ fontSize: 18 }}>{theme.icon}</span>
      </div>

      <div style={{ padding: '18px 18px 16px', minHeight: 320 }}>
        {!loaded ? (
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Loading…</p>
        ) : !weather ? (
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Weather unavailable</p>
        ) : (
          <>
            {/* Current conditions */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
                <span style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: theme.accent,
                  lineHeight: 1,
                  letterSpacing: '-2px',
                }}>
                  {weather.current.temp}°
                </span>
                <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 600, paddingBottom: 10 }}>F</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
                {weather.current.description}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  <span style={{ fontWeight: 700, color: '#374151' }}>{weather.current.humidity}%</span> humidity
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  <span style={{ fontWeight: 700, color: '#374151' }}>{weather.current.wind_speed} mph</span> wind
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: 14 }} />

            {/* 3-day forecast */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {weather.forecast.map((day, i) => {
                const dt = getWeatherTheme(day.weather_code);
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: i === 0 ? dt.bg : 'transparent',
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 14, marginRight: 2 }}>{dt.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', width: 70, flexShrink: 0 }}>
                      {day.day}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8', flex: 1, textAlign: 'center', lineHeight: 1.3 }}>
                      {day.description}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                      {day.high}° / <span style={{ fontWeight: 400, color: '#94a3b8' }}>{day.low}°</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- Today's Activity Banner ---

const CATEGORIES = [
  { type: 'progress', label: 'Daily Logs',     icon: '📋', color: '#3b82f6', bg: '#eff6ff' },
  { type: 'trade',   label: 'Trade Activity',  icon: '🔧', color: '#f59e0b', bg: '#fffbeb' },
  { type: 'punch',   label: 'Punch List',      icon: '✅', color: '#10b981', bg: '#f0fdf4' },
];

const MAX_VISIBLE = 4;

function TodayActivity() {
  const [slides, setSlides] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [visibleIdx, setVisibleIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };
    const today = new Date().toISOString().slice(0, 10);

    axios.get(`${API}/api/projects`, { headers })
      .then(pRes => {
        const projectIds = pRes.data.map(p => p.id);
        return Promise.all(
          projectIds.map(id =>
            axios.get(`${API}/api/daily-report/${id}?date=${today}`, { headers }).catch(() => null)
          )
        );
      })
      .then(reports => {
        const buckets = { progress: [], trade: [], punch: [] };

        for (const r of reports) {
          if (!r) continue;
          const { project, progress_logs, trade_logs, punch_activity } = r.data;
          for (const l of progress_logs) {
            buckets.progress.push({ text: l.note || 'Progress update', project: project.name, isIssue: false });
          }
          for (const l of trade_logs) {
            buckets.trade.push({ text: `${l.trade_company}: ${l.work_description}`, project: project.name, isIssue: l.is_issue });
          }
          for (const l of punch_activity) {
            buckets.punch.push({ text: l.description, project: project.name, isIssue: false });
          }
        }

        const built = CATEGORIES
          .filter(cat => buckets[cat.type].length > 0)
          .map(cat => ({ ...cat, items: buckets[cat.type] }));

        setSlides(built);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setVisibleIdx(i => (i + 1) % slides.length);
        setFade(true);
      }, 350);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [slides]);

  function jumpTo(i) {
    clearInterval(timerRef.current);
    setFade(false);
    setTimeout(() => { setVisibleIdx(i); setFade(true); }, 350);
  }

  const slide = slides[visibleIdx];

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      alignSelf: 'flex-start',
    }}>
      {/* Banner header */}
      <div style={{
        padding: '14px 18px 10px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Today's Activity
        </span>
        {slides.length > 1 && (
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
            {visibleIdx + 1} / {slides.length}
          </span>
        )}
      </div>

      {/* Slide content */}
      <div style={{ padding: '18px 18px 14px', minHeight: 320 }}>
        {!loaded ? (
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Loading…</p>
        ) : slides.length === 0 ? (
          <div style={{ paddingTop: 8 }}>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>No activity today</p>
          </div>
        ) : (
          <div style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.35s ease' }}>
            {/* Category header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 8,
                  background: slide.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {slide.icon}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  {slide.label}
                </span>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                background: slide.bg,
                color: slide.color,
                borderRadius: 20,
                padding: '3px 9px',
              }}>
                {slide.items.length} today
              </span>
            </div>

            {/* Item list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {slide.items.slice(0, MAX_VISIBLE).map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  paddingBottom: 10,
                  borderBottom: i < Math.min(slide.items.length, MAX_VISIBLE) - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <div style={{
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: slide.color,
                    marginTop: 6,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1e293b',
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.isIssue && (
                        <span style={{
                          fontSize: 9, fontWeight: 700,
                          background: '#fef2f2', color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: 3, padding: '1px 4px',
                          marginRight: 5, verticalAlign: 'middle',
                        }}>
                          Issue
                        </span>
                      )}
                      {item.text}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.project}
                    </div>
                  </div>
                </div>
              ))}

              {slide.items.length > MAX_VISIBLE && (
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, paddingTop: 2 }}>
                  + {slide.items.length - MAX_VISIBLE} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div style={{ padding: '0 18px 14px', display: 'flex', gap: 4 }}>
          {slides.map((s, i) => (
            <div
              key={i}
              onClick={() => jumpTo(i)}
              style={{
                width: i === visibleIdx ? 16 : 6,
                height: 4,
                borderRadius: 2,
                background: i === visibleIdx ? s.color : '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '14px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      flex: 1,
      minWidth: 110,
    }}>
      <span style={{ fontSize: 26, fontWeight: 800, color: color || '#0f172a', letterSpacing: '-1px' }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ projects: 0, openPunch: 0, tradeIssues: 0 });
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };
    Promise.all([
      axios.get(`${API}/api/projects`, { headers }),
      axios.get(`${API}/api/punch-list?status=open`, { headers }),
      axios.get(`${API}/api/trade-logs?is_issue=true`, { headers }),
    ]).then(([projectsRes, punchRes, issuesRes]) => {
      setStats({
        projects: projectsRes.data.length,
        openPunch: punchRes.data.length,
        tradeIssues: issuesRes.data.length,
      });
    }).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#707880' }}>
      <Header />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.6px' }}>
            SiteTracker
          </h1>
          <p style={{ fontSize: 14, color: '#cbd5e1', margin: 0 }}>
            Your jobsite management hub
          </p>
        </div>

        {/* Three-column layout — wraps to vertical stack on narrow screens */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left: Weather */}
          <WeatherWidget />

          {/* Center: stats + tool cards */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
              <StatPill label="Active Projects" value={stats.projects} color="#3b82f6" />
              <StatPill label="Open Punch Items" value={stats.openPunch} color="#f59e0b" />
              <StatPill label="Trade Issues" value={stats.tradeIssues} color="#ef4444" />
            </div>

            {/* Feature cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {CARDS.map((card) => (
                <div
                  key={card.link}
                  onClick={() => navigate(card.link)}
                  onMouseEnter={() => setHovered(card.link)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: card.bg,
                    borderRadius: 16,
                    padding: '24px 28px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    transform: hovered === card.link ? 'translateY(-2px)' : 'none',
                    boxShadow: hovered === card.link
                      ? '0 12px 32px rgba(0,0,0,0.18)'
                      : '0 2px 10px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    background: 'rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0,
                  }}>
                    {card.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4, letterSpacing: '-0.3px' }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                      {card.description}
                    </div>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20, flexShrink: 0 }}>→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Today's Activity */}
          <TodayActivity />
        </div>
      </main>
    </div>
  );
}

export default HomePage;
