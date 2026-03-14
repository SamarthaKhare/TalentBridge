interface ScoreRingProps {
  score: number;
  size?: number;
}

export default function ScoreRing({ score, size = 48 }: ScoreRingProps) {
  const strokeWidth = size <= 36 ? 3 : 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 75) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    if (score >= 25) return '#f97316';
    return '#ef4444';
  };

  // Scale font size based on ring size to prevent overflow
  const fontSize = size <= 32 ? 8 : size <= 40 ? 9 : size <= 48 ? 11 : 13;

  return (
    <div
      className="relative inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, minWidth: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute font-bold leading-none whitespace-nowrap"
        style={{ color: getColor(score), fontSize: `${fontSize}px` }}
      >
        {score}
      </span>
    </div>
  );
}
