import { AlertTriangle, CloudRain, Gauge, Home, ShieldCheck, Wind } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SplashScreen } from '../components/layout/SplashScreen';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/common/StatCard';
import { FloodMap } from '../components/map/FloodMap';
import { TrendChart } from '../components/charts/TrendChart';
import { Chatbot } from '../components/chatbot/Chatbot';
import { alerts, damList, forecastHours, weatherDays } from '../data/pravahData';
import { useLocation } from '../hooks/useLocation';
import { formatCusecs, getNearestShelter, getRiskBand, getSelectedDam } from '../services/floodService';
import type { Language } from '../types';

type NavKey = 'dashboard' | 'dams' | 'map' | 'prediction' | 'weather' | 'alerts' | 'routes' | 'reports';

const quickQuestions = ['Is my location safe?', 'Which dam is under risk?', 'Show safe routes', 'How much rain is expected?'];

export default function PravahDashboard() {
  const [nav, setNav] = useState<NavKey>('dashboard');
  const [language, setLanguage] = useState<Language>('en');
  const [selectedDamId, setSelectedDamId] = useState('hirakud');
  const [showDangerZones, setShowDangerZones] = useState(true);
  const [alertTab, setAlertTab] = useState<'All Alerts' | 'High Risk' | 'Moderate Risk' | 'Resolved'>('All Alerts');
  const [damQuery, setDamQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [authView, setAuthView] = useState<'splash' | 'app'>('splash');
  const { location, locationEnabled, error } = useLocation();

  const selectedDam = useMemo(() => getSelectedDam(selectedDamId), [selectedDamId]);
  const nearestShelter = useMemo(() => {
    if (!location) return { name: 'Burla Relief Shelter', distanceKm: 2.4 };
    return getNearestShelter(location.lat, location.lng);
  }, [location]);

  const locationText = useMemo(() => {
    if (!location) return 'Unknown region';
    const status = selectedDam.risk === 'Critical' ? 'yellow warning zone' : selectedDam.risk === 'Warning' ? 'warning zone' : 'safe zone';
    return `${status} near ${selectedDam.name}`;
  }, [location, selectedDam]);

  const routeWarning = locationEnabled && selectedDam.risk !== 'Safe';

  const topMetrics = [
    { title: 'Total Dams Monitored', value: '10', delta: '+2 new stations in last 24h', accent: 'cyan', icon: <Gauge size={18} /> },
    { title: 'Critical Alerts', value: '03', delta: '2 high-priority districts', accent: 'red', icon: <AlertTriangle size={18} /> },
    { title: 'People at Risk', value: '18.4K', delta: 'Downstream clusters monitored', accent: 'yellow', icon: <Home size={18} /> },
    { title: 'Active Evacuations', value: '05', delta: 'Routes reassessed this hour', accent: 'green', icon: <ShieldCheck size={18} /> },
  ] as const;

  const filteredDams = useMemo(() => {
    return damList.filter((dam) => {
      const matchesSearch = dam.name.toLowerCase().includes(damQuery.toLowerCase());
      const matchesState = stateFilter === 'All' || dam.state === stateFilter;
      const matchesRisk = riskFilter === 'All' || dam.risk === riskFilter;
      const matchesStatus = statusFilter === 'All' || dam.status === statusFilter;
      return matchesSearch && matchesState && matchesRisk && matchesStatus;
    });
  }, [damQuery, riskFilter, stateFilter, statusFilter]);

  const filteredAlerts = useMemo(() => {
    const byTab = alertTab === 'All Alerts' ? alerts : alerts.filter((alert) => alert.level === alertTab);
    return byTab;
  }, [alertTab]);

  const renderDashboard = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8ab6d6', fontSize: 11 }}>Operational Overview</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 'clamp(2rem, 4vw, 3.2rem)', lineHeight: 1.1, fontWeight: 900 }}>Dam Monitoring and Flood Safety Command Center</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="secondary-btn" onClick={() => setShowDangerZones((v) => !v)}>
            {showDangerZones ? 'Hide danger zones' : 'Show danger zones'}
          </button>
          <button type="button" className="primary-btn" onClick={() => setNav('reports')}>Generate Report</button>
        </div>
      </div>

      {error ? <div className="badge badge-warning" style={{ marginBottom: 16 }}>{error}</div> : null}

      <div className="pravah-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 22 }}>
        {topMetrics.map((item) => (
          <StatCard key={item.title} title={item.title} value={item.value} delta={item.delta} accent={item.accent} icon={item.icon} />
        ))}
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: '1.6fr 0.95fr', marginBottom: 22 }}>
        <div className="pravah-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>Live Dam Status</div>
              <h2 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 800 }}>{selectedDam.name} Dam</h2>
            </div>
            <div className={`badge ${selectedDam.risk === 'Critical' ? 'badge-critical' : selectedDam.risk === 'Warning' ? 'badge-warning' : 'badge-safe'}`}>
              {selectedDam.status}
            </div>
          </div>

          <div className="pravah-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <div className="metric-card">
              <div className="title">Water Level</div>
              <div className="value" style={{ fontSize: 24 }}>{selectedDam.waterLevel} m</div>
              <div className="delta">{selectedDam.maxWaterLevel} m max storage</div>
            </div>
            <div className="metric-card">
              <div className="title">Inflow/Outflow</div>
              <div className="value" style={{ fontSize: 24 }}>{formatCusecs(selectedDam.inflow)}</div>
              <div className="delta">Outflow {formatCusecs(selectedDam.outflow)}</div>
            </div>
            <div className="metric-card">
              <div className="title">Rainfall</div>
              <div className="value" style={{ fontSize: 24 }}>{selectedDam.rainfall} mm</div>
              <div className="delta">24h accumulation</div>
            </div>
            <div className="metric-card">
              <div className="title">Temperature</div>
              <div className="value" style={{ fontSize: 24 }}>{selectedDam.temperature}°C</div>
              <div className="delta">Air temperature</div>
            </div>
            <div className="metric-card">
              <div className="title">Dam Health</div>
              <div className="value" style={{ fontSize: 24 }}>{selectedDam.health}%</div>
              <div className="delta">Structural integrity</div>
            </div>
            <div className="metric-card">
              <div className="title">Seismic Activity</div>
              <div className="value" style={{ fontSize: 24 }}>{selectedDam.seismic}</div>
              <div className="delta">Richter scale</div>
            </div>
          </div>
        </div>

        <div className="pravah-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9db7c8' }}>Weather Summary</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <div style={{ width: 58, height: 58, borderRadius: 18, background: 'linear-gradient(135deg, rgba(94,231,255,0.14), rgba(59,130,246,0.18))', display: 'grid', placeItems: 'center' }}>
              <CloudRain size={26} color="#5ee7ff" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{selectedDam.temperature}°C</div>
              <div style={{ color: '#a7bad2' }}>Rainfall probability 72%</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="title">Humidity</div>
              <div className="value" style={{ fontSize: 22 }}>82%</div>
            </div>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="title">Wind</div>
              <div className="value" style={{ fontSize: 22 }}>18 km/h</div>
            </div>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="title">Rain</div>
              <div className="value" style={{ fontSize: 22 }}>88 mm</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', marginBottom: 22 }}>
        <FloodMap selectedDam={selectedDam} showZones={showDangerZones} routeWarning={routeWarning} onLocateMe={() => {}} onSelectDam={setSelectedDamId} />
        <div className="pravah-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9db7c8' }}>AI Flood Prediction</div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#9db7c8' }}>Flood risk level</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{selectedDam.risk}</div>
            </div>
            <div className={`badge ${selectedDam.risk === 'Critical' ? 'badge-critical' : selectedDam.risk === 'Warning' ? 'badge-warning' : 'badge-safe'}`}>
              {getRiskBand(selectedDam.risk)}
            </div>
          </div>
          <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
            <div className="metric-card" style={{ padding: 14 }}>
              <div className="title">Estimated arrival time</div>
              <div className="value" style={{ fontSize: 24 }}>1.5 hours</div>
            </div>
            <div className="metric-card" style={{ padding: 14 }}>
              <div className="title">Potentially affected districts</div>
              <div className="value" style={{ fontSize: 20 }}>Sambalpur, Burla, Padampur</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>AI-generated insights</div>
            <p style={{ color: '#b9d0df', lineHeight: 1.7, margin: 0 }}>
              Downstream water rise remains on a rising trajectory. The hydrological model indicates increased probability of local road inundation during the next two hours.
            </p>
          </div>
        </div>
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 22 }}>
        <TrendChart title="Risk Trend" points={[35, 45, 55, 72, 82, 90, 78]} labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} color="#5ee7ff" />
        <TrendChart title="Rainfall Forecast" points={[50, 60, 72, 82, 76, 68, 51]} labels={['Now', '2h', '4h', '6h', '8h', '12h', '24h']} color="#4ade80" />
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', marginBottom: 22 }}>
        <div className="pravah-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>Dam Inventory</div>
              <h3 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800 }}>All Dams</h3>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input value={damQuery} onChange={(e) => setDamQuery(e.target.value)} placeholder="Search dam" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: '10px 12px', minWidth: 180, color: 'white' }} />
              <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: '10px 12px', color: 'white' }}>
                <option value="All">State filter</option>
                {[...new Set(damList.map((dam) => dam.state))].map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflow: 'auto' }}>
            <table className="alert-table">
              <thead>
                <tr>
                  <th>Dam</th>
                  <th>State</th>
                  <th>Water</th>
                  <th>Risk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDams.map((dam) => (
                  <tr key={dam.id} onClick={() => setSelectedDamId(dam.id)} style={{ cursor: 'pointer' }}>
                    <td>{dam.name}</td>
                    <td>{dam.state}</td>
                    <td>{dam.waterLevel} m</td>
                    <td>
                      <span className={`badge ${dam.risk === 'Critical' ? 'badge-critical' : dam.risk === 'Warning' ? 'badge-warning' : 'badge-safe'}`}>{dam.risk}</span>
                    </td>
                    <td>{dam.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pravah-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9db7c8' }}>Safe Routes & Shelters</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            <div className="metric-card" style={{ padding: 14 }}>
              <div className="title">Current location</div>
              <div className="value" style={{ fontSize: 18 }}>{locationEnabled ? 'Live GPS detected' : 'Fallback monitoring'}</div>
              <div className="delta">{locationText}</div>
            </div>
            <div className="metric-card" style={{ padding: 14 }}>
              <div className="title">Nearest shelter</div>
              <div className="value" style={{ fontSize: 20 }}>{nearestShelter.name}</div>
              <div className="delta">Distance: {nearestShelter.distanceKm} km</div>
            </div>
            <div className="metric-card" style={{ padding: 14 }}>
              <div className="title">Emergency instructions</div>
              <div className="delta">Avoid low-lying roads and head to the nearest high-ground shelter.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="pravah-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>Reports</div>
              <h3 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800 }}>Data & Reporting</h3>
            </div>
            <button type="button" className="primary-btn" onClick={() => setNav('reports')}>Download PDF</button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="metric-card" style={{ padding: 14 }}>
              <div className="title">Water level report</div>
              <div className="value" style={{ fontSize: 24 }}>Stable slope</div>
            </div>
            <div className="metric-card" style={{ padding: 14 }}>
              <div className="title">Rainfall report</div>
              <div className="value" style={{ fontSize: 24 }}>Above seasonal mean</div>
            </div>
          </div>
        </div>

        <div className="pravah-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>Alerts & Notifications</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['All Alerts', 'High Risk', 'Moderate Risk', 'Resolved'].map((tab) => (
              <button key={tab} type="button" className={`secondary-btn ${alertTab === tab ? 'active' : ''}`} style={{ padding: '8px 10px', fontSize: 12 }} onClick={() => setAlertTab(tab as 'All Alerts' | 'High Risk' | 'Moderate Risk' | 'Resolved')}>
                {tab}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            {filteredAlerts.map((alert) => (
              <div key={alert.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{alert.title}</div>
                  <div style={{ color: '#9db7c8', fontSize: 12 }}>{alert.area} • {alert.time}</div>
                </div>
                <span className={`badge ${alert.level === 'High Risk' ? 'badge-critical' : alert.level === 'Moderate Risk' ? 'badge-warning' : 'badge-safe'}`}>{alert.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 22 }}>
        <div className="pravah-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>24-hour forecast</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 12, marginTop: 18 }}>
            {forecastHours.map((hour) => (
              <div key={hour.time} className="metric-card" style={{ padding: 12 }}>
                <div className="title">{hour.time}</div>
                <div className="value" style={{ fontSize: 22 }}>{hour.temp}°</div>
                <div className="delta">{hour.rain}% rain</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pravah-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>7-day outlook</div>
          <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
            {weatherDays.map((day) => (
              <div key={day.day} style={{ display: 'grid', gridTemplateColumns: '50px 1fr auto auto', gap: 8, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                <strong>{day.day}</strong>
                <span style={{ color: '#b9d0df' }}>{day.temp}°C</span>
                <span><CloudRain size={14} style={{ display: 'inline-block', marginRight: 6 }} />{day.rain}%</span>
                <span><Wind size={14} style={{ display: 'inline-block', marginRight: 6 }} />{day.wind} km/h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
        {quickQuestions.map((q) => (
          <button key={q} type="button" className="secondary-btn" style={{ padding: '10px 14px', fontSize: 12 }} onClick={() => setNav('map')}>{q}</button>
        ))}
      </div>
    </>
  );

  const renderDams = () => (
    <div className="pravah-panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>Dam Monitoring</div>
          <h2 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 800 }}>India Dam Network</h2>
        </div>
        <div className="badge badge-warning">Hirakud active monitoring</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 18 }}>
        <input value={damQuery} onChange={(e) => setDamQuery(e.target.value)} placeholder="Search Indian dam" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: '10px 12px', color: 'white' }} />
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: '10px 12px', color: 'white' }}>
          <option value="All">All States</option>
          {[...new Set(damList.map((dam) => dam.state))].map((state) => (<option key={state} value={state}>{state}</option>))}
        </select>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: '10px 12px', color: 'white' }}>
          <option value="All">All Risk</option>
          <option value="Safe">Safe</option>
          <option value="Warning">Warning</option>
          <option value="Critical">Critical</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: '10px 12px', color: 'white' }}>
          <option value="All">All Status</option>
          <option value="Normal">Normal</option>
          <option value="Watch">Watch</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {filteredDams.map((dam) => (
          <div key={dam.id} className="metric-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>{dam.state}</div>
                <h3 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 800 }}>{dam.name}</h3>
              </div>
              <span className={`badge ${dam.risk === 'Critical' ? 'badge-critical' : dam.risk === 'Warning' ? 'badge-warning' : 'badge-safe'}`}>{dam.risk}</span>
            </div>
            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              <div className="title">Reservoir details</div>
              <div className="delta">River: {dam.river}</div>
              <div className="delta">Water level: {dam.waterLevel} m / {dam.maxWaterLevel} m</div>
              <div className="delta">Inflow: {formatCusecs(dam.inflow)} | Outflow: {formatCusecs(dam.outflow)}</div>
              <div className="delta">Rainfall: {dam.rainfall} mm | Temperature: {dam.temperature}°C</div>
              <div className="delta">Dam health: {dam.health}% | Seismic activity: {dam.seismic}</div>
            </div>
            <button type="button" className="primary-btn" style={{ width: '100%', marginTop: 16 }} onClick={() => { setSelectedDamId(dam.id); setNav('dashboard'); }}>
              View in dashboard
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="pravah-panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>Flood Risk Map</div>
          <h2 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 800 }}>Interactive Flood Monitor</h2>
        </div>
        <button type="button" className="secondary-btn" onClick={() => setShowDangerZones((v) => !v)}>
          {showDangerZones ? 'Hide zones' : 'Show zones'}
        </button>
      </div>
      <FloodMap selectedDam={selectedDam} showZones={showDangerZones} routeWarning={routeWarning} onLocateMe={() => {}} onSelectDam={setSelectedDamId} />
      <div className="pravah-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginTop: 18, gap: 12 }}>
        <div className="metric-card" style={{ padding: 14 }}>
          <div className="title">User location</div>
          <div className="value" style={{ fontSize: 18 }}>{locationEnabled ? 'Location services enabled' : 'Fallback location used'}</div>
          <div className="delta">{location ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}` : 'Waiting for geolocation'}</div>
        </div>
        <div className="metric-card" style={{ padding: 14 }}>
          <div className="title">Danger zones</div>
          <div className="value" style={{ fontSize: 18 }}>{showDangerZones ? 'Visible' : 'Hidden'}</div>
          <div className="delta">Critical, warning, and safe sectors mapped</div>
        </div>
        <div className="metric-card" style={{ padding: 14 }}>
          <div className="title">Route status</div>
          <div className="value" style={{ fontSize: 18 }}>{routeWarning ? 'Dangerous' : 'Safe'}</div>
          <div className="delta">{routeWarning ? 'Avoid low-lying roads' : 'Recommended corridor is clear'}</div>
        </div>
      </div>
    </div>
  );

  const renderPrediction = () => (
    <div className="pravah-panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>AI Flood Prediction</div>
          <h2 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 800 }}>Flood Risk Forecast</h2>
        </div>
        <div className={`badge ${selectedDam.risk === 'Critical' ? 'badge-critical' : selectedDam.risk === 'Warning' ? 'badge-warning' : 'badge-safe'}`}>{selectedDam.risk}</div>
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div className="metric-card" style={{ padding: 14 }}>
          <div className="title">Risk level</div>
          <div className="value" style={{ fontSize: 24 }}>{selectedDam.risk}</div>
        </div>
        <div className="metric-card" style={{ padding: 14 }}>
          <div className="title">Estimated arrival</div>
          <div className="value" style={{ fontSize: 24 }}>1.5 hours</div>
        </div>
        <div className="metric-card" style={{ padding: 14 }}>
          <div className="title">Affected districts</div>
          <div className="value" style={{ fontSize: 18 }}>Sambalpur, Burla, Padampur</div>
        </div>
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 18, gap: 18 }}>
        <TrendChart title="Water Level Trend" points={[42, 54, 61, 70, 84, 92, 96]} labels={['6h', '8h', '10h', '12h', '14h', '16h', '18h']} color="#5ee7ff" />
        <TrendChart title="Risk Probability" points={[28, 44, 56, 68, 81, 90, 94]} labels={['Now', '+1h', '+2h', '+3h', '+4h', '+5h', '+6h']} color="#fbbf24" />
      </div>

      <div className="pravah-panel" style={{ marginTop: 18, padding: 18 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>AI-generated insights</div>
        <ul style={{ color: '#dfeaf6', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
          <li>Downstream river correction remains elevated; local roads near river bends are most vulnerable.</li>
          <li>Weighted risk model indicates a 72% chance of flash overflows if rainfall exceeds 90 mm in the next two hours.</li>
          <li>Recommended action: pre-position emergency teams and open the nearest high-ground evacuation corridor.</li>
        </ul>
      </div>
    </div>
  );

  const renderWeather = () => (
    <div className="pravah-panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>Weather Monitoring</div>
          <h2 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 800 }}>Current Conditions</h2>
        </div>
        <div className="badge badge-safe">Live rainfall watch</div>
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <div className="metric-card" style={{ padding: 14 }}><div className="title">Temperature</div><div className="value" style={{ fontSize: 24 }}>{selectedDam.temperature}°C</div></div>
        <div className="metric-card" style={{ padding: 14 }}><div className="title">Rainfall</div><div className="value" style={{ fontSize: 24 }}>{selectedDam.rainfall} mm</div></div>
        <div className="metric-card" style={{ padding: 14 }}><div className="title">Humidity</div><div className="value" style={{ fontSize: 24 }}>82%</div></div>
        <div className="metric-card" style={{ padding: 14 }}><div className="title">Wind</div><div className="value" style={{ fontSize: 24 }}>18 km/h</div></div>
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
        <div className="pravah-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>24-hour forecast</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 10, marginTop: 16 }}>
            {forecastHours.map((hour) => (
              <div key={hour.time} className="metric-card" style={{ padding: 10 }}>
                <div className="title">{hour.time}</div>
                <div className="value" style={{ fontSize: 18 }}>{hour.temp}°</div>
                <div className="delta">{hour.rain}% rain</div>
              </div>
            ))}
          </div>
        </div>
        <div className="pravah-panel" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>7-day outlook</div>
          <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
            {weatherDays.map((day) => (
              <div key={day.day} style={{ display: 'grid', gridTemplateColumns: '50px 1fr auto auto', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                <strong>{day.day}</strong>
                <span style={{ color: '#dfeaf6' }}>{day.temp}°C</span>
                <span>{day.rain}% rain</span>
                <span>{day.wind} km/h</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="pravah-panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>Alerts & Notifications</div>
          <h2 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 800 }}>Operational Alerts</h2>
        </div>
        <div className="badge badge-critical">3 active alerts</div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {['All Alerts', 'High Risk', 'Moderate Risk', 'Resolved'].map((tab) => (
          <button key={tab} type="button" className={`secondary-btn ${alertTab === tab ? 'active' : ''}`} onClick={() => setAlertTab(tab as 'All Alerts' | 'High Risk' | 'Moderate Risk' | 'Resolved')}>{tab}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className="metric-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: '0.08em', color: '#9db7c8', textTransform: 'uppercase' }}>{alert.area}</div>
                <h3 style={{ margin: '8px 0', fontSize: 24, fontWeight: 800 }}>{alert.title}</h3>
              </div>
              <span className={`badge ${alert.level === 'High Risk' ? 'badge-critical' : alert.level === 'Moderate Risk' ? 'badge-warning' : 'badge-safe'}`}>{alert.level}</span>
            </div>
            <p style={{ color: '#dfeaf6', lineHeight: 1.7, margin: '0 0 10px' }}>{alert.detail}</p>
            <div style={{ color: '#9db7c8', fontSize: 12 }}>{alert.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRoutes = () => (
    <div className="pravah-panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>Safe Routes & Shelters</div>
          <h2 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 800 }}>Evacuation Route Planning</h2>
        </div>
        <div className={`badge ${routeWarning ? 'badge-critical' : 'badge-safe'}`}>{routeWarning ? 'Dangerous route ahead' : 'Safe route clear'}</div>
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div className="metric-card" style={{ padding: 16 }}>
          <div className="title">Current location</div>
          <div className="value" style={{ fontSize: 22 }}>{locationEnabled ? 'Location active' : 'Fallback zone'}</div>
          <div className="delta">{location ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}` : 'Unknown'}</div>
        </div>
        <div className="metric-card" style={{ padding: 16 }}>
          <div className="title">Nearest shelter</div>
          <div className="value" style={{ fontSize: 22 }}>{nearestShelter.name}</div>
          <div className="delta">Distance: {nearestShelter.distanceKm} km</div>
        </div>
        <div className="metric-card" style={{ padding: 16 }}>
          <div className="title">Safe route</div>
          <div className="value" style={{ fontSize: 22 }}>{routeWarning ? 'Alternative route required' : 'Green route'}</div>
          <div className="delta">{routeWarning ? 'Use elevated corridor to the east' : 'Follow the monitored evacuation corridor'}</div>
        </div>
      </div>

      <div className="pravah-panel" style={{ marginTop: 18, padding: 18 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Emergency instructions</div>
        <ul style={{ paddingLeft: 20, color: '#dfeaf6', lineHeight: 1.8, margin: 0 }}>
          <li>Keep moving toward the nearest green safe zone until all roads are clear.</li>
          <li>{routeWarning ? 'The selected route crosses a danger zone. Use the alternate high-ground route.' : 'The selected route remains clear and suitable for evacuation.'}</li>
          <li>Carry emergency kits, keep mobile devices charged, and stay clear of low-lying roads.</li>
        </ul>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="pravah-panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9db7c8', textTransform: 'uppercase' }}>Reports & Data</div>
          <h2 style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 800 }}>Flood Risk Report</h2>
        </div>
        <button type="button" className="primary-btn">Generate Report</button>
      </div>

      <div className="pravah-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div className="metric-card" style={{ padding: 14 }}><div className="title">Dam Status</div><div className="value" style={{ fontSize: 22 }}>{selectedDam.status}</div></div>
        <div className="metric-card" style={{ padding: 14 }}><div className="title">Affected Areas</div><div className="value" style={{ fontSize: 18 }}>Sambalpur, Burla</div></div>
        <div className="metric-card" style={{ padding: 14 }}><div className="title">Risk Level</div><div className="value" style={{ fontSize: 22 }}>{selectedDam.risk}</div></div>
      </div>

      <div className="pravah-panel" style={{ marginTop: 18, padding: 18 }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Recommendations</div>
        <ul style={{ color: '#dfeaf6', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
          <li>Increase downstream monitoring and maintain spillway readiness for the next 6 hours.</li>
          <li>Activate relief teams and shelter communications for vulnerable districts.</li>
          <li>Prioritize evacuation corridor checks for low-lying access roads.</li>
        </ul>
      </div>
    </div>
  );

  if (authView === 'splash') {
    return (
      <SplashScreen
        language={language}
        onLanguageChange={setLanguage}
        onExplore={() => setAuthView('app')}
        onLogin={() => setAuthView('app')}
      />
    );
  }

  const pageContent = {
    dashboard: renderDashboard(),
    dams: renderDams(),
    map: renderMap(),
    prediction: renderPrediction(),
    weather: renderWeather(),
    alerts: renderAlerts(),
    routes: renderRoutes(),
    reports: renderReports(),
  }[nav];

  return (
    <div className="pravah-shell">
      <TopBar nav={nav} onNav={setNav} language={language} onLanguageChange={setLanguage} />
      <main style={{ maxWidth: 1480, margin: '0 auto', padding: '24px 20px 80px' }}>
        {pageContent}
      </main>
      <Chatbot language={language} locationText={locationText} selectedDam={selectedDam.name} routeWarning={routeWarning} locationEnabled={locationEnabled} />
    </div>
  );
}
