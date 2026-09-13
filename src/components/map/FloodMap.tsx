import { Navigation, LocateFixed, MapPin, ShieldAlert, Waves } from 'lucide-react';
import { shelters, riskZones } from '../../data/pravahData';
import { DamRecord } from '../../types';

interface FloodMapProps {
  selectedDam: DamRecord;
  showZones: boolean;
  routeWarning?: boolean;
  onLocateMe: () => void;
  onSelectDam: (id: string) => void;
}

export function FloodMap({ selectedDam, showZones, routeWarning = false, onLocateMe, onSelectDam }: FloodMapProps) {
  return (
    <div className="pravah-panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8bb5d9' }}>Interactive Flood Map</div>
          <h3 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800 }}>India Flood Risk Monitor</h3>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="secondary-btn" onClick={onLocateMe}>
            <LocateFixed size={16} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
            Locate Me
          </button>
          <button type="button" className="primary-btn">
            <Navigation size={16} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
            Search Location
          </button>
        </div>
      </div>

      {routeWarning ? (
        <div className="badge badge-critical" style={{ marginBottom: 14, display: 'inline-flex' }}>
          Danger route ahead: avoid low-lying roads and take the nearest green safe zone.
        </div>
      ) : (
        <div className="badge badge-safe" style={{ marginBottom: 14, display: 'inline-flex' }}>
          Safe route available via the recommended evacuation corridor.
        </div>
      )}

      <div className="map-surface" style={{ minHeight: 430 }}>
        <svg viewBox="0 0 1000 560" role="img" aria-label="Flood map">
          <defs>
            <linearGradient id="riverGrad" x1="0" x2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.42" />
            </linearGradient>
          </defs>

          <rect width="1000" height="560" fill="rgba(10, 18, 28, 0.6)" />
          <path d="M100 80 C220 140, 260 180, 370 250 S 580 310, 700 390 S 860 420, 940 520" stroke="url(#riverGrad)" strokeWidth="40" fill="none" opacity="0.7" />

          {showZones && riskZones.map((zone) => (
            <g key={zone.id}>
              <circle cx={zone.x * 10} cy={zone.y * 6} r={zone.radius * 4} fill={zone.level === 'Critical' ? 'rgba(255,98,98,0.18)' : zone.level === 'Warning' ? 'rgba(250,204,21,0.12)' : 'rgba(52,211,153,0.12)'} stroke={zone.level === 'Critical' ? '#ff6b6b' : zone.level === 'Warning' ? '#facc15' : '#39d98a'} strokeDasharray="8 8" />
              <text x={zone.x * 10 + 16} y={zone.y * 6 - 10} fill="#dfeefc" fontSize="14" fontWeight="700">{zone.name}</text>
            </g>
          ))}

          {shelters.map((shelter) => (
            <g key={shelter.id} transform={`translate(${shelter.longitude * 8.5}, ${shelter.latitude * 8.5})`}>
              <circle r={12} fill="#34d399" stroke="#a7f3d0" strokeWidth="2" />
              <text x={18} y={5} fill="#d1fae5" fontSize="10">{shelter.name}</text>
            </g>
          ))}

          <g transform={`translate(${selectedDam.longitude * 8.5}, ${selectedDam.latitude * 8.5})`}>
            <circle r={18} fill="#38bdf8" stroke="#d9f5ff" strokeWidth="2" />
            <circle r={28} fill="rgba(56,189,248,0.18)" />
            <text x={20} y={8} fill="#d7edff" fontSize="12" fontWeight="800">{selectedDam.name}</text>
          </g>

          <g transform="translate(740, 160)">
            <circle r={16} fill="#f87171" stroke="#fff" strokeWidth="2" />
            <text x={24} y={3} fill="#ffdcdc" fontSize="12" fontWeight="700">Your location</text>
          </g>
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 18 }}>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="title">Nearby shelter</span>
            <MapPin size={18} color="#39d98a" />
          </div>
          <div className="value" style={{ fontSize: 22 }}>{shelters[0].name}</div>
          <div className="delta">{shelters[0].distanceKm} km • Medical aid available</div>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="title">Active Evac route</span>
            <Waves size={18} color="#5ee7ff" />
          </div>
          <div className="value" style={{ fontSize: 22 }}>Blue route</div>
          <div className="delta">Bypass critical inundation zone</div>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="title">Map status</span>
            <ShieldAlert size={18} color="#facc15" />
          </div>
          <div className="value" style={{ fontSize: 22 }}>{showZones ? 'Live' : 'Filtered'}</div>
          <div className="delta">Google Maps-ready fallback active</div>
        </div>
      </div>
    </div>
  );
}
