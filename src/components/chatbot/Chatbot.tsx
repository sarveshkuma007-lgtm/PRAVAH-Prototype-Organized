import { Bot, Send, Sparkles, AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ChatMessage, Language } from '../../types';

interface ChatbotProps {
  language: Language;
  locationText: string;
  selectedDam: string;
  routeWarning?: boolean;
  locationEnabled?: boolean;
}

const baseMessages: ChatMessage[] = [
  { id: 'm1', sender: 'assistant', text: 'PRAVAH AI is monitoring live reservoir telemetry and flood corridors.', timestamp: 'now' },
];

const prompts = ['Check flood risk', 'Nearest shelter', 'Dam inflow trend', 'Safe route guidance'];

export function Chatbot({ language, locationText, selectedDam, routeWarning = false, locationEnabled = false }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(baseMessages);
  const [input, setInput] = useState('');

  const assistantTone = useMemo(() => {
    const warningText = locationText.includes('yellow') || locationText.includes('warning') ? 'Your current location is near a yellow warning zone. Avoid low-lying roads and move toward the nearest green safe zone.' : 'Your current location appears stable. Continue to monitor updates and look for evacuation guidance if river levels rise.';

    return warningText;
  }, [locationText]);

  const sendMessage = (value?: string) => {
    const finalValue = (value ?? input).trim();
    if (!finalValue) return;

    setMessages((prev) => [...prev, { id: `${Date.now()}`, sender: 'user', text: finalValue, timestamp: 'now' }]);
    setInput('');

    const lower = finalValue.toLowerCase();
    const routeWarningText = routeWarning
      ? 'Your route passes through a danger zone. Avoid the low-lying corridor and use the nearest green safe route instead.'
      : 'Your current route remains within the monitored safe corridor.';

    const reply = lower.includes('route') || lower.includes('shelter')
      ? `Nearest safe shelter is ${selectedDam}. ${locationEnabled ? routeWarningText : 'Location services are not active, so the route guidance is based on the monitored map snapshot.'} ${assistantTone}`
      : lower.includes('dam')
        ? `${selectedDam} reservoir is under active monitoring. Inflow and outflow remain within operational thresholds, but downstream alert buffers remain in place.`
        : lower.includes('risk') || lower.includes('flood')
          ? `Flood risk is elevated in the downstream sector. ${routeWarningText} ${assistantTone}`
          : lower.includes('trend')
            ? `Dam inflow trend is increasing steadily with a moderate-to-high risk curve. The model suggests a sustained downstream rise over the next 90 minutes.`
            : `PRAVAH AI reviewed conditions around ${locationText}. ${routeWarningText} ${assistantTone}`;

    setTimeout(() => {
      setMessages((prev) => [...prev, { id: `${Date.now()}-a`, sender: 'assistant', text: reply, timestamp: 'now' }]);
    }, 400);
  };

  return (
    <div className="chatbot-shell">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: 'rgba(9, 17, 27, 0.96)', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #18d3ff, #3b82f6)', borderRadius: 12, display: 'grid', placeItems: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800 }}>PRAVAH AI Assistant</div>
            <div style={{ fontSize: 11, color: '#7dd3fc' }}>Location-aware flood guidance</div>
          </div>
        </div>
        <Sparkles size={18} color="#7dd3fc" />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 14px 8px', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
        {prompts.map((prompt) => (
          <button key={prompt} type="button" className="quick-pill" onClick={() => sendMessage(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <div className="chat-list">
        {messages.map((message) => (
          <div key={message.id} className={`bubble ${message.sender}`}>
            {message.text}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(148,163,184,0.12)', background: 'rgba(7,12,20,0.96)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={language === 'hi' ? 'सुरक्षित मार्ग पूछें...' : 'Ask about flood safety...'}
          style={{ flex: 1, padding: '12px 14px', borderRadius: 14, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)', color: 'white' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
        />
        <button type="button" className="primary-btn" onClick={() => sendMessage()} style={{ padding: '12px 14px' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
