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
    <div className="p-4 bg-gray-800 text-white rounded-md flex flex-col items-center gap-2">
      <div>🎵 Now Playing: {currentTrackName}</div>
      <div className="flex gap-4">
        <button onClick={playPreviousTrack}>⏮ Prev</button>
        <button onClick={togglePlay}>{isPlaying ? '⏸ Pause' : '▶️ Play'}</button>
        <button onClick={playNextTrack}>⏭ Next</button>
        <button onClick={toggleMute}>{isMuted ? '🔇 Unmute' : '🔊 Mute'}</button>
      </div>
    </div>
  );
};