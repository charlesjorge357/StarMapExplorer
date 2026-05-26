import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import * as THREE from 'three';

interface FleetMarkerProps {
  fleet: any;
  isSelected?: boolean;
  onFleetClick?: (fleet: any) => void;
  starMass: number;
}

interface ShipMarkerProps {
  ship: any;
  fleetPosition: [number, number, number];
  shipIndex: number;
}

export function ShipMarker({ ship, fleetPosition, shipIndex }: ShipMarkerProps) {
  const shipRef = useRef<Mesh>(null);

  const shipOrbitRadius = useMemo(() => 0.5 + (shipIndex % 3) * 0.3, [shipIndex]);
  const shipOrbitalSpeed = useMemo(
    () => Math.sqrt(1 / Math.max(shipOrbitRadius, 0.1)) * 0.15,
    [shipOrbitRadius]
  );

  useFrame((state) => {
    if (shipRef.current && fleetPosition) {
      const time = Date.now() * 0.0001 + shipIndex * ((Math.PI * 2) / 8);
      const theta = shipOrbitalSpeed * time;
      const nextTheta = theta + 0.01;

      const currentX = shipOrbitRadius * Math.cos(theta);
      const currentZ = shipOrbitRadius * Math.sin(theta);
      const velocityX = shipOrbitRadius * Math.cos(nextTheta) - currentX;
      const velocityZ = shipOrbitRadius * Math.sin(nextTheta) - currentZ;

      shipRef.current.position.x = fleetPosition[0] + currentX;
      shipRef.current.position.z = fleetPosition[2] + currentZ;
      shipRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 2 + shipIndex * 0.5) * 0.02;
      shipRef.current.rotation.y = Math.atan2(velocityZ, velocityX) + Math.PI / 2;
    }
  });

  const getShipScale = (type: string) => {
    switch (type) {
      case 'fighter_wing': case 'bomber_wing': return 0.08;
      case 'cruiser': case 'destroyer': return 0.12;
      case 'carrier': case 'dreadnought': return 0.18;
      case 'battleship': case 'super_carrier': return 0.25;
      default: return 0.12;
    }
  };

  return (
    <mesh
      ref={shipRef}
      position={fleetPosition}
      scale={[getShipScale(ship?.type || 'cruiser'), getShipScale(ship?.type || 'cruiser'), getShipScale(ship?.type || 'cruiser')]}
      onClick={(e) => { e.stopPropagation(); }}
    >
      <boxGeometry args={[1.5, 0.4, 0.8]} />
      <meshLambertMaterial
        color={ship?.faction?.name === 'Contested Zone' ? '#888888' : '#00ffff'}
        emissive={ship?.faction?.name === 'Contested Zone' ? '#222222' : '#004444'}
      />
    </mesh>
  );
}

function keplerianSpeed(orbitRadius: number): number {
  const logicalRadius = orbitRadius / 2;
  return Math.sqrt(1 / Math.max(logicalRadius, 0.1)) * 0.15;
}

