import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import * as THREE from 'three';

interface FleetMarkerProps {
  fleet: any; // Fleets type from schema
  isSelected?: boolean;
  movementData?: { targetPosition: [number, number, number]; progress: number };
  onFleetClick?: (fleet: any) => void;
  starMass: number;
}

interface ShipMarkerProps {
  ship: any; // Ships type from schema
  fleetPosition: [number, number, number];
  shipIndex: number;
}

export function ShipMarker({ ship, fleetPosition, shipIndex }: ShipMarkerProps) {
  const shipRef = useRef<Mesh>(null);
  
  // Calculate ship position relative to fleet center
  const formationAngle = (shipIndex / 8) * Math.PI * 2;
  const formationRadius = 0.5 + (shipIndex % 2) * 0.3;
  
  const shipPosition: [number, number, number] = [
    fleetPosition[0] + formationRadius * Math.cos(formationAngle),
    0,
    fleetPosition[2] + formationRadius * Math.sin(formationAngle)
  ];

  useFrame((state) => {
    if (shipRef.current) {
      // Gentle rotation and floating
      shipRef.current.rotation.y = state.clock.elapsedTime * 0.2 + shipIndex;
      shipRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + shipIndex * 0.5) * 0.02;
    }
  });

  // Ship size based on type
  const getShipScale = (shipType: string) => {
    switch (shipType) {
      case 'fighter_wing':
      case 'bomber_wing':
        return 0.08;
      case 'cruiser':
      case 'destroyer':
        return 0.12;
      case 'carrier':
      case 'dreadnought':
        return 0.18;
      case 'battleship':
      case 'super_carrier':
        return 0.25;
      default:
        return 0.12;
    }
  };

  const shipColor = ship.faction?.name === 'Contested Zone' ? '#888888' : '#00ffff';
  const shipEmissive = ship.faction?.name === 'Contested Zone' ? '#222222' : '#004444';
  const scale = getShipScale(ship.type);

  return (
    <mesh
      ref={shipRef}
      position={shipPosition}
      scale={[scale, scale, scale]}
      onClick={(e) => {
        e.stopPropagation();
        console.log(`Ship ${ship.name}: ${ship.type}`);
      }}
    >
      <boxGeometry args={[1.5, 0.4, 0.8]} />
      <meshLambertMaterial 
        color={shipColor}
        emissive={shipEmissive}
      />
    </mesh>
  );
}

export function FleetMarker({ fleet, isSelected, movementData, onFleetClick, starMass }: FleetMarkerProps) {
  const fleetRef = useRef<Mesh>(null);
  
  // Handle movement animation with orbital mechanics
  const currentPosition = useMemo(() => {
    if (movementData && movementData.progress < 1) {
      const [currentX, currentY, currentZ] = fleet.position;
      const [targetX, targetY, targetZ] = movementData.targetPosition;
      const progress = movementData.progress;
      
      // Use smooth interpolation
      const smoothProgress = progress * progress * (3.0 - 2.0 * progress);
      
      const interpolatedPos: [number, number, number] = [
        currentX + (targetX - currentX) * smoothProgress,
        0, // Keep on XZ plane
        currentZ + (targetZ - currentZ) * smoothProgress
      ];
      
      // Debug log movement progress
      if (Math.random() < 0.01) {
        console.log(`Fleet ${fleet.id} interpolation:`, {
          progress: progress.toFixed(2),
          smoothProgress: smoothProgress.toFixed(2),
          currentPos: [currentX, currentY, currentZ],
          targetPos: [targetX, targetY, targetZ],
          interpolatedPos
        });
      }
      
      return interpolatedPos;
    }
    return fleet.position;
  }, [fleet.position, movementData]);

  const [x, y, z] = currentPosition;
  
  // Calculate orbital motion - fleet orbits the star at its current radius
  const orbitRadius = Math.sqrt(x * x + z * z);
  const orbitalSpeed = useMemo(() => {
    // Same orbital mechanics as planets
    const G = 6.67430e-11;
    const M = starMass * 1.989e30;
    const r = orbitRadius * 1.496e11;
    const v = Math.sqrt(G * M / r);
    return (v / r) * 1000; // Scale for game time
  }, [orbitRadius, starMass]);

  useFrame((state, delta) => {
    if (fleetRef.current && !movementData) {
      // Orbital motion around star
      const currentAngle = Math.atan2(fleetRef.current.position.z, fleetRef.current.position.x);
      const newAngle = currentAngle + orbitalSpeed * delta;
      
      fleetRef.current.position.x = orbitRadius * Math.cos(newAngle);
      fleetRef.current.position.z = orbitRadius * Math.sin(newAngle);
      
      // Update fleet position data for ships
      fleet.position = [fleetRef.current.position.x, 0, fleetRef.current.position.z];
    }
  });

  // Fleet command ship - larger marker
  const scale = Math.max(0.15, Math.min(0.3, fleet.size / 10));

  return (
    <group>
      {/* Fleet command ship */}
      <mesh
        ref={fleetRef}
        position={currentPosition}
        scale={[scale, scale, scale]}
        onClick={(e) => {
          e.stopPropagation();
          onFleetClick?.(fleet);
          console.log(`Fleet ${fleet.id}: ${fleet.size} ships`);
        }}
      >
        <octahedronGeometry args={[1, 0]} />
        <meshLambertMaterial 
          color={isSelected ? '#ff6600' : (fleet.faction?.name === 'Contested Zone' ? '#666666' : '#2222ff')} 
          emissive={isSelected ? '#ff3300' : (fleet.faction?.name === 'Contested Zone' ? '#333333' : '#000066')} 
        />
      </mesh>

      {/* Render ship markers around the fleet */}
      {fleet.composition && fleet.composition.map((ship: any, index: number) => (
        <ShipMarker
          key={ship.id}
          ship={ship}
          fleetPosition={currentPosition}
          shipIndex={index}
        />
      ))}
    </group>
  );
}