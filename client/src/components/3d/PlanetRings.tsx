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

      // Generate random rotation angles for ring variety
      const rotationX = (Math.random() - 0.5) * 0.4; // Random tilt up to ±0.2 radians
      const rotationY = Math.random() * Math.PI * 2; // Random rotation around Y axis  
      const rotationZ = (Math.random() - 0.5) * 0.4; // Random tilt around Z axis

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