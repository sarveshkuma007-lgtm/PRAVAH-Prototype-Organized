import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Navigation,
  ShieldAlert,
  ShieldCheck,
  Droplets,
  MapPin,
  Compass,
  PhoneCall,
  Share2,
  AlertTriangle,
  Layers,
  Radio,
  Volume2,
  Maximize2,
  RotateCcw,
  Sparkles
} from 'lucide-react';

// ==========================================
// 1. TYPES & DATA CONTRACTS
// ==========================================
type AlertLevel = 'SAFE' | 'YELLOW_ALERT' | 'RED_CRITICAL';
type SupportedLanguage = 'en' | 'hi' | 'or' | 'mr' | 'te' | 'bn';

interface GeoCoordinate {
  lat: number;
  lng: number;
  label?: string;
}

interface DamData {
  id: string;
  name: string;
  river: string;
  location: GeoCoordinate;
  waterLevelM: number;
  maxCapacityM: number;
  inflowCusecs: number;
  outflowCusecs: number;
  dischargeStatus: 'NORMAL' | 'ELEVATED' | 'CRITICAL_SPILLWAY';
}

interface ShelterData {
  id: string;
  name: string;
  coords: GeoCoordinate;
  capacity: number;
  occupancy: number;
  distanceKm: number;
  phone: string;
  hasMedical: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  alertLevel?: AlertLevel;
  actionTaken?: string;
  shelter?: ShelterData;
}

// ==========================================
// 2. STATIC KNOWLEDGE BASE & SIMULATION DATA
// ==========================================
const ACTIVE_DAM: DamData = {
  id: 'dam-hirakud-01',
  name: 'Hirakud Dam Reservoir',
  river: 'Mahanadi River Basin',
  location: { lat: 21.5700, lng: 83.8700, label: 'Hirakud Dam Spillway' },
  waterLevelM: 191.85,
  maxCapacityM: 192.02,
  inflowCusecs: 450000,
  outflowCusecs: 410000,
  dischargeStatus: 'CRITICAL_SPILLWAY',
};

const SHELTERS: ShelterData[] = [
  {
    id: 'sh-1',
    name: 'Burla Higher Secondary Cyclone & Flood Shelter',
    coords: { lat: 21.5015, lng: 83.8710, label: 'Shelter Alpha' },
    capacity: 1500,
    occupancy: 420,
    distanceKm: 2.4,
    phone: '+91 663 243 0012',
    hasMedical: true,
  },
  {
    id: 'sh-2',
    name: 'Sambalpur Govt Polytechnic Relief Camp',
    coords: { lat: 21.4680, lng: 83.9800, label: 'Shelter Bravo' },
    capacity: 2200,
    occupancy: 890,
    distanceKm: 7.1,
    phone: '+91 663 241 1100',
    hasMedical: true,
  },
];

