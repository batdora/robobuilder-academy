import { useState, useCallback, useRef } from 'react';

interface DragDropOrderProps {
  items: string[];
  onSubmit: (ordered: string[]) => void;
}

export default function DragDropOrder({ items, onSubmit }: DragDropOrderProps) {
  const [orderedItems, setOrderedItems] = useState<string[]>([...items]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      setDragIndex(index);
      dragNode.current = e.currentTarget;
      e.dataTransfer.effectAllowed = 'move';
      // Make the drag image slightly transparent
      setTimeout(() => {
        if (dragNode.current) {
          dragNode.current.style.opacity = '0.4';
        }
      }, 0);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragIndex === null || dragIndex === index) return;
      setOverIndex(index);
    },
    [dragIndex],
  );

  const handleDragLeave = useCallback(() => {
    setOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === dropIndex) return;

      setOrderedItems((prev) => {
        const updated = [...prev];
        const [removed] = updated.splice(dragIndex, 1);
        updated.splice(dropIndex, 0, removed);
        return updated;
      });

      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex],
  );

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) {
      dragNode.current.style.opacity = '1';
    }
    setDragIndex(null);
    setOverIndex(null);
    dragNode.current = null;
  }, []);

  return (
    <div className="nes-container is-dark" style={{ padding: '1.5rem' }}>
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.65rem',
          color: '#0095ff',
          marginBottom: '1rem',
        }}
      >
        DRAG TO REORDER
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {orderedItems.map((item, index) => {
          const isDragging = dragIndex === index;
          const isOver = overIndex === index;

          return (
            <div
              key={`${item}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: isOver
                  ? '3px solid #0095ff'
                  : isDragging
                    ? '3px dashed #a0a0b0'
                    : '3px solid #a0a0b0',
                backgroundColor: isOver
                  ? 'rgba(0, 149, 255, 0.15)'
                  : isDragging
                    ? 'rgba(255,255,255,0.03)'
                    : 'transparent',
                cursor: 'grab',
                transition: 'border-color 0.15s, background-color 0.15s',
                userSelect: 'none',
              }}
            >
              {/* Slot number */}
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.7rem',
                  color: '#ffd700',
                  minWidth: '1.5rem',
                  textAlign: 'center',
                }}
              >
                {index + 1}.
              </span>

              {/* Drag handle */}
              <span
                style={{
                  fontSize: '0.8rem',
                  color: '#a0a0b0',
                  marginRight: '0.25rem',
                }}
              >
                &#x2630;
              </span>

              {/* Item text */}
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#ffffff',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.6,
                  flex: 1,
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button
          className="nes-btn is-success"
          onClick={() => onSubmit(orderedItems)}
        >
          Submit Order
        </button>
      </div>
    </div>
  );
}
