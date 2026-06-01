import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';

interface ArmyMarkerProps {
  army: any;
  planetRadius: number;
  isSelected?: boolean;
  movementData?: { targetPosition: [number, number]; progress: number };
  onArmyClick?: (army: any) => void;
}

interface DivisionMarkerProps {
  division: any;
  armyFaction: any;
  planetRadius: number;
  armyPosition: [number, number];
  divisionIndex: number;
  totalDivisions: number;
}

function latLonToSphere(lat: number, lon: number, radius: number): [number, number, number] {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  ];
}

export function DivisionMarker({ division, armyFaction, planetRadius, armyPosition, divisionIndex, totalDivisions }: DivisionMarkerProps) {
  const ref = useRef<Group>(null);

  const [armyLat, armyLon] = armyPosition;

  // Orbit rings: inner ring (index 0-4) at 3°, outer ring (index 5+) at 6°
  const ring     = Math.floor(divisionIndex / 5);
  const posInRing = divisionIndex % 5;
  const ringSize = Math.min(totalDivisions, 5);
  const angle    = (posInRing / ringSize) * Math.PI * 2 + ring * 0.4;
  const spread   = 3.0 + ring * 3.0; // degrees

  const offsetLat = armyLat + Math.cos(angle) * spread;
  const offsetLon = armyLon + Math.sin(angle) * spread;
  const spherePos = latLonToSphere(offsetLat, offsetLon, planetRadius + 0.1);

  const color = division.faction?.color ?? armyFaction?.color ?? '#00ff88';

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.set(...spherePos);
      ref.current.position.y += Math.sin(state.clock.elapsedTime * 2 + divisionIndex * 0.7) * 0.02;
      ref.current.rotation.y = state.clock.elapsedTime * 0.4 + divisionIndex;
    }
  });

  const scale = Math.max(0.04, Math.min(0.10, (division.size || 100) / 300));

  return (
    <group ref={ref}>
      {/* Placeholder geometry — swap this mesh for a GLB primitive when models are ready */}
      <mesh
        scale={[scale, scale, scale]}
        onClick={(e) => e.stopPropagation()}
      >
        <boxGeometry args={[1, 0.6, 1]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

export function ArmyMarker({ army, planetRadius, isSelected, movementData, onArmyClick }: ArmyMarkerProps) {
  const armyRef = useRef<Mesh>(null);

  const currentPosition = useMemo(() => {
    if (movementData && movementData.progress < 1) {
      const [cLat, cLon] = army.position;
      const [tLat, tLon] = movementData.targetPosition;
      const t = movementData.progress ** 2 * (3 - 2 * movementData.progress);
      return [cLat + (tLat - cLat) * t, cLon + (tLon - cLon) * t] as [number, number];
    }
    return army.position as [number, number];
  }, [army.position, movementData]);

  const spherePos = latLonToSphere(currentPosition[0], currentPosition[1], planetRadius + 0.15);
  const factionColor = army.faction?.color || '#2222cc';
  const commandColor = isSelected ? '#ff6600' : factionColor;

  useFrame((state) => {
    if (armyRef.current) {
      armyRef.current.position.set(...spherePos);
      armyRef.current.position.y += Math.sin(state.clock.elapsedTime + (army.size ?? 0) * 0.01) * 0.05;
      armyRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  const scale = Math.max(0.06, Math.min(0.18, (army.size ?? 500) / 1000));

  return (
    <group>
      {/* Command unit — clickable HQ marker */}
      <mesh
        ref={armyRef}
        position={spherePos}
        scale={[scale, scale, scale]}
        onClick={(e) => { e.stopPropagation(); onArmyClick?.(army); }}
      >
        <cylinderGeometry args={[1, 1, 0.8, 8]} />
        <meshLambertMaterial color={commandColor} emissive={commandColor} emissiveIntensity={0.2} />
      </mesh>

      {/* Division markers spread in orbital rings around the HQ */}
      {army.composition?.map((division: any, i: number) => (
        <DivisionMarker
          key={division.id}
          division={division}
          armyFaction={army.faction}
          planetRadius={planetRadius}
          armyPosition={currentPosition}
          divisionIndex={i}
          totalDivisions={army.composition.length}
        />
      ))}
    </group>
  );
}
