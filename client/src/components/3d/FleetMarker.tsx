import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import * as THREE from 'three';

interface FleetMarkerProps {
  fleet: any; // Fleets type from schema
  isSelected?: boolean;
  onFleetClick?: (fleet: any) => void;
  starMass: number;
}

interface ShipMarkerProps {
  ship: any; // Ships type from schema
  fleetPosition: [number, number, number];
  shipIndex: number;
}

// Enhanced orbital rotation helper based on your updateOrbitingObject function
function updateOrbitingObject(
  mesh: THREE.Object3D,
  radius: number,
  angularSpeed: number,
  time: number,
  clockwise: boolean = false
) {
  const theta = angularSpeed * time;
  const x = radius * Math.cos(theta);
  const z = radius * Math.sin(theta); // Using z instead of y for 3D space
  let dx = -radius * Math.sin(theta);
  let dz = radius * Math.cos(theta);
  if (clockwise) {
    dx = -dx;
    dz = -dz;
  }
  const angle = Math.atan2(dz, dx);
  mesh.position.set(x, mesh.position.y, z); // Preserve y position
  mesh.rotation.y = angle; // Rotate around y-axis for 3D
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
      const time = Date.now() * 0.0001 + shipIndex * (Math.PI * 2 / 8); // Stagger ships
      const theta = shipOrbitalSpeed * time;
      
      // Calculate ship position relative to fleet center
      const shipX = shipOrbitRadius * Math.cos(theta);
      const shipZ = shipOrbitRadius * Math.sin(theta);
      
      // Calculate ship rotation (direction of movement)
      const dx = -shipOrbitRadius * Math.sin(theta);
      const dz = shipOrbitRadius * Math.cos(theta);
      const shipRotation = Math.atan2(dz, dx);
      
      // Apply fleet position offset to get world position  
      shipRef.current.position.x = fleetPosition[0] + shipX;
      shipRef.current.position.z = fleetPosition[2] + shipZ;
      shipRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + shipIndex * 0.5) * 0.02; // Gentle floating
      
      // Calculate fleet's orbital direction for formation alignment
      const fleetOrbitRadius = Math.sqrt(fleetPosition[0] * fleetPosition[0] + fleetPosition[2] * fleetPosition[2]);
      const fleetAngle = Math.atan2(fleetPosition[2], fleetPosition[0]);
      
      // Combine ship's local rotation with fleet's orbital direction
      shipRef.current.rotation.y = shipRotation + fleetAngle + Math.PI / 2;
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

export function FleetMarker({ fleet, isSelected, onFleetClick, starMass }: FleetMarkerProps) {
  const fleetRef = useRef<Mesh>(null);
  const [realTimePosition, setRealTimePosition] = useState<[number, number, number]>(fleet.position);
  
  // Orbit center and base parameters - these should NOT change during orbital motion
  const orbitCenter = fleet.orbitCenter || [0, 0, 0];
  
  // Calculate orbit radius from fleet.position - this will update when fleet is moved to new location
  const orbitRadius = useMemo(() => {
    const dx = fleet.position[0] - orbitCenter[0];
    const dz = fleet.position[2] - orbitCenter[2];
    const radius = Math.sqrt(dx * dx + dz * dz);
    console.log(`📐 Fleet ${fleet.id} orbit radius calculated: ${radius.toFixed(2)} AU from position [${fleet.position.join(', ')}]`);
    return radius;
  }, [fleet.position[0], fleet.position[2], orbitCenter[0], orbitCenter[2], fleet.id]);
  
  const orbitalSpeed = useMemo(() => {
    // Use exact same formula as planets: Math.sqrt(1 / orbitRadius) * 0.15
    return Math.sqrt(1 / Math.max(orbitRadius, 0.1)) * 0.15;
  }, [orbitRadius]);

  // Calculate initial angle based on fleet.position to start at the clicked location
  const initialAngle = useMemo(() => {
    const dx = fleet.position[0] - orbitCenter[0];
    const dz = fleet.position[2] - orbitCenter[2];
    const angle = Math.atan2(dz, dx);
    console.log(`🎯 Fleet ${fleet.id} initial angle: ${angle.toFixed(2)} rad from position [${fleet.position.join(', ')}]`);
    return angle;
  }, [fleet.position[0], fleet.position[2], orbitCenter[0], orbitCenter[2], fleet.id]);

  useFrame(() => {
    if (fleetRef.current) {
      const time = Date.now() * 0.0001;
      const angle = time * orbitalSpeed + initialAngle;

      // Calculate orbital position using fixed radius and orbit center
      const x = orbitCenter[0] + orbitRadius * Math.cos(angle);
      const z = orbitCenter[2] + orbitRadius * Math.sin(angle);

      fleetRef.current.position.set(x, 0, z);

      // Pass real-time fleet center to ShipMarkers
      setRealTimePosition([x, 0, z]);
    }
  });

  // Fleet command ship - larger marker
  const scale = Math.max(0.15, Math.min(0.3, fleet.size / 10));

  return (
    <group>
      {/* Fleet command ship */}
      <mesh
        ref={fleetRef}
        position={fleet.position}
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