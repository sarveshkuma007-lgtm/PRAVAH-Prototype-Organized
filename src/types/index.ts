export type Language = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa';
export type RiskLevel = 'Safe' | 'Warning' | 'Critical';
export type DamStatus = 'Normal' | 'Watch' | 'High' | 'Critical';

export interface DamRecord {
  id: string;
  name: string;
  river: string;
  state: string;
  region: string;
  latitude: number;
  longitude: number;
  waterLevel: number;
  maxWaterLevel: number;
  inflow: number;
  outflow: number;
  rainfall: number;
  temperature: number;
  health: number;
  seismic: number;
  status: DamStatus;
  risk: RiskLevel;
}

export interface AlertItem {
  id: string;
  title: string;
  area: string;
  level: 'High Risk' | 'Moderate Risk' | 'Resolved';
  time: string;
  detail: string;
}

export interface WeatherDay {
  day: string;
  temp: number;
  rain: number;
  humidity: number;
  wind: number;
}

export interface ForecastHour {
  time: string;
  temp: number;
  rain: number;
}

export interface ShelterRecord {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  capacity: number;
  occupied: number;
  medical: boolean;
}

export interface ZoneRecord {
  id: string;
  name: string;
  level: RiskLevel;
  x: number;
  y: number;
  radius: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
