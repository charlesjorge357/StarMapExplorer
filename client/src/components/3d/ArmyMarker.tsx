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
  divisionIndex: number;
}

export function DivisionMarker({ division, planetRadius, armyPosition, divisionIndex }: DivisionMarkerProps) {
  const divisionRef = useRef<Mesh>(null);
  
  // Use army position as base, then add calculated offset for this division
  const [armyLat, armyLon] = armyPosition;
  
  // Create consistent circular formation around army using division index
  const totalDivisions = 8; // Maximum expected divisions for circular formation
  const angle = (divisionIndex / totalDivisions) * (Math.PI * 2); // Even spacing around army
  const distance = 0.15 + (divisionIndex % 2) * 0.08; // Two rings around army (much larger)
  
  // Calculate offset in lat/lon coordinates
  const offsetLat = armyLat + Math.cos(angle) * distance;
  const offsetLon = armyLon + Math.sin(angle) * distance;
  
  // Debug logging for division movement (occasional)
  if (Math.random() < 0.001) {
    console.log(`Division ${divisionIndex} following army:`, {
      armyPos: [armyLat, armyLon],
      divisionPos: [offsetLat, offsetLon],
      angle: angle * (180 / Math.PI),
      distance
    });
  }
  
  // Convert to spherical coordinates (exactly matching SurfaceFeatureMarker)
  const phi = (90 - offsetLat) * (Math.PI / 180);
  const theta = (offsetLon + 180) * (Math.PI / 180);
  const radius = planetRadius + 0.08; // Higher above planet surface for visibility
  
  const spherePos: [number, number, number] = [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  ];

  useFrame((state) => {
    if (divisionRef.current) {
      // Gentle floating animation, staggered by division index
      divisionRef.current.position.y = spherePos[1] + Math.sin(state.clock.elapsedTime * 2 + divisionIndex * 0.5) * 0.02;
      // Slight rotation for visual interest
      divisionRef.current.rotation.y = state.clock.elapsedTime * 0.3 + divisionIndex;
    }
  });

  // Size based on division size (larger for visibility)
  const scale = Math.max(0.04, Math.min(0.12, division.size / 300));

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
        color={division.faction?.name === 'Contested Zone' ? '#888888' : '#00ff88'} 
        emissive={division.faction?.name === 'Contested Zone' ? '#222222' : '#004422'} 
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
      
      const interpolatedPos = [
        currentLat + (targetLat - currentLat) * smoothProgress,
        currentLon + (targetLon - currentLon) * smoothProgress
      ];
      
      // Debug log movement progress
      if (Math.random() < 0.01) {
        console.log(`Army ${army.id} interpolation:`, {
          progress: progress.toFixed(2),
          smoothProgress: smoothProgress.toFixed(2),
          currentPos: [currentLat, currentLon],
          targetPos: [targetLat, targetLon],
          interpolatedPos
        });
      }
      
      return interpolatedPos;
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
      {army.composition && army.composition.map((division: any, index: number) => (
        <DivisionMarker
          key={division.id}
          division={division}
          planetRadius={planetRadius}
          armyPosition={currentPosition}
          divisionIndex={index}
        />
      ))}
    </group>
  );
}