import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  delta: string;
  accent: 'cyan' | 'green' | 'yellow' | 'red';
  icon: ReactNode;
}

export function StatCard({ title, value, delta, accent, icon }: StatCardProps) {
  const accentClass = {
    cyan: 'text-cyan-300',
    green: 'text-emerald-300',
    yellow: 'text-yellow-300',
    red: 'text-red-300',
  }[accent];

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <span className="title">{title}</span>
        <span className={`text-xl ${accentClass}`}>{icon}</span>
      </div>
      <div className="value" style={{ color: 'white' }}>{value}</div>
      <div className="delta">{delta}</div>
    </div>
  );
}
