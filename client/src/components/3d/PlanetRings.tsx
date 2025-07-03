import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetRing } from 'shared/schema';

interface PlanetRingsProps {
  rings: PlanetRing[];
  planetRadius: number;
  planetPosition: [number, number, number];
}

export function PlanetRings({ rings, planetRadius, planetPosition }: PlanetRingsProps) {
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
        opacity: ring.density * 0.8, // Use density to control opacity
        blending: THREE.AdditiveBlending
      });

      return { geometry, material, ring, index };
    });
  }, [rings, planetRadius]);

  // Animate ring rotation
  useFrame((state) => {
    if (groupRef.current) {
      // Rotate rings slowly around their axis
      groupRef.current.rotation.z += 0.001;
    }
  });

  return (
    <group ref={groupRef} position={planetPosition}>
      {ringMeshes.map(({ geometry, material, ring, index }) => (
        <mesh
          key={ring.id}
          geometry={geometry}
          material={material}
          rotation={[Math.PI / 2, 0, 0]} // Rotate to be horizontal around planet
        />
      ))}
    </group>
  );
}