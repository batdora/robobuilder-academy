import { useState } from 'react';

interface Label {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  correctAnswer: string;
  options: string[];
}

interface DiagramLabelProps {
  imageSrc?: string;
  description: string;
  labels: Label[];
  onSubmit: (answers: Record<string, string>) => void;
}

export default function DiagramLabel({
  imageSrc,
  description,
  labels,
  onSubmit,
}: DiagramLabelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    labels.forEach((l) => {
      init[l.id] = '';
    });
    return init;
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (labelId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [labelId]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit(answers);
  };

  const allFilled = labels.every((l) => answers[l.id] !== '');

  return (
    <div className="nes-container is-dark" style={{ padding: '1.5rem' }}>
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.65rem',
          color: '#b347d9',
          marginBottom: '0.75rem',
        }}
      >
        LABEL THE DIAGRAM
      </p>

      {/* Description */}
      <p
        style={{
          fontSize: '0.8rem',
          color: '#ffffff',
          lineHeight: 1.7,
          marginBottom: '1rem',
        }}
      >
        {description}
      </p>

      {/* Diagram area */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '300px',
          border: '3px solid #a0a0b0',
          backgroundColor: '#1a1a2e',
          marginBottom: '1.5rem',
          overflow: 'hidden',
        }}
      >
        {/* Image or placeholder */}
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Diagram"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a0a0b0',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.6rem',
            }}
          >
            [ARCHITECTURE DIAGRAM]
          </div>
        )}

        {/* Label markers */}
        {labels.map((label, index) => {
          const isCorrect = submitted && answers[label.id] === label.correctAnswer;
          const isWrong = submitted && answers[label.id] !== label.correctAnswer;

          return (
            <div
              key={label.id}
              style={{
                position: 'absolute',
                left: `${label.x}%`,
                top: `${label.y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                zIndex: 10,
              }}
            >
              {/* Numbered marker */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '0',
                  border: isCorrect
                    ? '3px solid #00ff41'
                    : isWrong
                      ? '3px solid #ff0040'
                      : '3px solid #ffd700',
                  backgroundColor: isCorrect
                    ? 'rgba(0, 255, 65, 0.3)'
                    : isWrong
                      ? 'rgba(255, 0, 64, 0.3)'
                      : 'rgba(255, 215, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.6rem',
                  color: '#ffffff',
                  imageRendering: 'pixelated',
                }}
              >
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Label selectors */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        {labels.map((label, index) => {
          const isCorrect = submitted && answers[label.id] === label.correctAnswer;
          const isWrong = submitted && answers[label.id] !== label.correctAnswer;

          return (
            <div
              key={label.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              {/* Number */}
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.65rem',
                  color: '#ffd700',
                  minWidth: '2rem',
                }}
              >
                [{index + 1}]
              </span>

              {/* Dropdown */}
              <select
                value={answers[label.id]}
                onChange={(e) => handleChange(label.id, e.target.value)}
                disabled={submitted}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.75rem',
                  padding: '0.5rem',
                  backgroundColor: isCorrect
                    ? 'rgba(0, 255, 65, 0.15)'
                    : isWrong
                      ? 'rgba(255, 0, 64, 0.15)'
                      : '#0f3460',
                  color: '#ffffff',
                  border: isCorrect
                    ? '3px solid #00ff41'
                    : isWrong
                      ? '3px solid #ff0040'
                      : '3px solid #a0a0b0',
                  cursor: submitted ? 'default' : 'pointer',
                }}
              >
                <option value="">-- Select --</option>
                {label.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              {/* Correction */}
              {isWrong && (
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.5rem',
                    color: '#00ff41',
                  }}
                >
                  {label.correctAnswer}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit */}
      {!submitted && (
        <div style={{ textAlign: 'center' }}>
          <button
            className="nes-btn is-primary"
            onClick={handleSubmit}
            disabled={!allFilled}
            style={{ opacity: allFilled ? 1 : 0.5 }}
          >
            Submit Labels
          </button>
        </div>
      )}
    </div>
  );
}
