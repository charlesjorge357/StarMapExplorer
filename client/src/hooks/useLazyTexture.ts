import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';

// Cache for loaded textures to prevent re-loading
const textureCache = new Map<string, any>();

export function useLazyTexture(texturePath: string | null) {
  return useMemo(() => {
    if (!texturePath) return null;
    
    // Check cache first
    if (textureCache.has(texturePath)) {
      return textureCache.get(texturePath);
    }
    
    try {
      const texture = useTexture(texturePath);
      textureCache.set(texturePath, texture);
      return texture;
    } catch (error) {
      console.warn(`Failed to load texture: ${texturePath}`, error);
      return null;
    }
  }, [texturePath]);
}

// Helper to get texture path without loading
export function getPlanetTexturePath(planetType: string, textureIndex: number = 0): string | null {
  const texturePaths: Record<string, string[]> = {
    gas_giant: [
      '/textures/Gaseous/Gaseous_01-1024x512.png', '/textures/Gaseous/Gaseous_02-1024x512.png',
      '/textures/Gaseous/Gaseous_03-1024x512.png', '/textures/Gaseous/Gaseous_04-1024x512.png',
      '/textures/Gaseous/Gaseous_05-1024x512.png', '/textures/Gaseous/Gaseous_06-1024x512.png',
      '/textures/Gaseous/Gaseous_07-1024x512.png', '/textures/Gaseous/Gaseous_08-1024x512.png',
      '/textures/Gaseous/Gaseous_09-1024x512.png', '/textures/Gaseous/Gaseous_10-1024x512.png',
      '/textures/Gaseous/Gaseous_11-1024x512.png', '/textures/Gaseous/Gaseous_12-1024x512.png',
      '/textures/Gaseous/Gaseous_13-1024x512.png', '/textures/Gaseous/Gaseous_14-1024x512.png',
      '/textures/Gaseous/Gaseous_15-1024x512.png', '/textures/Gaseous/Gaseous_16-1024x512.png',
      '/textures/Gaseous/Gaseous_17-1024x512.png', '/textures/Gaseous/Gaseous_18-1024x512.png',
      '/textures/Gaseous/Gaseous_19-1024x512.png', '/textures/Gaseous/Gaseous_20-1024x512.png'
    ],
    frost_giant: [
      '/textures/Gaseous/Gaseous_01-1024x512.png', '/textures/Gaseous/Gaseous_02-1024x512.png',
      '/textures/Gaseous/Gaseous_03-1024x512.png', '/textures/Gaseous/Gaseous_04-1024x512.png',
      '/textures/Gaseous/Gaseous_05-1024x512.png', '/textures/Gaseous/Gaseous_06-1024x512.png',
      '/textures/Gaseous/Gaseous_07-1024x512.png', '/textures/Gaseous/Gaseous_08-1024x512.png',
      '/textures/Gaseous/Gaseous_09-1024x512.png', '/textures/Gaseous/Gaseous_10-1024x512.png',
      '/textures/Gaseous/Gaseous_11-1024x512.png', '/textures/Gaseous/Gaseous_12-1024x512.png',
      '/textures/Gaseous/Gaseous_13-1024x512.png', '/textures/Gaseous/Gaseous_14-1024x512.png',
      '/textures/Gaseous/Gaseous_15-1024x512.png', '/textures/Gaseous/Gaseous_16-1024x512.png',
      '/textures/Gaseous/Gaseous_17-1024x512.png', '/textures/Gaseous/Gaseous_18-1024x512.png',
      '/textures/Gaseous/Gaseous_19-1024x512.png', '/textures/Gaseous/Gaseous_20-1024x512.png'
    ],
    arid_world: [
      '/textures/Arid/Arid_01-1024x512.png', '/textures/Arid/Arid_02-1024x512.png',
      '/textures/Arid/Arid_03-1024x512.png', '/textures/Arid/Arid_04-1024x512.png',
      '/textures/Arid/Arid_05-1024x512.png'
    ],
    barren_world: [
      '/textures/Barren/Barren_01-1024x512.png', '/textures/Barren/Barren_02-1024x512.png',
      '/textures/Barren/Barren_03-1024x512.png', '/textures/Barren/Barren_04-1024x512.png',
      '/textures/Barren/Barren_05-1024x512.png'
    ],
    dusty_world: [
      '/textures/Dusty/Dusty_01-1024x512.png', '/textures/Dusty/Dusty_02-1024x512.png',
      '/textures/Dusty/Dusty_03-1024x512.png', '/textures/Dusty/Dusty_04-1024x512.png',
      '/textures/Dusty/Dusty_05-1024x512.png'
    ],
    grassland_world: [
      '/textures/Grassland/Grassland_01-1024x512.png', '/textures/Grassland/Grassland_02-1024x512.png',
      '/textures/Grassland/Grassland_03-1024x512.png', '/textures/Grassland/Grassland_04-1024x512.png',
      '/textures/Grassland/Grassland_05-1024x512.png'
    ],
    jungle_world: [
      '/textures/Jungle/Jungle_01-1024x512.png', '/textures/Jungle/Jungle_02-1024x512.png',
      '/textures/Jungle/Jungle_03-1024x512.png', '/textures/Jungle/Jungle_04-1024x512.png',
      '/textures/Jungle/Jungle_05-1024x512.png'
    ],
    marshy_world: [
      '/textures/Marshy/Marshy_01-1024x512.png', '/textures/Marshy/Marshy_02-1024x512.png',
      '/textures/Marshy/Marshy_03-1024x512.png', '/textures/Marshy/Marshy_04-1024x512.png',
      '/textures/Marshy/Marshy_05-1024-512.png'
    ],
    martian_world: [
      '/textures/Martian/Martian_01-1024x512.png', '/textures/Martian/Martian_02-1024x512.png',
      '/textures/Martian/Martian_03-1024x512.png', '/textures/Martian/Martian_04-1024x512.png',
      '/textures/Martian/Martian_05-1024x512.png'
    ],
    methane_world: [
      '/textures/Methane/Methane_01-1024x512.png', '/textures/Methane/Methane_02-1024x512.png',
      '/textures/Methane/Methane_03-1024x512.png', '/textures/Methane/Methane_04-1024x512.png',
      '/textures/Methane/Methane_05-1024x512.png'
    ],
    sandy_world: [
      '/textures/Sandy/Sandy_01-1024x512.png', '/textures/Sandy/Sandy_02-1024x512.png',
      '/textures/Sandy/Sandy_03-1024x512.png', '/textures/Sandy/Sandy_04-1024x512.png',
      '/textures/Sandy/Sandy_05-1024x512.png'
    ],
    snowy_world: [
      '/textures/Snowy/Snowy_01-1024x512.png', '/textures/Snowy/Snowy_02-1024x512.png',
      '/textures/Snowy/Snowy_03-1024x512.png', '/textures/Snowy/Snowy_04-1024x512.png',
      '/textures/Snowy/Snowy_05-1024x512.png'
    ],
    tundra_world: [
      '/textures/Tundra/Tundra_01-1024x512.png', '/textures/Tundra/Tundra_02-1024x512.png',
      '/textures/Tundra/Tundra_03-1024x512.png', '/textures/Tundra/Tundra_04-1024x512.png',
      '/textures/Tundra/Tundra_05-1024x512.png'
    ],
    nuclear_world: ['/textures/ceres.jpg'],
    ocean_world: ['/textures/ocean.jpg']
  };

  const paths = texturePaths[planetType];
  if (!paths || paths.length === 0) return null;
  
  return paths[textureIndex % paths.length];
}