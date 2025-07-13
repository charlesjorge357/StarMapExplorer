import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  musicTracks: HTMLAudioElement[];
  currentTrackIndex: number;
  startingTrackIndex: number; // Track which song we started with for alternating pattern
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  isMuted: boolean;
  isPlaying: boolean,
  setIsPlaying: (playing: boolean) => void;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setMusicTracks: (tracks: HTMLAudioElement[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  setStartingTrackIndex: (index: number) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  playTrack: (index: number) => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  musicTracks: [],
  currentTrackIndex: 0,
  startingTrackIndex: 0,
  hitSound: null,
  successSound: null,
  isMuted: false, // Start unmuted
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setMusicTracks: (tracks) => set({ musicTracks: tracks }),
  setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),
  setStartingTrackIndex: (index) => set({ startingTrackIndex: index }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  isPlaying : true,
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    const { backgroundMusic } = get();
    if (backgroundMusic) {
      backgroundMusic.muted = newMutedState;
    }
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },

  playNextTrack: () => {
    const { musicTracks, currentTrackIndex, startingTrackIndex, isMuted } = get();
    console.log(`playNextTrack called - tracks: ${musicTracks.length}, currentIndex: ${currentTrackIndex}, startingIndex: ${startingTrackIndex}, isMuted: ${isMuted}`);
    
    if (musicTracks.length === 0) {
      console.log("No music tracks available");
      return;
    }
    
    // Create alternating pattern: starting track, then all others in order, then repeat
    // Example: if started with track 1 (index 1): 1 → 0 → 2 → 3 → 1 → 0 → 2 → 3...
    // Example: if started with track 2 (index 2): 2 → 0 → 1 → 3 → 2 → 0 → 1 → 3...
    
    let nextIndex;
    if (currentTrackIndex === startingTrackIndex) {
      // Just finished the starting track, go to index 0 (unless that WAS the starting track)
      if (startingTrackIndex === 0) {
        nextIndex = 1; // If we started with 0, go to 1 next
      } else {
        nextIndex = 0; // Otherwise go to 0
      }
    } else {
      // Find next track in sequence, skipping the starting track unless we've gone through all others
      nextIndex = currentTrackIndex + 1;
      
      // If we reach the starting track again, skip it (we'll come back to it later)
      if (nextIndex === startingTrackIndex) {
        nextIndex++;
      }
      
      // If we've gone through all tracks, wrap back to the starting track
      if (nextIndex >= musicTracks.length) {
        nextIndex = startingTrackIndex;
      }
    }
    
    const nextTrack = musicTracks[nextIndex];
    console.log(`Alternating pattern: switching from track ${currentTrackIndex} to track ${nextIndex} (starting track: ${startingTrackIndex})`);
    
    // Stop current track
    if (musicTracks[currentTrackIndex]) {
      musicTracks[currentTrackIndex].pause();
      console.log(`Paused track ${currentTrackIndex}`);
    }
    
    // Play next track regardless of mute state (for automatic progression)
    nextTrack.currentTime = 0;
    nextTrack.play().catch(error => {
      console.log("Next track play prevented:", error);
    }).then(() => {
      console.log(`Successfully started track ${nextIndex}`);
    });
    
    set({ currentTrackIndex: nextIndex, backgroundMusic: nextTrack });
  },

  playPreviousTrack: () => {
    const { musicTracks, currentTrackIndex, isMuted } = get();
    if (musicTracks.length === 0) return;
    
    const prevIndex = currentTrackIndex === 0 ? musicTracks.length - 1 : currentTrackIndex - 1;
    const prevTrack = musicTracks[prevIndex];
    
    // Stop current track
    if (musicTracks[currentTrackIndex]) {
      musicTracks[currentTrackIndex].pause();
    }
    
    // Play previous track
    if (!isMuted) {
      prevTrack.currentTime = 0;
      prevTrack.play().catch(error => {
        console.log("Previous track play prevented:", error);
      });
    }
    
    set({ currentTrackIndex: prevIndex, backgroundMusic: prevTrack });
  },

  playTrack: (index) => {
    const { musicTracks, currentTrackIndex, isMuted } = get();
    if (musicTracks.length === 0 || index >= musicTracks.length) return;
    
    const track = musicTracks[index];
    
    // Stop current track
    if (musicTracks[currentTrackIndex]) {
      musicTracks[currentTrackIndex].pause();
    }
    
    // Play selected track
    if (!isMuted) {
      track.currentTime = 0;
      track.play().catch(error => {
        console.log("Track play prevented:", error);
      });
    }
    
    set({ currentTrackIndex: index, backgroundMusic: track });
  }
}));
