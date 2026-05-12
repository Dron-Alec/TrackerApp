interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function tierLabel(score: number): string {
  if (score >= 75) return 'HIGH PRIORITY';
  if (score >= 50) return 'MEDIUM';
  if (score >= 25) return 'LOW';
  return 'MINIMAL';
}

function tierClasses(score: number): string {
  if (score >= 75) return 'bg-teal-500 text-white';
  if (score >= 50) return 'bg-amber-400 text-crowe-navy';
  if (score >= 25) return 'bg-crowe-blue text-white';
  return 'bg-gray-400 text-white';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded font-bold tracking-wide ${sizeClasses[size]} ${tierClasses(score)}`}>
      <span>{score}</span>
      <span className="opacity-80">·</span>
      <span>{tierLabel(score)}</span>
    </span>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? '#05AB8C' : score >= 50 ? '#F5A800' : score >= 25 ? '#0075C9' : '#828282';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
}
