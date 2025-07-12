import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CometTrailProps {
  cometRef: React.RefObject<THREE.Mesh>;
}

export const CometTrail: React.FC<CometTrailProps> = ({ cometRef }) => {
  const trailRef = useRef<THREE.Group>(null);

  const maxParticles = 50;
  const positions = useMemo(() => Array.from({ length: maxParticles }, () => new THREE.Vector3()), []);

  useFrame(() => {
    if (!cometRef.current || !trailRef.current) return;

    // Shift old positions back
    for (let i = maxParticles - 1; i > 0; i--) {
      positions[i].copy(positions[i - 1]);
    }

    // Update head with current comet position
    positions[0].copy(cometRef.current.position);

    // Update mesh positions
    trailRef.current.children.forEach((child, i) => {
      child.position.copy(positions[i]);
      (child.material as THREE.Material).opacity = 1 - i / maxParticles;
    });
  });

  return (
    <group ref={trailRef}>
      {positions.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.1 * (1 - i / maxParticles), 4, 4]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={1 - i / maxParticles}
            emissive="#ffffff"
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
};