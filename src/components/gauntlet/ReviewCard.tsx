interface ReviewCardProps {
  question: string;
  answer: string;
  explanation?: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function ReviewCard({
  question,
  answer,
  explanation,
  isFlipped,
  onFlip,
}: ReviewCardProps) {
  return (
    <div
      onClick={onFlip}
      style={{
        perspective: '1000px',
        cursor: 'pointer',
        minHeight: '240px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '240px',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="nes-container is-dark"
          style={{
            position: 'absolute',
            width: '100%',
            minHeight: '240px',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            boxSizing: 'border-box',
          }}
        >
          <p
            style={{
              color: '#ffffff',
              fontSize: '0.9rem',
              lineHeight: 1.8,
              textAlign: 'center',
              margin: '0 0 1.5rem 0',
            }}
          >
            {question}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.5rem',
              color: '#a0a0b0',
              margin: 0,
            }}
          >
            Tap to reveal
          </p>
        </div>

        {/* Back */}
        <div
          className="nes-container is-dark"
          style={{
            position: 'absolute',
            width: '100%',
            minHeight: '240px',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            boxSizing: 'border-box',
          }}
        >
          <p
            style={{
              color: '#00ff41',
              fontSize: '0.9rem',
              lineHeight: 1.8,
              textAlign: 'center',
              margin: '0 0 1rem 0',
            }}
          >
            {answer}
          </p>
          {explanation && (
            <div
              style={{
                borderLeft: '4px solid #0095ff',
                paddingLeft: '1rem',
                width: '100%',
              }}
            >
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#a0a0b0',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
