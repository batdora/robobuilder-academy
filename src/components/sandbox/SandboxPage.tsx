/**
 * SandboxPage - Full sandbox page composing Sandbox, ABToggle, GhostOverlay, and RobotJournal.
 * This is a React island loaded by sandbox.astro.
 */
import { useState, useCallback } from 'react';
import Sandbox from './Sandbox';
import ABToggle from './ABToggle';
import GhostOverlay from './GhostOverlay';
import type { OverlayType } from './GhostOverlay';
import RobotJournal from './RobotJournal';
import type { JournalEntry } from './RobotJournal';
import { useProgressStore } from '../../stores/progress';
import { CHALLENGES } from './challenges';

export default function SandboxPage() {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [overlayType, setOverlayType] = useState<OverlayType | null>(null);
  const [overlayData, setOverlayData] = useState<any>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  const activeParts = useProgressStore((s) => s.activeParts);

  const handleJournalEntry = useCallback((entry: JournalEntry) => {
    setJournalEntries((prev) => [...prev.slice(-200), entry]);
  }, []);

  const handleOverlayData = useCallback((type: OverlayType, data: unknown) => {
    setOverlayType(type);
    setOverlayData(data);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        padding: '16px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: '"Press Start 2P", monospace',
        flexWrap: 'wrap',
      }}
    >
      {/* Left: Main sandbox + controls */}
      <div style={{ flex: '1 1 800px', minWidth: '320px' }}>
        {/* Challenge selector */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#a0a0b0', fontSize: '0.5rem', display: 'block', marginBottom: '4px' }}>
            CHALLENGE:
          </label>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              className={`nes-btn ${selectedChallenge === null ? 'is-primary' : ''}`}
              onClick={() => setSelectedChallenge(null)}
              style={{ fontSize: '0.4rem', padding: '3px 8px' }}
            >
              Free Play
            </button>
            {CHALLENGES.map((ch) => (
              <button
                key={ch.id}
                className={`nes-btn ${selectedChallenge === ch.id ? 'is-primary' : ''}`}
                onClick={() => setSelectedChallenge(ch.id)}
                style={{ fontSize: '0.4rem', padding: '3px 8px' }}
                title={ch.description}
              >
                {ch.name}
              </button>
            ))}
          </div>
        </div>

        {/* Challenge description */}
        {selectedChallenge && (
          <div
            style={{
              background: '#16213e',
              border: '1px solid #0095ff44',
              borderRadius: '4px',
              padding: '8px',
              marginBottom: '12px',
              fontSize: '0.5rem',
              color: '#a0a0b0',
            }}
          >
            {CHALLENGES.find((c) => c.id === selectedChallenge)?.description}
            <div style={{ marginTop: '4px', color: '#ffd700', fontSize: '0.45rem' }}>
              Required parts: {CHALLENGES.find((c) => c.id === selectedChallenge)?.requiredParts.join(', ') || 'None'}
            </div>
          </div>
        )}

        {/* Sandbox with optional overlay */}
        <div style={{ position: 'relative' }}>
          <Sandbox
            challengeId={selectedChallenge ?? undefined}
            onJournalEntry={handleJournalEntry}
            onOverlayData={handleOverlayData}
          />

          {/* Ghost overlay */}
          {showOverlay && overlayType && (
            <GhostOverlay
              type={overlayType}
              data={overlayData}
              gridSize={32}
              width={800}
              height={600}
            />
          )}
        </div>

        {/* Overlay toggle */}
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ color: '#a0a0b0', fontSize: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              className="nes-checkbox is-dark"
              checked={showOverlay}
              onChange={(e) => setShowOverlay(e.target.checked)}
            />
            <span>Ghost Overlay</span>
          </label>

          {overlayType && (
            <span style={{ color: '#b347d9', fontSize: '0.45rem' }}>
              [{overlayType}]
            </span>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Part toggles */}
        <ABToggle />

        {/* Robot Journal */}
        <RobotJournal entries={journalEntries} />

        {/* Quick stats */}
        <div
          style={{
            background: '#16213e',
            border: '2px solid #0095ff44',
            borderRadius: '4px',
            padding: '12px',
            fontSize: '0.5rem',
          }}
        >
          <div style={{ color: '#0095ff', marginBottom: '8px', fontSize: '0.55rem' }}>
            ROBOT STATUS
          </div>
          <div style={{ color: '#a0a0b0', marginBottom: '4px' }}>
            Parts installed: <span style={{ color: '#ffd700' }}>{activeParts.length}</span>
          </div>
          <div style={{ color: '#a0a0b0', marginBottom: '4px' }}>
            Active systems:
          </div>
          <div style={{ paddingLeft: '8px', color: '#00ff41', fontSize: '0.45rem' }}>
            {activeParts.length === 0 && <div style={{ color: '#a0a0b066' }}>None</div>}
            {activeParts.includes('EYES') && <div>Vision: ON</div>}
            {activeParts.includes('INSTINCT_CHIP') && <div>Q-Learning: ON</div>}
            {activeParts.includes('VISUAL_CORTEX') && <div>DQN: ON</div>}
            {activeParts.includes('STABILITY_MODULE') && <div>Double Q: ON</div>}
            {activeParts.includes('MOTOR_CORTEX') && <div>Smooth Movement: ON</div>}
            {activeParts.includes('SAFETY_GOVERNOR') && <div>PPO Safety: ON</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