export function FleetMarker({ fleet, isSelected, onFleetClick }: FleetMarkerProps) {
  const fleetRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const pingPhase = useMemo(() => Math.random() * 2, []);
  const [realTimePosition, setRealTimePosition] = useState<[number, number, number]>(fleet.position);
  const [isMoving, setIsMoving] = useState(false);

  // Planet-relative orbit: angle offset from synced planet, persisted on fleet object
  const angleOffsetRef = useRef<number>((fleet as any)._angleOffset ?? 0);
  const offsetInitialized = useRef((fleet as any)._angleOffset !== undefined);

  // Keplerian fallback orbit: speed + offset computed from fleet's radial distance
  const keplerianSpeedRef = useRef<number>(
    keplerianSpeed(Math.sqrt(fleet.position[0] ** 2 + fleet.position[2] ** 2))
  );
  const keplerianOffsetRef = useRef<number>(
    (fleet as any)._keplerianOffset ??
      (Math.atan2(fleet.position[2], fleet.position[0]) -
        Date.now() * 0.0001 * keplerianSpeedRef.current)
  );

  // Lazily resolved in useFrame — retries each frame until window.systemPlanets is populated.
  // undefined = not yet resolved; null = resolved but no orbital objects found.
  const closestObjectRef = useRef<any>(undefined);

  // Detect position changes (user moves fleet or restoration)
  const lastPositionRef = useRef<[number, number, number]>(fleet.position);
  useEffect(() => {
    const [lx, , lz] = lastPositionRef.current;
    if (fleet.position[0] === lx && fleet.position[2] === lz) return;
    lastPositionRef.current = [...fleet.position] as [number, number, number];

    const isRestoration = !!(fleet as any)._justRestored;
    delete (fleet as any)._justRestored;
    delete (fleet as any)._forceRecalc;

    // Force re-initialization of planet offset and closest object from new position
    offsetInitialized.current = false;
    closestObjectRef.current = undefined;

    // Recalculate Keplerian params for new orbit radius
    const r = Math.sqrt(fleet.position[0] ** 2 + fleet.position[2] ** 2);
    keplerianSpeedRef.current = keplerianSpeed(r);

    setIsMoving(true);
    setTimeout(() => setIsMoving(false), isRestoration ? 100 : 1000);
  }, [fleet.position[0], fleet.position[2], fleet.id, (fleet as any)._forceRecalc]);

  useFrame(() => {
    if (!fleetRef.current) return;

    // Lazily resolve closest orbital object — retries each frame until systemPlanets is ready
    if (closestObjectRef.current === undefined) {
      const systemPlanets: any[] = (window as any).systemPlanets || [];
      const systemSpaceFeatures: any[] = (window as any).systemSpaceFeatures || [];
      const all = [
        ...systemPlanets.filter((p: any) => p.orbitRadius && p.orbitSpeed),
        ...systemSpaceFeatures.filter((f: any) => f.orbitRadius && f.orbitSpeed),
      ];
      if (all.length > 0) {
        const fleetRadius = Math.sqrt(fleet.position[0] ** 2 + fleet.position[2] ** 2) / 2;
        const closest = all.reduce<any>(
          (best, obj) =>
            Math.abs(obj.orbitRadius - fleetRadius) <
            Math.abs((best?.orbitRadius ?? Infinity) - fleetRadius)
              ? obj
              : best,
          null
        );
        closestObjectRef.current =
          Math.abs(closest.orbitRadius - fleetRadius) < 4.0 ? closest : null;
      }
    }

    const pos = fleetRef.current.position;
    const planetPositions: Record<string, { x: number; z: number; angle: number }> =
      (window as any).currentPlanetPositions || {};
    const planetData = closestObjectRef.current ? planetPositions[closestObjectRef.current.id] : null;

    // Lazily initialize planet-relative offset once planet data is available
    if (!offsetInitialized.current && planetData) {
      const fleetAngle = Math.atan2(fleet.position[2], fleet.position[0]);
      angleOffsetRef.current = fleetAngle - planetData.angle;
      (fleet as any)._angleOffset = angleOffsetRef.current;
      offsetInitialized.current = true;
    }

    const orbitRadius = Math.sqrt(fleet.position[0] ** 2 + fleet.position[2] ** 2);

    if (isMoving) {
      // Hold at exact position; keep both offsets current for seamless handoff
      pos.set(fleet.position[0], fleet.position[1], fleet.position[2]);

      const fleetAngle = Math.atan2(fleet.position[2], fleet.position[0]);

      keplerianOffsetRef.current =
        fleetAngle - Date.now() * 0.0001 * keplerianSpeedRef.current;
      (fleet as any)._keplerianOffset = keplerianOffsetRef.current;

      if (planetData) {
        angleOffsetRef.current = fleetAngle - planetData.angle;
        (fleet as any)._angleOffset = angleOffsetRef.current;
      }
    } else if (planetData && offsetInitialized.current) {
      // Planet-relative orbit: follow planet's angle with constant offset
      const fleetAngle = planetData.angle + angleOffsetRef.current;
      pos.set(
        orbitRadius * Math.cos(fleetAngle),
        fleet.position[1],
        orbitRadius * Math.sin(fleetAngle)
      );
      // Keep Keplerian offset current so remount handoff is seamless
      keplerianOffsetRef.current =
        fleetAngle - Date.now() * 0.0001 * keplerianSpeedRef.current;
      (fleet as any)._keplerianOffset = keplerianOffsetRef.current;
    } else {
      // Keplerian fallback: orbit the star at the speed a body at this radius would
      const angle =
        Date.now() * 0.0001 * keplerianSpeedRef.current + keplerianOffsetRef.current;
      pos.set(
        orbitRadius * Math.cos(angle),
        fleet.position[1],
        orbitRadius * Math.sin(angle)
      );
      (fleet as any)._keplerianOffset = keplerianOffsetRef.current;
    }

    setRealTimePosition([pos.x, pos.y, pos.z]);

    // Sonar ping ring
    if (ringRef.current) {
      ringRef.current.position.copy(pos);
      const t = ((Date.now() * 0.0005 + pingPhase) % 1);
      ringRef.current.scale.setScalar(1 + t * 6);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.45;
    }
  });

  const scale = Math.max(0.15, Math.min(0.3, fleet.size / 10));

  return (
    <group>
      <mesh
        ref={fleetRef}
        scale={[scale, scale, scale]}
        onClick={(e) => {
          e.stopPropagation();
          onFleetClick?.(fleet);
        }}
      >
        <octahedronGeometry args={[1, 0]} />
        <meshLambertMaterial
          color={isSelected ? '#ff6600' : (fleet.faction?.name === 'Contested Zone' ? '#666666' : '#2255ff')}
          emissive={isSelected ? '#ff3300' : (fleet.faction?.name === 'Contested Zone' ? '#333333' : '#0033bb')}
        />
      </mesh>

      {/* Sonar ping ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.42, 32]} />
        <meshBasicMaterial
          color={isSelected ? '#ff6600' : (fleet.faction?.color || '#4477ff')}
          transparent
          opacity={0.45}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {fleet.composition?.map((ship: any, index: number) => (
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
