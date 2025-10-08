import { create } from 'zustand';

export type QualityPreset = 'low' | 'medium' | 'high';

interface PerformanceSettings {
  quality: QualityPreset;
  bloomEnabled: boolean;
  bloomIntensity: number;
  starGeometrySegments: number;
  planetGeometrySegments: number;
  nebulaParticles: number;
  showFPS: boolean;
  setQuality: (quality: QualityPreset) => void;
  toggleBloom: () => void;
  toggleFPS: () => void;
}

const qualityPresets = {
  low: {
    bloomEnabled: false,
    bloomIntensity: 0.3,
    starGeometrySegments: 4,
    planetGeometrySegments: 16,
    nebulaParticles: 60,
  },
  medium: {
    bloomEnabled: true,
    bloomIntensity: 0.5,
    starGeometrySegments: 6,
    planetGeometrySegments: 24,
    nebulaParticles: 100,
  },
  high: {
    bloomEnabled: true,
    bloomIntensity: 0.8,
    starGeometrySegments: 8,
    planetGeometrySegments: 32,
    nebulaParticles: 130,
  },
};

export const usePerformance = create<PerformanceSettings>((set) => ({
  quality: 'medium',
  bloomEnabled: true,
  bloomIntensity: 0.5,
  starGeometrySegments: 6,
  planetGeometrySegments: 24,
  nebulaParticles: 100,
  showFPS: false,

  setQuality: (quality: QualityPreset) => {
    const preset = qualityPresets[quality];
    set({ quality, ...preset });
    console.log(`Performance quality set to: ${quality}`, preset);
  },

  toggleBloom: () => set((state) => ({ 
    bloomEnabled: !state.bloomEnabled 
  })),

  toggleFPS: () => set((state) => ({ 
    showFPS: !state.showFPS 
  })),
}));
