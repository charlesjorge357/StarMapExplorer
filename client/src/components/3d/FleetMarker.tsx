import React, { useRef, useMemo, useState } from 'react';
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
  
  // Calculate ship orbit parameters
  const shipOrbitRadius = useMemo(() => 0.5 + (shipIndex % 3) * 0.3, [shipIndex]);
  const shipOrbitalSpeed = useMemo(() => {
    // Use same orbital formula as planets/fleets for consistency
    return Math.sqrt(1 / Math.max(shipOrbitRadius, 0.1)) * 0.15;
  }, [shipOrbitRadius]);

  useFrame((state) => {
    if (shipRef.current && fleetPosition) {
      // Calculate orbital position using same mechanics as planets
      const time = Date.now() * 0.0001; // Same time calculation as fleet
      const shipAngle = time * shipOrbitalSpeed + shipIndex * (Math.PI * 2 / 8); // Stagger ships
      
      // Ship position relative to fleet center
      const shipX = shipOrbitRadius * Math.cos(shipAngle);
      const shipZ = shipOrbitRadius * Math.sin(shipAngle);
      
      // Apply fleet position as offset
      shipRef.current.position.x = fleetPosition[0] + shipX;
      shipRef.current.position.z = fleetPosition[2] + shipZ;
      shipRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + shipIndex * 0.5) * 0.02; // Gentle floating
      
      // Fleet formation rotation - all ships face the direction of orbital movement
      // Calculate the tangent to the orbit (direction of movement)
      const fleetOrbitRadius = Math.sqrt(fleetPosition[0] * fleetPosition[0] + fleetPosition[2] * fleetPosition[2]);
      const fleetAngle = Math.atan2(fleetPosition[2], fleetPosition[0]);
      
      // Ships face 90 degrees ahead of radial direction (tangent to orbit)
      shipRef.current.rotation.y = fleetAngle + Math.PI / 2;
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

  // Safe faction access with error handling
  const shipColor = ship?.faction?.name === 'Contested Zone' ? '#888888' : '#00ffff';
  const shipEmissive = ship?.faction?.name === 'Contested Zone' ? '#222222' : '#004444';
  const scale = getShipScale(ship?.type || 'cruiser');

  return (
    <mesh
      ref={shipRef}
      position={fleetPosition || [0, 0, 0]} // Initial position, will be updated by useFrame
      scale={[scale, scale, scale]}
      onClick={(e) => {
        e.stopPropagation();
        if (ship?.name && ship?.type) {
          console.log(`Ship ${ship.name}: ${ship.type}`);
        }
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
  const [realTimePosition, setRealTimePosition] = useState<[number, number, number]>(fleet.position);
  
  // Debug fleet data on render
  if (movementData) {
    console.log(`FleetMarker ${fleet.id} received movementData:`, {
      progress: movementData.progress,
      hasTarget: !!movementData.targetPosition,
      fleetPos: fleet.position
    });
  }
  
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
      
      // More frequent debug logging
      if (Math.random() < 0.1) {
        console.log(`Fleet ${fleet.id} moving:`, {
          progress: (progress * 100).toFixed(1) + '%',
          from: [currentX.toFixed(1), currentZ.toFixed(1)],
          to: [targetX.toFixed(1), targetZ.toFixed(1)],
          current: [interpolatedPos[0].toFixed(1), interpolatedPos[2].toFixed(1)]
        });
      }
      
      return interpolatedPos;
    }
    return fleet.position;
  }, [fleet.position, movementData]);

  const [x, y, z] = currentPosition;
  
  // Calculate orbital motion using exact planet formula
  const orbitRadius = Math.sqrt(x * x + z * z);
  const orbitalSpeed = useMemo(() => {
    // Use exact same formula as planets: Math.sqrt(1 / orbitRadius) * 0.15
    return Math.sqrt(1 / orbitRadius) * 0.15;
  }, [orbitRadius]);

  useFrame((state, delta) => {
    if (fleetRef.current) {
      const [posX, posY, posZ] = currentPosition;
      
      if (movementData && movementData.progress > 0 && movementData.progress < 1) {
        // During movement, use exact interpolated position - no orbital motion
        fleetRef.current.position.set(posX, 0, posZ);
        console.log(`Fleet ${fleet.id} at movement position:`, [posX.toFixed(1), posZ.toFixed(1)]);
      } else {
        // Normal orbital motion when not moving
        const time = Date.now() * 0.0001;
        const currentRadius = Math.sqrt(posX * posX + posZ * posZ);
        const currentAngle = Math.atan2(posZ, posX);
        const orbitalMotion = time * Math.sqrt(1 / Math.max(currentRadius, 0.1)) * 0.15;
        
        fleetRef.current.position.x = currentRadius * Math.cos(currentAngle + orbitalMotion);
        fleetRef.current.position.z = currentRadius * Math.sin(currentAngle + orbitalMotion);
        fleetRef.current.position.y = 0;
      }
      
      // Always update real-time position for ships
      setRealTimePosition([fleetRef.current.position.x, 0, fleetRef.current.position.z]);
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
          fleetPosition={realTimePosition}
          shipIndex={index}
        />
      ))}
    </group>
  );
}