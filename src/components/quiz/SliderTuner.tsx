import { useState, useMemo } from 'react';

interface SliderTunerProps {
  paramName: string;
  min: number;
  max: number;
  step: number;
  correctRange: [number, number];
  description: string;
  effectDescription: string;
  onSubmit: (value: number) => void;
}

export default function SliderTuner({
  paramName,
  min,
  max,
  step,
  correctRange,
  description,
  effectDescription,
  onSubmit,
}: SliderTunerProps) {
  const mid = +(((min + max) / 2).toFixed(4));
  const [value, setValue] = useState<number>(mid);

  // Compute normalized position 0-1 for effect bar
  const normalized = useMemo(() => {
    return (value - min) / (max - min);
  }, [value, min, max]);

  // Effect color shifts from blue (low) -> green (mid) -> red (high)
  const effectColor = useMemo(() => {
    if (normalized < 0.33) return '#0095ff';
    if (normalized < 0.66) return '#00ff41';
    return '#ff0040';
  }, [normalized]);

  // Check if within correct range for the bar indicator
  const inRange =
    value >= correctRange[0] && value <= correctRange[1];

  return (
    <div className="nes-container is-dark" style={{ padding: '1.5rem' }}>
      {/* Parameter name */}
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.75rem',
          color: '#ffd700',
          marginBottom: '0.5rem',
        }}
      >
        {paramName}
      </p>

      {/* Description */}
      <p
        style={{
          fontSize: '0.8rem',
          color: '#ffffff',
          lineHeight: 1.7,
          marginBottom: '1.25rem',
        }}
      >
        {description}
      </p>

      {/* Value display */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.5rem',
            color: '#00ff41',
          }}
        >
          {value}
        </span>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: '1.25rem', padding: '0 0.25rem' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(+e.target.value)}
          style={{
            width: '100%',
            accentColor: '#0095ff',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.25rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.5rem',
              color: '#a0a0b0',
            }}
          >
            {min}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.5rem',
              color: '#a0a0b0',
            }}
          >
            {max}
          </span>
        </div>
      </div>

      {/* Effect indicator */}
      <div
        style={{
          border: '2px solid #a0a0b0',
          padding: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.55rem',
            color: '#a0a0b0',
            marginBottom: '0.5rem',
          }}
        >
          EFFECT PREVIEW
        </p>

        {/* Animated bar */}
        <div
          style={{
            width: '100%',
            height: '20px',
            backgroundColor: '#1a1a2e',
            border: '2px solid #a0a0b0',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${normalized * 100}%`,
              height: '100%',
              backgroundColor: effectColor,
              transition: 'width 0.2s ease, background-color 0.3s ease',
              imageRendering: 'pixelated',
              boxShadow: `0 0 8px ${effectColor}`,
            }}
          />
        </div>

        <p
          style={{
            fontSize: '0.7rem',
            color: '#ffffff',
            marginTop: '0.5rem',
            lineHeight: 1.6,
          }}
        >
          {effectDescription}
        </p>
      </div>

      {/* Submit */}
      <div style={{ textAlign: 'center' }}>
        <button
          className="nes-btn is-warning"
          onClick={() => onSubmit(value)}
        >
          Lock In
        </button>
      </div>
    </div>
  );
}
