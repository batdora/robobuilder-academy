import { useEffect, useState, useRef } from 'react';
import { useProgressStore } from '../../stores/progress';
import { ROBOT_PARTS, JOURNAL_ENTRIES } from '../../lib/robot-parts';

interface JournalEntryProps {
  partId: string;
  text: string;
  index: number;
}

function JournalEntry({ partId, text, index }: JournalEntryProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    // Only animate once, using IntersectionObserver for visibility
    if (animatedRef.current) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          let i = 0;
          const interval = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
              clearInterval(interval);
              setDone(true);
            }
          }, 20);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  const part = ROBOT_PARTS[partId as keyof typeof ROBOT_PARTS];

  return (
    <div
      ref={ref}
      className="relative border border-[#00ff41]/30 bg-[#0a0a0f] rounded p-4 mb-4"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded opacity-5"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.1) 2px, rgba(0, 255, 65, 0.1) 4px)',
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{part?.icon ?? '?'}</span>
        <span
          className="font-[family-name:var(--font-heading)] text-[0.55rem]"
          style={{ color: part?.color ?? '#fff' }}
        >
          {part?.name ?? partId} INSTALLED
        </span>
      </div>

      {/* Terminal text */}
      <p className="font-mono text-[#00ff41] text-sm leading-relaxed whitespace-pre-wrap">
        {done ? text : displayed}
        {!done && <span className="animate-pixel-pulse">_</span>}
      </p>
    </div>
  );
}

export default function JournalPage() {
  const robotParts = useProgressStore((s) => s.robotParts);
  const robotName = useProgressStore((s) => s.robotName);

  // Get journal entries for unlocked parts, in order
  const entries = Object.entries(JOURNAL_ENTRIES).filter(([partId]) =>
    robotParts.includes(partId),
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Terminal header */}
      <div className="bg-[#0a0a0f] border-2 border-[#00ff41]/40 rounded-t p-3 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ff0040]" />
        <div className="w-3 h-3 rounded-full bg-[#ffd700]" />
        <div className="w-3 h-3 rounded-full bg-[#00ff41]" />
        <span className="ml-2 font-mono text-[#a0a0b0] text-xs">
          {robotName}_journal.log
        </span>
      </div>

      {/* Terminal body */}
      <div className="bg-[#0a0a0f] border-2 border-t-0 border-[#00ff41]/40 rounded-b p-4 min-h-[400px]">
        {entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-mono text-[#00ff41]/50 text-sm">
              {'>'} JOURNAL EMPTY
            </p>
            <p className="font-mono text-[#a0a0b0] text-xs mt-2">
              Complete lessons to unlock robot parts and journal entries.
            </p>
          </div>
        ) : (
          <>
            <p className="font-mono text-[#00ff41]/60 text-xs mb-4">
              {'>'} cat /var/log/{robotName.toLowerCase().replace(/\s+/g, '_')}/journal.log
            </p>
            {entries.map(([partId, text], i) => (
              <JournalEntry key={partId} partId={partId} text={text} index={i} />
            ))}
            <p className="font-mono text-[#00ff41]/40 text-xs mt-4 animate-pixel-pulse">
              {'>'} _
            </p>
          </>
        )}
      </div>
    </div>
  );
}
