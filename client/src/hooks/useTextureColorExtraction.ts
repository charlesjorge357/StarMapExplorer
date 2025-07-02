
import { useEffect, useState } from 'react';

interface ColorData {
  dominant: string;
  accent: string;
  text: string;
}

// Cache for extracted colors to avoid re-processing
const colorCache = new Map<string, ColorData>();

export function useTextureColorExtraction(texturePath: string | null): ColorData | null {
  const [colorData, setColorData] = useState<ColorData | null>(null);

  useEffect(() => {
    if (!texturePath) {
      setColorData(null);
      return;
    }

    // Check cache first
    if (colorCache.has(texturePath)) {
      setColorData(colorCache.get(texturePath)!);
      return;
    }

    const extractColors = async () => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Scale down for faster processing
          const scale = 0.1;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Color frequency map
          const colorMap = new Map<string, number>();
          
          // Sample every 4th pixel for performance
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Reduce color precision for clustering
            const reducedR = Math.floor(r / 32) * 32;
            const reducedG = Math.floor(g / 32) * 32;
            const reducedB = Math.floor(b / 32) * 32;
            
            const colorKey = `${reducedR},${reducedG},${reducedB}`;
            colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
          }
          
          // Find most frequent colors
          const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
          
          if (sortedColors.length === 0) return;
          
          // Get dominant color
          const [dominantRGB] = sortedColors[0][0].split(',').map(Number);
          const dominant = `rgb(${sortedColors[0][0]})`;
          
          // Create accent color (slightly lighter/saturated)
          const [r, g, b] = sortedColors[0][0].split(',').map(Number);
          const accent = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;
          
          // Determine text color based on brightness
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          const text = brightness > 128 ? '#000000' : '#ffffff';
          
          const result: ColorData = { dominant, accent, text };
          
          // Cache the result
          colorCache.set(texturePath, result);
          setColorData(result);
        };
        
        img.onerror = () => {
          console.warn('Failed to load texture for color extraction:', texturePath);
          setColorData(null);
        };
        
        img.src = texturePath;
      } catch (error) {
        console.error('Error extracting colors:', error);
        setColorData(null);
      }
    };

    extractColors();
  }, [texturePath]);

  return colorData;
}

// Helper function to get planet texture path
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
