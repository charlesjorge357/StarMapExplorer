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
  const meshRef = useRef<THREE.Group>(null);

  // Calculate feature size and color based on type and size (all half size)
  const { size, color, emissiveColor } = useMemo(() => {
    let baseSize = 0.25; // Half the original base size
    let baseColor = '#888888';
    let emissive = '#000000';

    switch (feature.type) {
      case 'space_station':
        baseColor = '#00AAFF';
        emissive = '#0044AA';
        baseSize = feature.size === 'large' ? 0.6 : feature.size === 'medium' ? 0.4 : 0.25; // Half sizes
        break;
      case 'mining_station':
        baseColor = '#FFAA00';
        emissive = '#AA4400';
        baseSize = 0.3; // Half size
        break;
      case 'orbital_defenses':
        baseColor = '#FF4444';
        emissive = '#AA0000';
        baseSize = 0.2; // Half size
        break;
      case 'ship_graveyard':
        baseColor = '#666666';
        emissive = '#222222';
        baseSize = feature.size === 'large' ? 0.75 : 0.5; // Half sizes
        break;
      case 'research_station':
        baseColor = '#44FF44';
        emissive = '#00AA00';
        baseSize = 0.35; // Half size
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
    console.log('SpaceFeatureMarker clicked:', feature);
    try {
      event.stopPropagation();
      onFeatureClick(feature);
    } catch (error) {
      console.error('Error in SpaceFeatureMarker click handler:', error);
    }
  };

  // Create different geometries based on feature type
  const renderGeometry = () => {
    switch (feature.type) {
      case 'space_station':
        return (
          <>
            {/* Central hub */}
            <mesh>
              <cylinderGeometry args={[size * 0.6, size * 0.8, size * 1.2, 8]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.3}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {/* Rotating rings */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[size * 1.2, size * 0.15, 6, 12]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.2}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
              <torusGeometry args={[size * 0.9, size * 0.1, 6, 12]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.2}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
          </>
        );

      case 'mining_station':
        return (
          <>
            {/* Main processing unit */}
            <mesh>
              <boxGeometry args={[size * 1.2, size * 0.8, size * 1.2]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.4}
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
            {/* Mining arms */}
            <mesh position={[size * 0.8, 0, 0]}>
              <cylinderGeometry args={[size * 0.1, size * 0.1, size * 1.5, 6]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.3}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[-size * 0.8, 0, 0]}>
              <cylinderGeometry args={[size * 0.1, size * 0.1, size * 1.5, 6]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.3}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
          </>
        );

      case 'orbital_defenses':
        return (
          <>
            {/* Main platform */}
            <mesh>
              <octahedronGeometry args={[size * 0.8]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.5}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            {/* Main weapon turrets */}
            <mesh position={[0, size * 0.6, 0]}>
              <coneGeometry args={[size * 0.3, size * 0.8, 6]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.4}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[0, -size * 0.6, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[size * 0.3, size * 0.8, 6]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.4}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {/* Small defense cannons around the platform */}
            <mesh position={[size * 0.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[size * 0.1, size * 0.05, size * 0.6, 6]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.3}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            <mesh position={[-size * 0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[size * 0.1, size * 0.05, size * 0.6, 6]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.3}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            <mesh position={[0, 0, size * 0.8]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[size * 0.1, size * 0.05, size * 0.6, 6]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.3}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            <mesh position={[0, 0, -size * 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[size * 0.1, size * 0.05, size * 0.6, 6]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.3}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          </>
        );

      case 'ship_graveyard':
        return (
          <>
            {/* Scattered debris pieces */}
            <mesh>
              <dodecahedronGeometry args={[size * 0.6]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.1}
                metalness={0.3}
                roughness={0.8}
              />
            </mesh>
            <mesh position={[size * 0.5, size * 0.3, 0]} rotation={[1, 0.5, 0]}>
              <boxGeometry args={[size * 0.4, size * 0.2, size * 0.8]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.1}
                metalness={0.2}
                roughness={0.9}
              />
            </mesh>
            <mesh position={[-size * 0.4, -size * 0.2, size * 0.3]} rotation={[0.5, 1, 0.3]}>
              <cylinderGeometry args={[size * 0.2, size * 0.3, size * 0.7, 6]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.1}
                metalness={0.2}
                roughness={0.9}
              />
            </mesh>
          </>
        );

      case 'research_station':
        return (
          <>
            {/* Main sphere */}
            <mesh>
              <icosahedronGeometry args={[size * 0.8, 1]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.4}
                metalness={0.5}
                roughness={0.3}
              />
            </mesh>
            {/* Research arrays */}
            <mesh position={[size * 1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[size * 0.05, size * 0.05, size * 2, 8]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.3}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[-size * 1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[size * 0.05, size * 0.05, size * 2, 8]} />
              <meshStandardMaterial 
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={0.3}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          </>
        );

      default:
        return (
          <mesh>
            <sphereGeometry args={[size, 8, 8]} />
            <meshStandardMaterial 
              color={color}
              emissive={emissiveColor}
              emissiveIntensity={0.3}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        );
    }
  };

  return (
    <group
      ref={meshRef}
      onClick={handleClick}
    >
      {renderGeometry()}
      
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[2, 2, 1]}>
          <ringGeometry args={[0.8, 1.2, 16]} />
          <meshBasicMaterial color="#FFFF00" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}