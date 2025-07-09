import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  musicTracks: HTMLAudioElement[];
  currentTrackIndex: number;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setMusicTracks: (tracks: HTMLAudioElement[]) => void;
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
  hitSound: null,
  successSound: null,
  isMuted: true, // Start muted by default
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setMusicTracks: (tracks) => set({ musicTracks: tracks }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    
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
    const { musicTracks, currentTrackIndex, isMuted } = get();
    if (musicTracks.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % musicTracks.length;
    const nextTrack = musicTracks[nextIndex];
    
    // Stop current track
    if (musicTracks[currentTrackIndex]) {
      musicTracks[currentTrackIndex].pause();
    }
    
    // Play next track
    if (!isMuted) {
      nextTrack.currentTime = 0;
      nextTrack.play().catch(error => {
        console.log("Next track play prevented:", error);
      });
    }
    
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
