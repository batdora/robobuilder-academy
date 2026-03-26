import { useState, useEffect } from 'react';
import { isSoundEnabled, setSoundEnabled, playSound } from '../../lib/sounds';

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      playSound('click');
    }
  };

  return (
    <button
      onClick={toggle}
      className="text-lg hover:scale-110 transition-transform"
      title={enabled ? 'Mute sounds' : 'Unmute sounds'}
      aria-label={enabled ? 'Mute sounds' : 'Unmute sounds'}
    >
      {enabled ? '\u{1F50A}' : '\u{1F507}'}
    </button>
  );
}
