import React, { Suspense, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { getPlanetTexturePath } from '../../hooks/useLazyTexture';
import * as THREE from 'three';

interface LazyTexturePlanetProps {
  planet: any;
  planetColor: string;
  planetGlow?: string;
  planetRadius: number;
  onClick: () => void;
}

// Component that loads texture in Suspense boundary
function PlanetWithTexture({ planet, planetColor, planetGlow, planetRadius, onClick }: LazyTexturePlanetProps) {
  const texturePath = getPlanetTexturePath(planet.type, planet.textureIndex || 0);
  const texture = texturePath ? useTexture(texturePath) : null;

  useMemo(() => {
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }
  }, [texture]);

  return (
    <>
      <mesh onClick={onClick}>
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
    </>
  );
}

// Fallback component while texture loads
function PlanetFallback({ planetColor, planetRadius, onClick }: { 
  planetColor: string; 
  planetRadius: number; 
  onClick: () => void; 
}) {
  return (
    <mesh onClick={onClick}>
      <sphereGeometry args={[planetRadius, 16, 16]} />
      <meshStandardMaterial color={planetColor} />
    </mesh>
  );
}

// Main component with Suspense boundary
export function LazyTexturePlanet({ planet, planetColor, planetGlow, planetRadius, onClick }: LazyTexturePlanetProps) {
  return (
    <Suspense fallback={<PlanetFallback planetColor={planetColor} planetRadius={planetRadius} onClick={onClick} />}>
      <PlanetWithTexture 
        planet={planet}
        planetColor={planetColor}
        planetGlow={planetGlow}
        planetRadius={planetRadius}
        onClick={onClick}
      />
    </Suspense>
  );
}