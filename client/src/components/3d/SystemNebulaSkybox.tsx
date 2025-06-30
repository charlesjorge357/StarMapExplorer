
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Nebula } from 'shared/schema';

interface SystemNebulaSkyboxProps {
  nebulas: Nebula[];
  excludeNebula?: Nebula | null; // Don't show the nebula we're inside
}

export function SystemNebulaSkybox({ nebulas, excludeNebula }: SystemNebulaSkyboxProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create a simple circular texture for nebula sprites
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    
    // Create a soft circular gradient
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Filter out the nebula we're inside and position distant ones as background
  const distantNebulas = useMemo(() => {
    return nebulas
      .filter(nebula => excludeNebula?.id !== nebula.id)
      .map(nebula => {
        // Convert nebula position to a distant skybox position
        const direction = new THREE.Vector3(...nebula.position).normalize();
        const skyboxPosition = direction.multiplyScalar(500); // Far away but visible
        
        return {
          ...nebula,
          skyboxPosition: skyboxPosition.toArray() as [number, number, number],
          size: Math.max(5, nebula.radius * 0.1) // Scale down for distant appearance
        };
      });
  }, [nebulas, excludeNebula]);

  useFrame((state) => {
    if (groupRef.current) {
      // Very slow rotation to make the skybox feel alive
      groupRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group ref={groupRef}>
      {distantNebulas.map((nebula) => (
        <sprite
          key={`skybox-${nebula.id}`}
          position={nebula.skyboxPosition}
          scale={[nebula.size, nebula.size, 1]}
        >
          <spriteMaterial
            map={texture}
            color={nebula.color}
            transparent
            opacity={0.3}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}
