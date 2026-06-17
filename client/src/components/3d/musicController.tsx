import React from 'react';
import { useAudio } from '../../lib/stores/useAudio';

export const MusicController: React.FC = () => {
  const {
    musicTracks,
    currentTrackIndex,
    isMuted,
    isPlaying,
    volume,
    toggleMute,
    setVolume,
    playNextTrack,
    playPreviousTrack,
    playTrack,
    setIsPlaying,
    backgroundMusic,
  } = useAudio();

  const currentTrackName = musicTracks[currentTrackIndex]?.src.split('/').pop() || 'No Track';

  const togglePlay = () => {
    if (!backgroundMusic) return;

    if (isPlaying) {
      backgroundMusic.pause();
      setIsPlaying(false);
    } else {
      backgroundMusic.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      border: '1px solid #333',
      borderRadius: '6px',
      padding: '10px 15px',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
    }}>
      <div style={{ opacity: 0.85 }}>🎵 Now Playing: {currentTrackName}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {([
          { id: 'prev', label: '⏮ Prev', fn: playPreviousTrack },
          { id: 'play', label: isPlaying ? '⏸ Pause' : '▶️ Play', fn: togglePlay },
          { id: 'next', label: '⏭ Next', fn: playNextTrack },
          { id: 'mute', label: isMuted ? '🔇 Unmute' : '🔊 Mute', fn: toggleMute },
        ] as { id: string; label: string; fn: () => void }[]).map(({ id, label, fn }) => (
          <button
            key={id}
            onClick={fn}
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#aaa'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#555'; }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
        <span style={{ fontSize: '12px', opacity: 0.7 }}>🔈</span>
        <input
          type="range"
          min={0}
          max={0.5}
          step={0.01}
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          style={{ flex: 1, cursor: 'pointer', accentColor: '#aaa' }}
          aria-label="Music volume"
        />
        <span style={{ fontSize: '11px', opacity: 0.6, width: '32px', textAlign: 'right', fontFamily: 'monospace' }}>
          {Math.round(volume * 100)}
        </span>
      </div>
    </div>
  );
};