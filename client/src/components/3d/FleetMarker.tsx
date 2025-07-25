import React, { useRef, useMemo, useState, useEffect } from 'react';
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
      
      // Calculate current and next ship positions for velocity direction
      const currentX = shipOrbitRadius * Math.cos(theta);
      const currentZ = shipOrbitRadius * Math.sin(theta);
      
      const nextTheta = theta + 0.01; // Small time step for velocity calculation
      const nextX = shipOrbitRadius * Math.cos(nextTheta);
      const nextZ = shipOrbitRadius * Math.sin(nextTheta);
      
      // Calculate velocity direction (acceleration direction)
      const velocityX = nextX - currentX;
      const velocityZ = nextZ - currentZ;
      
      // Ship faces its acceleration direction
      const accelerationAngle = Math.atan2(velocityZ, velocityX);
      
      // Apply fleet position offset to get world position  
      shipRef.current.position.x = fleetPosition[0] + currentX;
      shipRef.current.position.z = fleetPosition[2] + currentZ;
      shipRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + shipIndex * 0.5) * 0.02; // Gentle floating
      
      // Simple rotation: face the direction of acceleration/movement
      shipRef.current.rotation.y = accelerationAngle;
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
  
  // Movement state tracking
  const [isMoving, setIsMoving] = useState(false);
  const [movementStartTime, setMovementStartTime] = useState(0);
  const lastPositionRef = useRef<[number, number, number]>(fleet.position);
  
  // Detect when fleet position changes (user clicked to move it)
  useEffect(() => {
    const hasPositionChanged = 
      fleet.position[0] !== lastPositionRef.current[0] || 
      fleet.position[2] !== lastPositionRef.current[2];
      
    if (hasPositionChanged) {
      console.log(`🚀 Fleet ${fleet.id} position changed - stopping orbital motion`);
      console.log(`Old: [${lastPositionRef.current.join(', ')}]`);
      console.log(`New: [${fleet.position.join(', ')}]`);
      
      setIsMoving(true);
      setMovementStartTime(Date.now());
      lastPositionRef.current = [...fleet.position];
      
      // Resume orbital motion after 1 second
      setTimeout(() => {
        console.log(`🌀 Fleet ${fleet.id} resuming orbital motion from new position`);
        setIsMoving(false);
      }, 1000);
    }
  }, [fleet.position[0], fleet.position[2], fleet.id]);
  
  // Orbit center and base parameters
  const orbitCenter = fleet.orbitCenter || [0, 0, 0];
  
  // Find the closest planet and adopt its orbital speed
  const { orbitalSpeed, closestPlanet } = useMemo(() => {
    // Get planets from system data
    const systemPlanets = (window as any).systemPlanets || [];
    
    if (systemPlanets.length === 0) {
      // Fallback to calculated speed if no planets available
      const visualRadius = Math.sqrt(fleet.position[0] * fleet.position[0] + fleet.position[2] * fleet.position[2]);
      const logicalRadius = visualRadius / 2;
      return {
        orbitalSpeed: Math.sqrt(1 / Math.max(logicalRadius, 0.1)) * 0.15,
        closestPlanet: null
      };
    }
    
    // Find closest planet by orbital radius (more reliable than position)
    let closestPlanet = null;
    let minRadiusDiff = Infinity;
    const fleetOrbitRadius = Math.sqrt(fleet.position[0] * fleet.position[0] + fleet.position[2] * fleet.position[2]) / 2;
    
    for (const planet of systemPlanets) {
      if (!planet.orbitRadius || !planet.orbitSpeed) continue;
      
      const radiusDiff = Math.abs(planet.orbitRadius - fleetOrbitRadius);
      
      if (radiusDiff < minRadiusDiff) {
        minRadiusDiff = radiusDiff;
        closestPlanet = planet;
      }
    }
    
    if (closestPlanet) {
      console.log(`🌍 Fleet ${fleet.id} adopting orbital speed from closest planet: ${closestPlanet.name} (orbit radius diff: ${minRadiusDiff.toFixed(1)} AU)`);
      return {
        orbitalSpeed: closestPlanet.orbitSpeed,
        closestPlanet: closestPlanet
      };
    }
    
    // Fallback if no closest planet found
    const visualRadius = Math.sqrt(fleet.position[0] * fleet.position[0] + fleet.position[2] * fleet.position[2]);
    const logicalRadius = visualRadius / 2;
    return {
      orbitalSpeed: Math.sqrt(1 / Math.max(logicalRadius, 0.1)) * 0.15,
      closestPlanet: null
    };
  }, [fleet.position[0], fleet.position[2]]);

  // Calculate initial angle from current position
  const initialAngle = useMemo(() => {
    return Math.atan2(fleet.position[2], fleet.position[0]);
  }, [fleet.position[0], fleet.position[2]]);

  useFrame(() => {
    if (fleetRef.current) {
      if (isMoving) {
        // During movement, position fleet exactly at the target coordinates
        fleetRef.current.position.set(fleet.position[0], fleet.position[1], fleet.position[2]);
        setRealTimePosition([fleet.position[0], fleet.position[1], fleet.position[2]]);
        
        if (isSelected) {
          console.log(`🎯 Fleet ${fleet.id} holding position at [${fleet.position.join(', ')}]`);
        }
      } else {
        // Normal orbital motion - calculate time since movement ended
        const currentTime = Date.now();
        const timeSinceMovement = (currentTime - movementStartTime) * 0.0001;
        const angle = timeSinceMovement * orbitalSpeed + initialAngle;

        // Calculate current orbit radius from position for positioning
        const currentOrbitRadius = Math.sqrt(fleet.position[0] * fleet.position[0] + fleet.position[2] * fleet.position[2]);
        const x = currentOrbitRadius * Math.cos(angle);
        const z = currentOrbitRadius * Math.sin(angle);

        fleetRef.current.position.set(x, fleet.position[1], z);
        setRealTimePosition([x, fleet.position[1], z]);
        
        if (isSelected && Math.floor(timeSinceMovement * 10) % 30 === 0) {
          console.log(`🌀 Fleet ${fleet.id} orbiting at [${x.toFixed(1)}, 0, ${z.toFixed(1)}] - speed from ${closestPlanet?.name || 'calculated'}`);
        }
      }
    }
  });

  // Fleet command ship - larger marker
  const scale = Math.max(0.15, Math.min(0.3, fleet.size / 10));

  return (
    <group>
      {/* Fleet command ship */}
      <mesh
        ref={fleetRef}
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