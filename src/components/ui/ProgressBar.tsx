interface ProgressBarProps {
  value: number;
  color?: string;
  label?: string;
  showPercent?: boolean;
}

export default function ProgressBar({
  value,
  color = '#00ff41',
  label,
  showPercent = false,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1 text-xs">
          {label && <span className="text-[#a0a0b0]">{label}</span>}
          {showPercent && <span style={{ color }}>{Math.round(clamped)}%</span>}
        </div>
      )}
      <div
        className="w-full h-4 border-2 border-white/20"
        style={{
          backgroundColor: '#0f3460',
          imageRendering: 'pixelated',
        }}
      >
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${clamped}%`,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}
