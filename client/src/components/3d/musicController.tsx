import React from 'react';
import { useAudio } from '../../lib/stores/useAudio';

export const MusicController: React.FC = () => {
  const {
    musicTracks,
    currentTrackIndex,
    isMuted,
    isPlaying,
    toggleMute,
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
    </div>
  );
};