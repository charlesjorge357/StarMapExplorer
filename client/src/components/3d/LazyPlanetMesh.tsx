import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useTexture } from '@react-three/drei';
import { getPlanetTexturePath } from '../../hooks/useLazyTexture';
// Helper functions copied from SystemView to avoid circular imports
function getPlanetColor(type: string, planetId?: string): string {
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const seed = (planetId || 'default').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variation = (seededRandom(seed + 2000) - 0.5) * 0.3;

  const baseColors: Record<string, [number, number, number]> = {
    gas_giant: [30, 80, 50],
    frost_giant: [220, 60, 60],
    arid_world: [30, 50, 45],
    barren_world: [25, 30, 35],
    dusty_world: [40, 60, 50],
    grassland_world: [110, 60, 50],
    jungle_world: [130, 70, 40],
    marshy_world: [90, 55, 45],
    martian_world: [15, 75, 45],
    methane_world: [290, 65, 35],
    sandy_world: [45, 70, 60],
    snowy_world: [200, 20, 85],
    tundra_world: [180, 40, 70],
    nuclear_world: [10, 90, 50],
    ocean_world: [210, 80, 55]
  };

  let [h, s, l] = baseColors[type] || [0, 0, 50];
  h = (h + variation * 360 + 360) % 360;
  return `hsl(${Math.round(h)}, ${s}%, ${l}%)`;
}
import * as THREE from 'three';

interface LazyPlanetMeshProps {
  planet: any;
  isSelected: boolean;
  index: number;
  onClick: (planet: any) => void;
}

// Texture loading component that only loads when rendered
function PlanetTexture({ planet }: { planet: any }) {
  const texturePath = getPlanetTexturePath(planet.type, planet.textureIndex || 0);
  const texture = texturePath ? useTexture(texturePath) : null;
  
  useEffect(() => {
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }
  }, [texture]);

  return texture;
}

// Planet mesh component that loads textures lazily
function PlanetMeshContent({ planet, isSelected, index, onClick }: LazyPlanetMeshProps) {
  const texture = PlanetTexture({ planet });
  
  const planetColor = useMemo(() => 
    getPlanetColor(planet.type, planet.id || planet.name), 
    [planet.type, planet.id, planet.name]
  );

  const planetGlow = useMemo(() => {
    switch (planet.type) {
      case 'gas_giant':
      case 'frost_giant':
        return planetColor;
      case 'nuclear_world':
        return '#ff0000';
      default:
        return null;
    }
  }, [planet.type, planetColor]);

  const planetRadius = planet.radius * 0.6; // Visual scaling
  const orbitRadius = planet.orbitRadius * 30; // Orbital scaling
  
  // Calculate position based on time for orbital motion
  const position = useMemo(() => {
    const time = Date.now() * 0.001;
    const angle = time * planet.orbitSpeed * 0.1;
    return [
      Math.cos(angle) * orbitRadius,
      0,
      Math.sin(angle) * orbitRadius
    ] as [number, number, number];
  }, [orbitRadius, planet.orbitSpeed]);

  return (
    <group position={position}>
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planetRadius * 1.2, planetRadius * 1.4, 32]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}
      
      {/* Planet mesh */}
      <mesh onClick={() => onClick(planet)}>
        <sphereGeometry args={[planetRadius, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          color={planetColor}
          metalness={0.1}
          roughness={0.8}
          emissive={planet.type === 'nuclear_world' ? '#330000' : '#000000'}
          emissiveIntensity={planet.type === 'nuclear_world' ? 0.3 : 0}
        />
      </mesh>

      {/* Planet glow effect */}
      {planetGlow && (
        <mesh>
          <sphereGeometry args={[planetRadius * 1.1, 16, 16]} />
          <meshBasicMaterial
            color={planetGlow}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}

// Main lazy planet mesh component with suspense boundary
export function LazyPlanetMesh({ planet, isSelected, index, onClick }: LazyPlanetMeshProps) {
  return (
    <Suspense fallback={
      <mesh position={[planet.orbitRadius * 30, 0, 0]}>
        <sphereGeometry args={[planet.radius * 0.6, 8, 8]} />
        <meshBasicMaterial color="#444444" />
      </mesh>
    }>
      <PlanetMeshContent 
        planet={planet} 
        isSelected={isSelected} 
        index={index} 
        onClick={onClick} 
      />
    </Suspense>
  );
}