const QUICK_PROMPT_PILLS = [
  'Is my location safe?',
  'Which dam is nearest to me?',
  'Find the safest route.',
  'Where is the nearest shelter?',
  'What should I do during a dam flood?'
];

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    safe: 'Your location is verified SAFE. No active flood surge detected in your perimeter.',
    yellow: 'YELLOW WARNING: Elevated spillway discharge detected (410,000 cusecs). You are within moderate alert zone.',
    critical: 'CRITICAL DANGER: High flood inundation warning active! Evacuate immediately to higher ground.',
    routeFound: 'Safe evacuation route computed to {shelter} ({dist} km). Danger zones bypassed.',
    shelterInfo: 'Nearest safe shelter is {shelter} ({dist} km). Medical team is active.',
    damInfo: 'Nearest reservoir is {dam} on {river} ({dist} km away). Spillways are actively discharging.',
  },
  hi: {
    safe: 'आपकी वर्तमान स्थिति सुरक्षित है। आपके आसपास कोई बाढ़ की चेतावनी नहीं है।',
    yellow: 'येलो चेतावनी: हीराकुद बांध से 4,10,000 क्यूसेक पानी छोड़ा जा रहा है। सतर्क रहें।',
    critical: 'गंभीर चेतावनी: बाढ़ का जल स्तर बढ़ रहा है। कृपया तुरंत सुरक्षित आश्रय की ओर निकलें।',
    routeFound: '{shelter} ({dist} किमी) के लिए सुरक्षित रास्ता तैयार है। नीले मार्ग का पालन करें।',
    shelterInfo: 'निकटतम राहत केंद्र {shelter} है ({dist} किमी)। चिकित्सा सुविधा उपलब्ध है।',
    damInfo: 'निकटतम बांध {dam} ({river}) है, जो {dist} किमी दूर स्थित है।',
  },
  or: {
    safe: 'ଆପଣଙ୍କ ଅଞ୍ଚଳ ସମ୍ପୂର୍ଣ୍ଣ ସୁରକ୍ଷିତ। କୌଣସି ବନ୍ୟା ବିପଦ ନାହିଁ।',
    yellow: 'ହଳଦିଆ ସତର୍କତା: ହୀରାକୁଦ ଡ୍ୟାମରୁ ଜଳ ନିଷ୍କାସନ ଜାରି ରହିଛି। ସତର୍କ ରୁହନ୍ତୁ।',
    critical: 'ଜରୁରୀ ସତର୍କତା: ବନ୍ୟା ଜଳ ମାଡ଼ିଆସୁଛି! ତୁରନ୍ତ ଉଚ୍ଚ ସ୍ଥାନ ଓ ଆଶ୍ରୟସ୍ଥଳୀକୁ ଯାଆନ୍ତୁ।',
    routeFound: '{shelter} ପାଇଁ ସୁରକ୍ଷିତ ମାର୍ଗ ମ୍ୟାପରେ ପ୍ରଦର୍ଶିତ ହୋଇଛି ({dist} କିମି)।',
    shelterInfo: 'ନିକଟତମ ବନ୍ୟା ଆଶ୍ରୟ: {shelter} ({dist} କିମି)।',
    damInfo: 'ନିକଟସ୍ଥ ଡ୍ୟାମ: {dam}, ମହାନଦୀ ଅବବାହିକା।',
  },
  mr: {
    safe: 'तुमचे सध्याचे ठिकाण सुरक्षित आहे.',
    yellow: 'यलो अलर्ट: धरणातून पाण्याचा विसर्ग सुरू आहे. सतर्क रहा.',
    critical: 'धोकादायक इशारा: पूरस्थिती गंभीर आहे, त्वरित सुरक्षित स्थळी जा.',
    routeFound: '{shelter} साठी सुरक्षित मार्ग तयार केला आहे.',
    shelterInfo: 'जवळचे सुरक्षित केंद्र: {shelter} ({dist} किमी).',
    damInfo: 'जवळचे धरण: {dam} ({river}).',
  },
  te: {
    safe: 'మీ ప్రాంతం సురక్షితంగా ఉంది.',
    yellow: 'యెల్లో అలర్ట్: డ్యామ్ నుండి నీరు విడుదలవుతోంది. అప్రమత్తంగా ఉండండి.',
    critical: 'తీవ్ర ప్రమాదం: వరద ముంపు పెరుగుతోంది, వెంటనే తరలి వెళ్లండి.',
    routeFound: '{shelter} కు సురక్షित మార్గం సిద్ధం చేయబడింది.',
    shelterInfo: 'సమీప ఆశ్రయం: {shelter} ({dist} కి.మీ).',
    damInfo: 'సమీప డ్యామ్: {dam}.',
  },
  bn: {
    safe: 'আপনার এলাকা নিরাপদ রয়েছে।',
    yellow: 'হলুদ সতর্কতা: বাঁধ থেকে জল ছাড়া হচ্ছে, সতর্ক থাকুন।',
    critical: 'জরুরি সতর্কতা: বন্যার জল বাড়ছে! অবিলম্বে নিরাপদ স্থানে যান।',
    routeFound: '{shelter}-এর নিরাপদ রুট ম্যাপে দেখানো হয়েছে।',
    shelterInfo: 'নিকটতম আশ্রয়কেন্দ্র: {shelter} ({dist} কিমি)।',
    damInfo: 'নিকটতম বাঁধ: {dam}।',
  },
};

