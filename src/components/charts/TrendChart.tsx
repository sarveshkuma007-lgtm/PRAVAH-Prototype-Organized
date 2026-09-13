interface TrendChartProps {
  title: string;
  points: number[];
  labels: string[];
  color?: string;
}

export function TrendChart({ title, points, labels, color = '#5ee7ff' }: TrendChartProps) {
  const max = Math.max(...points, 100);
  const min = Math.min(...points, 0);

  return (
    <div className="chart-box">
      <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9db7c8', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'end', gap: 10, height: 150 }}>
        {points.map((point, index) => (
          <div key={labels[index]} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: '100%',
                height: `${(((point - min) / (max - min || 1)) * 100) || 10}%`,
                minHeight: 18,
                background: `linear-gradient(180deg, ${color}, rgba(59,130,246,0.4))`,
                borderRadius: '10px 10px 0 0',
                boxShadow: '0 0 16px rgba(94,231,255,0.24)',
              }}
            />
            <span style={{ fontSize: 10, color: '#8aa4b8' }}>{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
