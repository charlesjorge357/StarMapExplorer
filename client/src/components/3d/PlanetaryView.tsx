import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SurfaceFeature } from '../../../shared/schema';

interface SurfaceFeatureMesh {
  feature: SurfaceFeature;
  planetRadius: number;
  onClick: (feature: SurfaceFeature) => void;
}

function SurfaceFeatureMesh({ feature, planetRadius, onClick }: SurfaceFeatureMesh) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Convert lat/lon to 3D position on sphere
  const position = useMemo(() => {
    const [lat, lon] = feature.position;
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    
    const x = planetRadius * Math.cos(latRad) * Math.cos(lonRad);
    const y = planetRadius * Math.sin(latRad);
    const z = planetRadius * Math.cos(latRad) * Math.sin(lonRad);
    
    return [x, y, z] as [number, number, number];
  }, [feature.position, planetRadius]);

  // Get light color based on technology level
  const getLightColor = () => {
    switch (feature.technology) {
      case 'primitive': return '#FFA500'; // Orange firelight
      case 'industrial': return '#FFD700'; // Yellow industrial light
      case 'advanced': return '#00BFFF'; // Blue advanced light
      default: return '#FFFFFF'; // White default
    }
  };

  // Get light intensity based on size and population
  const getLightIntensity = () => {
    const baseIntensity = feature.type === 'city' ? 1.0 : 0.5;
    const sizeMultiplier = feature.size === 'large' ? 2.0 : feature.size === 'medium' ? 1.5 : 1.0;
    const popMultiplier = feature.population ? Math.log10(feature.population) / 6 : 1.0;
    
    return baseIntensity * sizeMultiplier * popMultiplier;
  };

  // Flickering animation for city lights
  useFrame((state) => {
    if (meshRef.current && feature.type === 'city') {
      const time = state.clock.getElapsedTime();
      const flicker = 0.8 + Math.sin(time * 10 + feature.position[0]) * 0.1 + Math.sin(time * 7 + feature.position[1]) * 0.1;
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0.3, flicker * getLightIntensity());
    }
  });

  const handleClick = (event: any) => {
    event.stopPropagation();
    onClick(feature);
  };

  return (
    <group position={position}>
      {/* Surface feature light */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial 
          color={getLightColor()}
          transparent
          opacity={getLightIntensity()}
          emissive={getLightColor()}
          emissiveIntensity={getLightIntensity() * 0.5}
        />
      </mesh>

      {/* Light cluster for larger cities */}
      {feature.type === 'city' && feature.size !== 'small' && (
        <>
          {Array.from({ length: feature.size === 'large' ? 8 : 4 }, (_, i) => {
            const angle = (i / (feature.size === 'large' ? 8 : 4)) * Math.PI * 2;
            const radius = feature.size === 'large' ? 1.0 : 0.5;
            const offsetX = Math.cos(angle) * radius;
            const offsetZ = Math.sin(angle) * radius;
            
            return (
              <mesh key={i} position={[offsetX, 0, offsetZ]}>
                <sphereGeometry args={[0.1, 6, 6]} />
                <meshBasicMaterial 
                  color={getLightColor()}
                  transparent
                  opacity={getLightIntensity() * 0.6}
                  emissive={getLightColor()}
                  emissiveIntensity={getLightIntensity() * 0.3}
                />
              </mesh>
            );
          })}
        </>
      )}

      {/* Point light for illumination */}
      <pointLight
        color={getLightColor()}
        intensity={getLightIntensity() * 2}
        distance={10}
        decay={2}
      />
    </group>
  );
}

export function PlanetaryView() {
  // This will be implemented when we add planetary surface exploration
  // For now, it's a placeholder for the city lighting system
  
  return (
    <group>
      {/* Planetary surface will be rendered here */}
      {/* Surface features with city lights will be rendered here */}
    </group>
  );
}

export default PlanetaryView;