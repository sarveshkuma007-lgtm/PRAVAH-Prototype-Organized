import { Droplets, ShieldCheck, UserRound, Globe2 } from 'lucide-react';
import type { Language } from '../../types';

interface SplashScreenProps {
  language: Language;
  onLanguageChange: (value: Language) => void;
  onExplore: () => void;
  onLogin: () => void;
}

const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'bn', label: 'বাংলা' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'mr', label: 'मराठी' },
  { value: 'gu', label: 'ગુજરાતી' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
  { value: 'ml', label: 'മലയാളം' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ' },
] as const;

export function SplashScreen({ language, onLanguageChange, onExplore, onLogin }: SplashScreenProps) {
  return (
    <div className="splash-screen">
      <video className="splash-video" autoPlay muted loop playsInline>
        <source src="https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080.mp4" type="video/mp4" />
      </video>
      <div className="splash-overlay" />

      <div className="splash-content">
        <div className="login-panel">
          <div className="hero-brand" style={{ justifyContent: 'center', marginBottom: 18 }}>
            <div className="logo-badge">
              <Droplets size={24} color="#8ae8ff" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.06em' }}>PRAVAH</div>
              <div style={{ fontSize: 12, letterSpacing: '0.12em', color: '#8db4cc', textTransform: 'uppercase' }}>
                Real-Time Dam Intelligence & Flood Safety Platform
              </div>
            </div>
          </div>

          <div style={{ margin: '18px 0 14px', display: 'grid', gap: 12 }}>
            <div className="input-wrap">
              <UserRound size={16} color="#7dd3fc" />
              <input type="text" placeholder="Email or mobile number" />
            </div>
            <div className="input-wrap">
              <ShieldCheck size={16} color="#7dd3fc" />
              <input type="password" placeholder="Password" />
            </div>
            <div className="input-wrap">
              <Globe2 size={16} color="#7dd3fc" />
              <select value={language} onChange={(e) => onLanguageChange(e.target.value as Language)}>
                {languages.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
            <button type="button" className="primary-btn" onClick={onLogin}>Log In</button>
            <button type="button" className="secondary-btn" onClick={onExplore}>Explore Dashboard</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#9db7c8', fontSize: 12, marginBottom: 16 }}>
            <span style={{ flex: 1, height: 1, background: 'rgba(148,163,184,0.14)' }} />
            or continue with
            <span style={{ flex: 1, height: 1, background: 'rgba(148,163,184,0.14)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button type="button" className="secondary-btn">Google</button>
            <button type="button" className="secondary-btn">Government ID</button>
          </div>
        </div>
      </div>
    </div>
  );
}
