import { damList, shelters } from '../data/pravahData';
import { DamRecord, RiskLevel, ShelterRecord } from '../types';

export function getDamStatus(dam: DamRecord): RiskLevel {
  if (dam.status === 'Critical' || dam.risk === 'Critical') return 'Critical';
  if (dam.status === 'High' || dam.risk === 'Warning') return 'Warning';
  return 'Safe';
}

export function getNearestShelter(latitude: number, longitude: number): ShelterRecord {
  const nearest = shelters.reduce((best, current) => {
    const bestDistance = Math.hypot(best.latitude - latitude, best.longitude - longitude);
    const currentDistance = Math.hypot(current.latitude - latitude, current.longitude - longitude);
    return currentDistance < bestDistance ? current : best;
  }, shelters[0]);

  return nearest;
}

export function getSelectedDam(id: string): DamRecord {
  return damList.find((dam) => dam.id === id) ?? damList[0];
}

export function getRiskBand(level: RiskLevel): string {
  switch (level) {
    case 'Critical':
      return 'Critical flood risk';
    case 'Warning':
      return 'Elevated flood advisory';
    default:
      return 'Normal / within safe band';
  }
}

export function formatCusecs(value: number): string {
  return `${(value / 1000).toFixed(1)}k cusecs`;
}
