import { useState, useMemo } from 'react';

interface Blank {
  id: string;
  correctAnswer: string;
  options: string[];
}

interface FillEquationProps {
  equation: string; // contains ___BLANK___ placeholders
  blanks: Blank[];
  onSubmit: (answers: Record<string, string>) => void;
}

export default function FillEquation({
  equation,
  blanks,
  onSubmit,
}: FillEquationProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    blanks.forEach((b) => {
      init[b.id] = '';
    });
    return init;
  });
  const [submitted, setSubmitted] = useState(false);

  // Split equation around ___BLANK___ markers
  const segments = useMemo(() => {
    return equation.split('___BLANK___');
  }, [equation]);

  const handleChange = (blankId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [blankId]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit(answers);
  };

  const allFilled = blanks.every((b) => answers[b.id] !== '');

  return (
    <div className="nes-container is-dark" style={{ padding: '1.5rem' }}>
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.65rem',
          color: '#b347d9',
          marginBottom: '1rem',
        }}
      >
        FILL IN THE EQUATION
      </p>

      {/* Equation with blanks */}
      <div
        style={{
          padding: '1.25rem',
          border: '2px solid #a0a0b0',
          backgroundColor: '#1a1a2e',
          marginBottom: '1.5rem',
          lineHeight: 2.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        {segments.map((seg, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {/* Equation text */}
            <span
              style={{
                fontSize: '0.85rem',
                color: '#ffffff',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
              }}
            >
              {seg}
            </span>

            {/* Blank dropdown (not after last segment) */}
            {i < blanks.length && (
              <span style={{ display: 'inline-block', margin: '0 0.25rem' }}>
                <select
                  value={answers[blanks[i].id]}
                  onChange={(e) => handleChange(blanks[i].id, e.target.value)}
                  disabled={submitted}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.6rem',
                    padding: '0.3rem 0.5rem',
                    backgroundColor: submitted
                      ? answers[blanks[i].id] === blanks[i].correctAnswer
                        ? 'rgba(0, 255, 65, 0.2)'
                        : 'rgba(255, 0, 64, 0.2)'
                      : '#0f3460',
                    color: '#ffffff',
                    border: submitted
                      ? answers[blanks[i].id] === blanks[i].correctAnswer
                        ? '3px solid #00ff41'
                        : '3px solid #ff0040'
                      : '3px solid #0095ff',
                    cursor: submitted ? 'default' : 'pointer',
                    minWidth: '80px',
                  }}
                >
                  <option value="">???</option>
                  {blanks[i].options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Correction display after submit */}
      {submitted && (
        <div style={{ marginBottom: '1rem' }}>
          {blanks.map((blank, i) => {
            const isCorrect = answers[blank.id] === blank.correctAnswer;
            return (
              <p
                key={blank.id}
                style={{
                  fontSize: '0.7rem',
                  color: isCorrect ? '#00ff41' : '#ff0040',
                  fontFamily: 'var(--font-heading)',
                  marginBottom: '0.25rem',
                }}
              >
                Blank {i + 1}: {isCorrect ? 'Correct' : `Incorrect (answer: ${blank.correctAnswer})`}
              </p>
            );
          })}
        </div>
      )}

      {/* Submit button */}
      {!submitted && (
        <div style={{ textAlign: 'center' }}>
          <button
            className="nes-btn is-primary"
            onClick={handleSubmit}
            disabled={!allFilled}
            style={{ opacity: allFilled ? 1 : 0.5 }}
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
}
