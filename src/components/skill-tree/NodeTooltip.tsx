import { useState, type ReactNode } from 'react';

interface NodeTooltipProps {
  content: string;
  children: ReactNode;
}

function NodeTooltip({ content, children }: NodeTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            padding: '6px 10px',
            backgroundColor: '#0f3460',
            color: '#ffffff',
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '0.5rem',
            lineHeight: 1.6,
            whiteSpace: 'nowrap',
            border: '2px solid #0095ff',
            imageRendering: 'pixelated',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          {content}
          {/* Tooltip arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #0095ff',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default NodeTooltip;
