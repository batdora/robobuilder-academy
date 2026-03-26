import { useState } from 'react';

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze';
}

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedIndex: number) => void;
}

const bloomColors: Record<string, string> = {
  remember: '#0095ff',
  understand: '#00ff41',
  apply: '#ffd700',
  analyze: '#b347d9',
};

const bloomLabels: Record<string, string> = {
  remember: 'Remember',
  understand: 'Understand',
  apply: 'Apply',
  analyze: 'Analyze',
};

export default function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const bloom = question.bloomLevel ?? 'remember';

  return (
    <div className="nes-container is-dark" style={{ padding: '1.5rem' }}>
      {/* Bloom level badge */}
      <div style={{ marginBottom: '1rem' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            fontSize: '0.55rem',
            fontFamily: 'var(--font-heading)',
            color: '#1a1a2e',
            backgroundColor: bloomColors[bloom],
            borderRadius: '0',
            imageRendering: 'pixelated',
            border: `2px solid ${bloomColors[bloom]}`,
          }}
        >
          {bloomLabels[bloom]}
        </span>
      </div>

      {/* Question text */}
      <p
        style={{
          color: '#ffffff',
          fontSize: '0.9rem',
          lineHeight: '1.8',
          marginBottom: '1.5rem',
        }}
      >
        {question.question}
      </p>

      {/* Answer options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {question.options.map((option, index) => (
          <button
            key={index}
            className="nes-btn"
            onClick={() => onAnswer(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              textAlign: 'left',
              padding: '0.75rem 1rem',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-body)',
              color: '#ffffff',
              backgroundColor: hoveredIndex === index ? '#0f3460' : 'transparent',
              border: hoveredIndex === index ? '4px solid #0095ff' : '4px solid #a0a0b0',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background-color 0.15s',
              width: '100%',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                color: '#0095ff',
                marginRight: '0.75rem',
                fontSize: '0.6rem',
              }}
            >
              {String.fromCharCode(65 + index)}.
            </span>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
