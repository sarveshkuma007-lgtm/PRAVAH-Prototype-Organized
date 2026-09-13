import { Bell, Droplets, Globe, ShieldAlert } from 'lucide-react';
import type { Language } from '../../types';

interface TopBarProps {
  nav: string;
  onNav: (value: string) => void;
  language: Language;
  onLanguageChange: (value: Language) => void;
}

const navItems = ['dashboard', 'dams', 'map', 'prediction', 'weather', 'alerts', 'routes', 'reports'] as const;
const navLabels: Record<typeof navItems[number], string> = {
  dashboard: 'Dashboard',
  dams: 'Dams',
  map: 'Map',
  prediction: 'Prediction',
  weather: 'Weather',
  alerts: 'Alerts',
  routes: 'Routes',
  reports: 'Reports',
};

export function TopBar({ nav, onNav, language, onLanguageChange }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner" style={{ maxWidth: 1480, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div className="hero-brand">
          <div className="logo-badge">
            <Droplets size={22} color="#8ae8ff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.05em' }}>PRAVAH</span>
              <span className="badge badge-warning" style={{ fontSize: 9, padding: '5px 8px' }}>
                LIVE
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#a7bad2', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Real-Time Dam Intelligence & Flood Safety Platform
            </div>
          </div>
        </div>

        <nav className="nav-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`nav-btn ${nav === item ? 'active' : ''}`}
              onClick={() => onNav(item)}
            >
              {navLabels[item]}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="secondary-btn" style={{ padding: '10px 12px' }}>
            <Bell size={16} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
            Alerts
          </button>
          <div className="input-wrap" style={{ width: 150, padding: '8px 10px' }}>
            <Globe size={15} color="#85d8ff" />
            <select value={language} onChange={(e) => onLanguageChange(e.target.value as Language)} style={{ color: 'white' }}>
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="bn">BN</option>
              <option value="ta">TA</option>
              <option value="te">TE</option>
              <option value="mr">MR</option>
              <option value="gu">GU</option>
              <option value="kn">KN</option>
              <option value="ml">ML</option>
              <option value="pa">PA</option>
            </select>
          </div>
          <button type="button" className="secondary-btn" style={{ padding: '10px 12px' }}>
            <ShieldAlert size={16} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
            Emergency
          </button>
        </div>
      </div>
    </header>
  );
}
