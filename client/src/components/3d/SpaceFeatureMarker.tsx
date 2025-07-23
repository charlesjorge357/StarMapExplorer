import React, { useRef, useMemo } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { SpaceFeature } from '../../../../shared/schema';
import * as THREE from 'three';

interface SpaceFeatureMarkerProps {
  feature: SpaceFeature;
  planets: any[];
  asteroidBelts: any[];
  isSelected: boolean;
  onFeatureClick: (feature: SpaceFeature) => void;
}

export function SpaceFeatureMarker({ 
  feature, 
  planets, 
  asteroidBelts, 
  isSelected, 
  onFeatureClick 
}: SpaceFeatureMarkerProps) {
  const meshRef = useRef<Mesh>(null);

  // Calculate feature size and color based on type and size
  const { size, color, emissiveColor } = useMemo(() => {
    let baseSize = 0.5;
    let baseColor = '#888888';
    let emissive = '#000000';

    switch (feature.type) {
      case 'space_station':
        baseColor = '#00AAFF';
        emissive = '#0044AA';
        baseSize = feature.size === 'large' ? 1.2 : feature.size === 'medium' ? 0.8 : 0.5;
        break;
      case 'mining_station':
        baseColor = '#FFAA00';
        emissive = '#AA4400';
        baseSize = 0.6;
        break;
      case 'orbital_defenses':
        baseColor = '#FF4444';
        emissive = '#AA0000';
        baseSize = 0.4;
        break;
      case 'ship_graveyard':
        baseColor = '#666666';
        emissive = '#222222';
        baseSize = feature.size === 'large' ? 1.5 : 1.0;
        break;
      case 'research_station':
        baseColor = '#44FF44';
        emissive = '#00AA00';
        baseSize = 0.7;
        break;
    }

    return {
      size: baseSize,
      color: baseColor,
      emissiveColor: isSelected ? '#FFFF00' : emissive
    };
  }, [feature.type, feature.size, isSelected]);

  // Animation and orbital mechanics
  useFrame(() => {
    if (!meshRef.current) return;

    const time = Date.now() * 0.0001;

    if (feature.orbitTarget === 'planet' && feature.orbitTargetId) {
      // Orbit around specific planet
      const targetPlanet = planets.find(p => p.id === feature.orbitTargetId);
      if (targetPlanet) {
        const planetTime = Date.now() * 0.0001;
        const planetIndex = planets.findIndex(p => p.id === targetPlanet.id);
        const planetAngle = planetTime * targetPlanet.orbitSpeed + planetIndex * (Math.PI * 2 / 8);
        
        // Calculate planet's current position
        const planetPos = new THREE.Vector3(
          Math.cos(planetAngle) * targetPlanet.orbitRadius * 2,
          0,
          Math.sin(planetAngle) * targetPlanet.orbitRadius * 2
        );

        // Calculate feature's orbit around the planet
        const featureAngle = time * (feature.orbitSpeed || 0.1) + (feature.orbitOffset || 0);
        const orbitX = Math.cos(featureAngle) * (feature.orbitRadius || 10);
        const orbitZ = Math.sin(featureAngle) * (feature.orbitRadius || 10);

        // Position relative to planet
        meshRef.current.position.set(
          planetPos.x + orbitX,
          planetPos.y,
          planetPos.z + orbitZ
        );
      }
    } else if (feature.orbitTarget === 'asteroid_belt' && feature.orbitTargetId) {
      // Follow asteroid belt orbit
      const targetBelt = asteroidBelts.find(b => b.id === feature.orbitTargetId);
      if (targetBelt) {
        const angle = time * (feature.orbitSpeed || 0.02) + (feature.orbitOffset || 0);
        const radius = feature.orbitRadius || ((targetBelt.innerRadius + targetBelt.outerRadius) / 2);
        
        meshRef.current.position.set(
          Math.cos(angle) * radius * 2,
          0,
          Math.sin(angle) * radius * 2
        );
      }
    } else if (feature.orbitTarget === 'independent' || feature.orbitTarget === 'star') {
      // Independent orbit around system center (star)
      const angle = time * (feature.orbitSpeed || 0.01) + (feature.orbitOffset || 0);
      const radius = feature.orbitRadius || 50;
      
      meshRef.current.position.set(
        Math.cos(angle) * radius * 2,
        0,
        Math.sin(angle) * radius * 2
      );
    }

    // Add slight rotation animation
    meshRef.current.rotation.y += 0.01;
  });

  // Handle click
  const handleClick = (event: any) => {
    event.stopPropagation();
    onFeatureClick(feature);
  };

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      scale={[size, size, size]}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissiveColor}
        emissiveIntensity={0.3}
        metalness={0.7}
        roughness={0.3}
      />
      
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[2, 2, 1]}>
          <ringGeometry args={[0.8, 1.2, 16]} />
          <meshBasicMaterial color="#FFFF00" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </mesh>
  );
}