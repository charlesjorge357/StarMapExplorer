import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetRing } from 'shared/schema';

interface PlanetRingsProps {
  rings: PlanetRing[];
  planetRadius: number;
  planetRef: React.RefObject<THREE.Mesh>;
}

export function PlanetRings({ rings, planetRadius, planetRef }: PlanetRingsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Create ring geometries and materials
  const ringMeshes = useMemo(() => {
    return rings.map((ring, index) => {
      const innerRadius = ring.innerRadius * planetRadius;
      const outerRadius = ring.outerRadius * planetRadius;
      
      // Create ring geometry using RingGeometry
      const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
      
      // Create material with ring properties
      const material = new THREE.MeshBasicMaterial({
        color: ring.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: ring.density * 0.15, // Substantially reduced glow
        blending: THREE.AdditiveBlending
      });

      // Generate deterministic rotation angles based on ring properties to match SystemView
      const ringHash = ring.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const rotationX = ((ringHash % 100) / 100 - 0.5) * 0.4; // Deterministic tilt up to ±0.2 radians
      const rotationY = ((ringHash * 7) % 360) * (Math.PI / 180); // Deterministic rotation around Y axis  
      const rotationZ = (((ringHash * 13) % 100) / 100 - 0.5) * 0.4; // Deterministic tilt around Z axis

      return { geometry, material, ring, index, rotationX, rotationY, rotationZ };
    });
  }, [rings, planetRadius]);

  // Sync ring position with planet (no rotation)
  useFrame((state) => {
    if (groupRef.current && planetRef.current) {
      // Match the planet's position exactly
      groupRef.current.position.copy(planetRef.current.position);
    }
  });

  return (
    <group ref={groupRef}>
      {ringMeshes.map(({ geometry, material, ring, index, rotationX, rotationY, rotationZ }) => (
        <mesh
          key={ring.id}
          geometry={geometry}
          material={material}
          rotation={[Math.PI / 2 + rotationX, rotationY, rotationZ]} // Base horizontal rotation plus random angles
        />
      ))}
    </group>
  );
}