// ==========================================
// 3. MAIN INTERACTIVE PROTOTYPE COMPONENT
// ==========================================
export const PravahAIPrototype: React.FC = () => {
  // Scenario Simulator States: 'safe' | 'yellow' | 'critical'
  const [currentScenario, setCurrentScenario] = useState<'safe' | 'yellow' | 'critical'>('critical');
  
  // UI & Chat States
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<boolean>(false);
  const [showSafeRouteOnMap, setShowSafeRouteOnMap] = useState<boolean>(true);
  const [showDangerZones, setShowDangerZones] = useState<boolean>(true);
  const [mapZoomFocus, setMapZoomFocus] = useState<'dam' | 'user' | 'shelter' | 'all'>('all');

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // User simulated position based on scenario
  const userPositions: Record<'safe' | 'yellow' | 'critical', GeoCoordinate> = {
    safe: { lat: 21.4200, lng: 84.0500, label: 'User Location (Safe Zone)' },
    yellow: { lat: 21.5400, lng: 83.9200, label: 'User Location (Buffer Zone)' },
    critical: { lat: 21.5150, lng: 83.8850, label: 'User Location (Inundation Danger Zone)' },
  };

  const currentUserCoord = userPositions[currentScenario];
  const activeShelter = SHELTERS[0];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Namaste! I am PRAVAH AI Assistant. I have analyzed your location downstream of Hirakud Dam. How can I assist your safety today?',
      timestamp: 'Just now',
      alertLevel: 'RED_CRITICAL',
    },
  ]);

  // Auto scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  // Scenario Switcher Helper
  const applyScenario = (scenario: 'safe' | 'yellow' | 'critical') => {
    setCurrentScenario(scenario);
    if (scenario === 'critical') {
      setShowDangerZones(true);
      setShowSafeRouteOnMap(true);
      setEmergencyModalOpen(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'assistant',
          text: TRANSLATIONS[language].critical,
          timestamp: 'Just now',
          alertLevel: 'RED_CRITICAL',
          actionTaken: 'RED_INUNDATION_OVERLAY_TRIGGERED',
          shelter: activeShelter,
        },
      ]);
    } else if (scenario === 'yellow') {
      setShowDangerZones(true);
      setShowSafeRouteOnMap(false);
      setEmergencyModalOpen(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'assistant',
          text: TRANSLATIONS[language].yellow,
          timestamp: 'Just now',
          alertLevel: 'YELLOW_ALERT',
          actionTaken: 'YELLOW_ALERT_PERIMETER_ACTIVE',
        },
      ]);
    } else {
      setShowDangerZones(false);
      setShowSafeRouteOnMap(false);
      setEmergencyModalOpen(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'assistant',
          text: TRANSLATIONS[language].safe,
          timestamp: 'Just now',
          alertLevel: 'SAFE',
          actionTaken: 'PERIMETER_CLEAR',
        },
      ]);
    }
  };

  // AI Reasoning & Map Action Dispatcher
  const handleUserSend = (customQuery?: string) => {
    const query = (customQuery || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const q = query.toLowerCase();

      // Query: Route / Evacuate
      if (q.includes('route') || q.includes('safest') || q.includes('evacuate') || q.includes('रास्ता') || q.includes('ରାସ୍ତା')) {
        setShowSafeRouteOnMap(true);
        setShowDangerZones(true);
        setMapZoomFocus('shelter');
        const text = TRANSLATIONS[language].routeFound
          .replace('{shelter}', activeShelter.name)
          .replace('{dist}', activeShelter.distanceKm.toString());

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text,
            timestamp: 'Now',
            alertLevel: currentScenario === 'critical' ? 'RED_CRITICAL' : 'SAFE',
            actionTaken: 'HIGHLIGHT_BLUE_EVACUATION_ROUTE',
            shelter: activeShelter,
          },
        ]);
      }
      // Query: Safety / Flood Risk
      else if (q.includes('safe') || q.includes('flood') || q.includes('warning') || q.includes('danger') || q.includes('खतरा') || q.includes('ବନ୍ୟା')) {
        if (currentScenario === 'critical') {
          setShowDangerZones(true);
          setShowSafeRouteOnMap(true);
          setEmergencyModalOpen(true);
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'assistant',
              text: TRANSLATIONS[language].critical,
              timestamp: 'Now',
              alertLevel: 'RED_CRITICAL',
              actionTaken: 'TRIGGER_EMERGENCY_MODE',
              shelter: activeShelter,
            },
          ]);
        } else if (currentScenario === 'yellow') {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'assistant',
              text: TRANSLATIONS[language].yellow,
              timestamp: 'Now',
              alertLevel: 'YELLOW_ALERT',
              actionTaken: 'DISPLAY_MODERATE_RISK_BUFFER',
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'assistant',
              text: TRANSLATIONS[language].safe,
              timestamp: 'Now',
              alertLevel: 'SAFE',
              actionTaken: 'VERIFIED_SAFE_ZONE',
            },
          ]);
        }
      }
      // Query: Dam Info
      else if (q.includes('dam') || q.includes('nearest dam') || q.includes('बांध') || q.includes('ଡ୍ୟାମ')) {
        setMapZoomFocus('dam');
        const text = TRANSLATIONS[language].damInfo
          .replace('{dam}', ACTIVE_DAM.name)
          .replace('{river}', ACTIVE_DAM.river)
          .replace('{dist}', '8.4');

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text,
            timestamp: 'Now',
            alertLevel: 'YELLOW_ALERT',
            actionTaken: 'FOCUS_DAM_SPILLWAY_DATA',
          },
        ]);
      }
      // Query: Shelter
      else if (q.includes('shelter') || q.includes('आश्रय') || q.includes('ଆଶ୍ରୟ')) {
        setMapZoomFocus('shelter');
        const text = TRANSLATIONS[language].shelterInfo
          .replace('{shelter}', activeShelter.name)
          .replace('{dist}', activeShelter.distanceKm.toString());

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text,
            timestamp: 'Now',
            alertLevel: 'SAFE',
            shelter: activeShelter,
            actionTaken: 'FOCUS_NEAREST_SHELTER',
          },
        ]);
      }
      // Fallback
      else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: `PRAVAH AI is continuously tracking live telemetry on ${ACTIVE_DAM.name}. Outflow is ${ACTIVE_DAM.outflowCusecs.toLocaleString()} cusecs. Let me know if you need safe evacuation routes or shelter assistance.`,
            timestamp: 'Now',
            alertLevel: currentScenario === 'critical' ? 'RED_CRITICAL' : 'SAFE',
          },
        ]);
      }
    }, 650);
  };

  // Simulated Voice Input Recognition
  const toggleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        handleUserSend('Is my location safe right now?');
      }, 2500);
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      
      {/* ========================================== */}
      {/* TOP TELEMETRY & SCENARIO CONTROL BAR       */}
      {/* ========================================== */}
      <header className="h-16 px-4 md:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
            <Droplets className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-white text-base md:text-lg">PRAVAH AI</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
                Live Prototype
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Integrated Dam Inundation & AI Evacuation Assistant
            </p>
          </div>
        </div>

        {/* Prototype Scenario Switcher & Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden lg:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Test Scenario:</span>
            <button
              onClick={() => applyScenario('safe')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                currentScenario === 'safe'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Safe Zone
            </button>
            <button
              onClick={() => applyScenario('yellow')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                currentScenario === 'yellow'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yellow Alert
            </button>
            <button
              onClick={() => applyScenario('critical')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                currentScenario === 'critical'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical Risk
            </button>
          </div>

          {currentScenario === 'critical' && (
            <button
              onClick={() => setEmergencyModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-red-600/30 animate-bounce"
            >
              <ShieldAlert className="w-4 h-4" /> Emergency HUD
            </button>
          )}

          <div className="h-6 w-px bg-slate-800 mx-1" />

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="hi" className="bg-slate-900 text-white">हिन्दी (Hindi)</option>
              <option value="or" className="bg-slate-900 text-white">ଓଡ଼ିଆ (Odia)</option>
              <option value="mr" className="bg-slate-900 text-white">मराठी (Marathi)</option>
              <option value="te" className="bg-slate-900 text-white">తెలుగు (Telugu)</option>
              <option value="bn" className="bg-slate-900 text-white">বাংলা (Bengali)</option>
            </select>
          </div>
        </div>
      </header>

      {/* ========================================== */}
      {/* MAIN VIEWPORT: INTERACTIVE SIMULATED MAP   */}
      {/* ========================================== */}
      <div className="relative flex-1 w-full h-full bg-[#0b1320] overflow-hidden">
        
        {/* Map Vector Layer (SVG Simulated Live Map) */}
        <svg
          viewBox="0 0 1000 700"
          className="w-full h-full object-cover select-none transition-all duration-700 ease-out"
          style={{
            transform:
              mapZoomFocus === 'dam'
                ? 'scale(1.3) translate(10%, 15%)'
                : mapZoomFocus === 'shelter'
                ? 'scale(1.35) translate(-10%, -10%)'
                : 'scale(1.0) translate(0%, 0%)',
          }}
        >
          {/* Subtle Grid / Topography Background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            <radialGradient id="inundationGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.55" />
              <stop offset="80%" stopColor="#dc2626" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* River Mahanadi Path */}
          <path
            d="M 150 50 Q 300 200, 480 320 T 800 620"
            fill="none"
            stroke="url(#riverGrad)"
            strokeWidth="38"
            strokeLinecap="round"
            className="opacity-60"
          />
          <path
            d="M 150 50 Q 300 200, 480 320 T 800 620"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeDasharray="12 6"
            className="opacity-70 animate-pulse"
          />

          {/* Yellow Alert Buffer Zone */}
          {showDangerZones && (
            <polygon
              points="300,180 620,240 780,560 420,520 280,340"
              fill="#f59e0b"
              fillOpacity="0.14"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          )}

          {/* Red Critical Inundation Flood Zone */}
          {showDangerZones && currentScenario === 'critical' && (
            <g className="animate-pulse">
              <polygon
                points="360,240 560,290 680,510 460,460"
                fill="url(#inundationGlow)"
                stroke="#ef4444"
                strokeWidth="2.5"
              />
              <text x="450" y="380" fill="#fca5a5" fontSize="13" fontWeight="bold" letterSpacing="2">
                HIGH INUNDATION ZONE (1.5H FLOOD WAVE)
              </text>
            </g>
          )}

          {/* Safe Evacuation Route Polyline (BLUE PATH) */}
          {showSafeRouteOnMap && (
            <g>
              <polyline
                points="510,410 490,470 410,540 330,570 260,560"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-lg"
              />
              <polyline
                points="510,410 490,470 410,540 330,570 260,560"
                fill="none"
                stroke="#93c5fd"
                strokeWidth="2"
                strokeDasharray="8 6"
              />
            </g>
          )}

          {/* 1. Dam Spillway Node */}
          <g transform="translate(260, 160)" className="cursor-pointer" onClick={() => setMapZoomFocus('dam')}>
            <circle r="22" fill="#0284c7" fillOpacity="0.3" className="animate-ping" />
            <circle r="14" fill="#0369a1" stroke="#38bdf8" strokeWidth="2.5" />
            <text x="24" y="5" fill="#e0f2fe" fontSize="14" fontWeight="bold">
              {ACTIVE_DAM.name}
            </text>
            <text x="24" y="20" fill="#7dd3fc" fontSize="11">
              Discharge: 410,000 cusecs (Spillways Open)
            </text>
          </g>

          {/* 2. Safe Shelter Node Alpha */}
          <g transform="translate(260, 560)" className="cursor-pointer" onClick={() => setMapZoomFocus('shelter')}>
            <circle r="20" fill="#10b981" fillOpacity="0.25" className="animate-pulse" />
            <circle r="13" fill="#059669" stroke="#34d399" strokeWidth="2" />
            <text x="-160" y="-12" fill="#a7f3d0" fontSize="13" fontWeight="bold">
              {activeShelter.name}
            </text>
            <text x="-160" y="4" fill="#6ee7b7" fontSize="11">
              Cap: {activeShelter.capacity} | Vacancy: {activeShelter.capacity - activeShelter.occupancy} beds
            </text>
          </g>

          {/* 3. Safe Shelter Node Bravo */}
          <g transform="translate(740, 540)" className="cursor-pointer">
            <circle r="12" fill="#059669" stroke="#34d399" strokeWidth="2" />
            <text x="18" y="4" fill="#6ee7b7" fontSize="12" fontWeight="bold">
              {SHELTERS[1].name}
            </text>
          </g>

          {/* 4. User Current Location Pulsing Pin */}
          <g
            transform={`translate(${
              currentScenario === 'critical' ? 510 : currentScenario === 'yellow' ? 440 : 790
            }, ${currentScenario === 'critical' ? 410 : currentScenario === 'yellow' ? 280 : 380})`}
          >
            <circle
              r="24"
              fill={currentScenario === 'critical' ? '#ef4444' : currentScenario === 'yellow' ? '#f59e0b' : '#3b82f6'}
              fillOpacity="0.35"
              className="animate-ping"
            />
            <circle
              r="10"
              fill={currentScenario === 'critical' ? '#dc2626' : currentScenario === 'yellow' ? '#d97706' : '#2563eb'}
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <rect x="-65" y="-36" width="130" height="24" rx="12" fill="#0f172a" stroke="rgba(255,255,255,0.2)" />
            <text x="0" y="-20" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
              YOU ARE HERE
            </text>
          </g>
        </svg>

        {/* Floating Map Legend & Control Widget */}
        <div className="absolute top-4 left-4 z-20 bg-slate-900/85 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/60 shadow-xl max-w-xs text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" /> Map Intelligence
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">LIVE SYNC</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-slate-300">Active Inundation (Red Zone)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-slate-300">Yellow Alert Perimeter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 bg-blue-500 rounded-full" />
              <span className="text-slate-300">AI Safe Evacuation Polyline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Verified Relief Shelter</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex gap-1">
            <button
              onClick={() => setMapZoomFocus('all')}
              className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition"
            >
              Reset View
            </button>
            <button
              onClick={() => setShowDangerZones(!showDangerZones)}
              className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition"
            >
              {showDangerZones ? 'Hide Zones' : 'Show Zones'}
            </button>
          </div>
        </div>

        {/* Live Reservoir Telemetry Card (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20 hidden md:block bg-slate-900/90 backdrop-blur-md p-4 rounded-3xl border border-slate-700/60 shadow-2xl max-w-sm">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div>
              <h4 className="font-bold text-sm text-white">{ACTIVE_DAM.name}</h4>
              <p className="text-[11px] text-slate-400">{ACTIVE_DAM.river}</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 border border-red-500/40 text-red-300">
              DISCHARGING
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400">Current Outflow</span>
              <p className="text-base font-black text-cyan-300">410k <span className="text-xs font-normal">cusecs</span></p>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400">Water Elevation</span>
              <p className="text-base font-black text-amber-300">{ACTIVE_DAM.waterLevelM}m <span className="text-xs font-normal">/ 192m</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 4. PRAVAH AI CHATBOT (FLOATING WINDOW)     */}
      {/* ========================================== */}
      
      {/* Toggle Button when closed */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border border-cyan-300/40 group"
        >
          <Sparkles className="w-6 h-6 animate-pulse text-cyan-200" />
          <div className="text-left pr-1">
            <p className="text-xs font-black leading-none">PRAVAH AI</p>
            <p className="text-[10px] text-cyan-200">Emergency & Route AI</p>
          </div>
        </button>
      )}

      {/* Glassmorphic Chatbot Interface */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[430px] h-[610px] max-h-[92vh] bg-slate-950/90 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-2xl text-white shadow-md shadow-cyan-600/30">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">PRAVAH AI Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-cyan-400 font-mono">Location & Flood Intelligence Active</p>
              </div>
            </div>

            <button
              onClick={() => setIsChatOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Pills */}
          <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800/80 flex gap-2 overflow-x-auto no-scrollbar">
            {QUICK_PROMPT_PILLS.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleUserSend(pill)}
                className="text-[11px] whitespace-nowrap px-3 py-1.5 bg-slate-800/80 hover:bg-blue-600 hover:text-white border border-slate-700 rounded-full text-slate-300 transition-all shrink-0"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md'
                      : msg.alertLevel === 'RED_CRITICAL'
                      ? 'bg-red-950/80 border border-red-500/80 text-red-100 rounded-bl-none shadow-lg shadow-red-950/50'
                      : msg.alertLevel === 'YELLOW_ALERT'
                      ? 'bg-amber-950/70 border border-amber-500/70 text-amber-100 rounded-bl-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {/* Alert Header Badge */}
                  {msg.alertLevel === 'RED_CRITICAL' && (
                    <div className="flex items-center gap-1.5 text-red-400 font-black mb-1.5 uppercase text-[10px] tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5" /> High Inundation Risk Detected
                    </div>
                  )}

                  <p>{msg.text}</p>

                  {/* Interactive Embedded Shelter / Action Card */}
                  {msg.shelter && (
                    <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {msg.shelter.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between">
                        <span>Distance: <strong className="text-slate-200">{msg.shelter.distanceKm} km</strong></span>
                        <span>Medical Unit: <strong className="text-emerald-300">Ready</strong></span>
                      </div>
                      <div className="pt-1 flex gap-2">
                        <button
                          onClick={() => {
                            setShowSafeRouteOnMap(true);
                            setMapZoomFocus('shelter');
                          }}
                          className="flex-1 bg-blue-600/30 hover:bg-blue-600 text-cyan-200 hover:text-white border border-blue-500/40 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                        >
                          <Navigation className="w-3 h-3" /> Focus Safe Route
                        </button>
                        <a
                          href={`tel:${msg.shelter.phone}`}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center transition"
                          title="Call Shelter"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                PRAVAH AI is analyzing spatial satellite flood grid...
              </div>
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Input & Voice Controls */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-xl border transition ${
                isListening
                  ? 'bg-red-600 text-white border-red-500 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Speak to PRAVAH AI"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUserSend()}
              placeholder={
                language === 'hi'
                  ? 'सुरक्षित रास्ता या खतरे की जानकारी पूछें...'
                  : 'Ask about safe routes, flood risk, or nearest shelter...'
              }
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            <button
              type="button"
              onClick={() => handleUserSend()}
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl shadow-md transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. FULL EMERGENCY MODE OVERLAY MODAL       */}
      {/* ========================================== */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-gradient-to-b from-red-950/95 via-slate-900 to-slate-950 border-2 border-red-600 rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-red-950/80">
            
            <button
              onClick={() => setEmergencyModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Emergency Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-600 text-white rounded-2xl animate-pulse">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 bg-red-600/40 border border-red-500 rounded-full font-black text-red-200">
                  CRITICAL EMERGENCY PROTOCOL
                </span>
                <h2 className="text-xl md:text-2xl font-black mt-1 text-white">
                  DANGER DETECTED NEAR YOUR LOCATION
                </h2>
              </div>
            </div>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-6">
              Hirakud Dam discharge has exceeded 410,000 cusecs. Flood wave estimated arrival in your sector is <strong className="text-red-400">1.5 hours</strong>. Evacuate downstream lowlands immediately.
            </p>

            {/* Two Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-red-950/40 border border-red-800/60 p-3.5 rounded-2xl">
                <span className="text-xs text-red-400 font-bold flex items-center gap-1.5 mb-1">
                  <Navigation className="w-3.5 h-3.5" /> Nearest Safe Shelter
                </span>
                <p className="font-bold text-sm text-slate-100">{activeShelter.name}</p>
                <p className="text-[11px] text-slate-400 mt-1">Distance: {activeShelter.distanceKm} km away</p>
              </div>

              <div className="bg-red-950/40 border border-red-800/60 p-3.5 rounded-2xl">
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Evacuation Direction
                </span>
                <p className="font-bold text-sm text-slate-100">Evacuate North-East</p>
                <p className="text-[11px] text-slate-400 mt-1">Follow highlighted BLUE route</p>
              </div>
            </div>

            {/* Quick Emergency Contacts */}
            <div className="mb-6">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Emergency Hotlines (Direct Dial)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'NDRF', num: '1078' },
                  { name: 'SDMA Control', num: '1070' },
                  { name: 'Ambulance', num: '108' },
                  { name: 'Police', num: '112' },
                ].map((item, i) => (
                  <a
                    key={i}
                    href={`tel:${item.num}`}
                    className="p-2.5 bg-white/5 hover:bg-red-600/30 border border-white/10 rounded-xl text-xs font-semibold flex items-center justify-between transition"
                  >
                    <span>{item.name}</span>
                    <span className="text-red-400 font-mono text-[11px]">{item.num}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setEmergencyModalOpen(false);
                  setShowSafeRouteOnMap(true);
                  setMapZoomFocus('shelter');
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/40 transition"
              >
                <Navigation className="w-4 h-4" /> View Evacuation Route on Map
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `EMERGENCY LOCATION: https://maps.google.com/?q=${currentUserCoord.lat},${currentUserCoord.lng}`
                  );
                  alert('Your exact coordinates have been copied to share with rescue teams.');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition"
              >
                <Share2 className="w-4 h-4" /> Share Location
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PravahAIPrototype;