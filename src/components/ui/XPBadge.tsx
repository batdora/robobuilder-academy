import { useProgressStore } from '../../stores/progress';
import { calculateLevel, LEVEL_TITLES } from '../../lib/xp';
import ProgressBar from './ProgressBar';

export default function XPBadge() {
  const totalXP = useProgressStore((s) => s.totalXP);
  const { level, currentXP, nextLevelXP } = calculateLevel(totalXP);
  const title = LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];
  const percent = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 100;

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 flex items-center justify-center border-2 border-[#ffd700] text-[#ffd700] font-[family-name:var(--font-heading)] text-xs"
        style={{ imageRendering: 'pixelated' }}
      >
        {level}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[0.5rem] font-[family-name:var(--font-heading)] text-[#ffd700] truncate">
            {title}
          </span>
          <span className="text-[0.5rem] text-[#a0a0b0] ml-2 shrink-0">
            {totalXP} XP
          </span>
        </div>
        <ProgressBar value={percent} color="#ffd700" />
      </div>
    </div>
  );
}
