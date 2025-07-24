import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
// Using any types for now to fix the schema import issue
// import { Armies, Divisions } from '../../../shared/schema';

interface ArmyMarkerProps {
  army: any; // Armies type from schema
  planetRadius: number;
  isSelected?: boolean;
  movementData?: { targetPosition: [number, number]; progress: number };
  onArmyClick?: (army: any) => void;
}

interface DivisionMarkerProps {
  division: any; // Divisions type from schema
  planetRadius: number;
  armyPosition: [number, number];
}

export function DivisionMarker({ division, planetRadius, armyPosition }: DivisionMarkerProps) {
  const divisionRef = useRef<Mesh>(null);
  
  // Convert 2D position to 3D sphere position using spherical coordinates
  const [lat, lon] = division.position;
  
  // Small offset from army position for division placement
  const offsetLat = lat + (Math.random() - 0.5) * 0.2; // Small random offset
  const offsetLon = lon + (Math.random() - 0.5) * 0.2;
  
  // Convert to spherical coordinates (exactly matching SurfaceFeatureMarker)
  const phi = (90 - offsetLat) * (Math.PI / 180);
  const theta = (offsetLon + 180) * (Math.PI / 180);
  const radius = planetRadius + 0.05; // Slightly above planet surface
  
  const spherePos: [number, number, number] = [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  ];

  useFrame((state) => {
    if (divisionRef.current) {
      // Gentle floating animation
      divisionRef.current.position.y = spherePos[1] + Math.sin(state.clock.elapsedTime * 2 + division.size * 0.1) * 0.02;
    }
  });

  // Size based on division size (smaller units)
  const scale = Math.max(0.02, Math.min(0.08, division.size / 500));

  return (
    <mesh
      ref={divisionRef}
      position={spherePos}
      scale={[scale, scale, scale]}
      onClick={(e) => {
        e.stopPropagation();
        console.log(`Division ${division.id}: ${division.size} units`);
      }}
    >
      <boxGeometry args={[1, 0.5, 1]} />
      <meshLambertMaterial 
        color={division.faction?.name === 'Contested Zone' ? '#888888' : '#4444ff'} 
        emissive={division.faction?.name === 'Contested Zone' ? '#222222' : '#111144'} 
      />
    </mesh>
  );
}

export function ArmyMarker({ army, planetRadius, isSelected, movementData, onArmyClick }: ArmyMarkerProps) {
  const armyRef = useRef<Mesh>(null);
  
  // Handle movement animation with better interpolation
  const currentPosition = useMemo(() => {
    if (movementData && movementData.progress < 1) {
      // Spherical interpolation for more natural movement on sphere surface
      const [currentLat, currentLon] = army.position;
      const [targetLat, targetLon] = movementData.targetPosition;
      const progress = movementData.progress;
      
      // Use smooth interpolation
      const smoothProgress = progress * progress * (3.0 - 2.0 * progress); // Smooth step
      
      return [
        currentLat + (targetLat - currentLat) * smoothProgress,
        currentLon + (targetLon - currentLon) * smoothProgress
      ];
    }
    return army.position;
  }, [army.position, movementData]);

  // Convert 2D position to 3D sphere position using spherical coordinates
  const [lat, lon] = currentPosition;
  
  // Convert to spherical coordinates (exactly matching SurfaceFeatureMarker)
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const radius = planetRadius + 0.1; // Slightly above planet surface
  
  const spherePos: [number, number, number] = [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  ];

  useFrame((state) => {
    if (armyRef.current) {
      // Gentle rotation
      armyRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      armyRef.current.position.y = spherePos[1] + Math.sin(state.clock.elapsedTime + army.size * 0.01) * 0.05;
    }
  });

  // Size based on army size
  const scale = Math.max(0.05, Math.min(0.15, army.size / 1000));

  return (
    <group>
      {/* Army command unit - larger marker */}
      <mesh
        ref={armyRef}
        position={spherePos}
        scale={[scale, scale, scale]}
        onClick={(e) => {
          e.stopPropagation();
          onArmyClick?.(army);
          console.log(`Army ${army.id}: ${army.size} total units, ${army.composition?.length || 0} divisions`);
        }}
      >
        <cylinderGeometry args={[1, 1, 0.8, 8]} />
        <meshLambertMaterial 
          color={isSelected ? '#ff6600' : (army.faction?.name === 'Contested Zone' ? '#666666' : '#2222cc')} 
          emissive={isSelected ? '#ff3300' : (army.faction?.name === 'Contested Zone' ? '#333333' : '#000066')} 
        />
      </mesh>

      {/* Render division markers around the army */}
      {army.composition && army.composition.map((division: any) => (
        <DivisionMarker
          key={division.id}
          division={division}
          planetRadius={planetRadius}
          armyPosition={army.position}
        />
      ))}
    </group>
  );
}