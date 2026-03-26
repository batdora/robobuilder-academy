import { useMemo, useState } from 'react';

interface Props {
  studyDates: Record<string, number>;
}

function getColorForXP(xp: number): string {
  if (xp === 0) return '#16213e';
  if (xp < 50) return '#0a3d0a';
  if (xp < 150) return '#0d5c0d';
  if (xp < 300) return '#19a319';
  return '#00ff41';
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StudyCalendar({ studyDates }: Props) {
  const [tooltip, setTooltip] = useState<{ date: string; xp: number; x: number; y: number } | null>(null);

  const days = useMemo(() => {
    const result: { date: string; xp: number; dayOfWeek: number }[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      result.push({
        date: iso,
        xp: studyDates[iso] ?? 0,
        dayOfWeek: d.getDay(),
      });
    }
    return result;
  }, [studyDates]);

  // Arrange into columns (weeks)
  const grid = useMemo(() => {
    const cols: (typeof days[0] | null)[][] = [];
    let currentCol: (typeof days[0] | null)[] = Array(7).fill(null);

    for (const day of days) {
      if (day.dayOfWeek === 0 && currentCol.some((d) => d !== null)) {
        cols.push(currentCol);
        currentCol = Array(7).fill(null);
      }
      currentCol[day.dayOfWeek] = day;
    }
    cols.push(currentCol);

    return cols;
  }, [days]);

  return (
    <div className="relative">
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="w-8 h-4 text-[0.4rem] text-[#a0a0b0] flex items-center font-[family-name:var(--font-heading)]"
            >
              {i % 2 === 1 ? label : ''}
            </div>
          ))}
        </div>

        {/* Grid */}
        {grid.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-0.5">
            {col.map((day, ri) => (
              <div
                key={ri}
                className="w-4 h-4 rounded-sm cursor-pointer transition-transform hover:scale-125"
                style={{ backgroundColor: day ? getColorForXP(day.xp) : 'transparent' }}
                onMouseEnter={(e) => {
                  if (day) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ date: day.date, xp: day.xp, x: rect.left, y: rect.top - 30 });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-[#16213e] border border-[#0095ff] text-white text-[0.5rem] font-[family-name:var(--font-heading)] px-2 py-1 rounded pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.date}: {tooltip.xp} XP
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[0.4rem] text-[#a0a0b0] font-[family-name:var(--font-heading)]">Less</span>
        {[0, 50, 150, 300, 500].map((xp, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColorForXP(xp) }}
          />
        ))}
        <span className="text-[0.4rem] text-[#a0a0b0] font-[family-name:var(--font-heading)]">More</span>
      </div>
    </div>
  );
}
