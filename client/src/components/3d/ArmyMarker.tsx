import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Armies, Divisions } from '../../../shared/schema';

interface ArmyMarkerProps {
  army: Armies;
  planetRadius: number;
  onArmyClick?: (army: Armies) => void;
}

interface DivisionMarkerProps {
  division: Divisions;
  planetRadius: number;
  armyPosition: [number, number];
}

export function DivisionMarker({ division, planetRadius, armyPosition }: DivisionMarkerProps) {
  const divisionRef = useRef<Mesh>(null);
  
  // Convert 2D position to 3D sphere position
  const [x, z] = division.position;
  const radius = planetRadius + 0.05; // Slightly above planet surface
  
  // Normalize coordinates for sphere projection
  const normalizedX = (x - armyPosition[0]) * 0.5; // Relative to army position
  const normalizedZ = (z - armyPosition[1]) * 0.5;
  
  const spherePos: [number, number, number] = [
    normalizedX * radius,
    0.1, // Slight height above surface
    normalizedZ * radius
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

export function ArmyMarker({ army, planetRadius, onArmyClick }: ArmyMarkerProps) {
  const armyRef = useRef<Mesh>(null);
  
  // Convert 2D position to 3D sphere position
  const [x, z] = army.position;
  const radius = planetRadius + 0.1; // Slightly above planet surface
  
  // Simple cylindrical projection for now
  const spherePos: [number, number, number] = [
    x * radius * 0.5,
    0.2, // Higher than divisions
    z * radius * 0.5
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
          color={army.faction?.name === 'Contested Zone' ? '#666666' : '#2222cc'} 
          emissive={army.faction?.name === 'Contested Zone' ? '#333333' : '#000066'} 
        />
      </mesh>

      {/* Render division markers around the army */}
      {army.composition && army.composition.map((division) => (
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