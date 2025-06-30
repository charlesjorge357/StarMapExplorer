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
  }, [nebulas, excludeNebula]);

  // Removed useFrame rotation - nebulas are now static

  return (
    <group ref={groupRef}>
      {nebulas
        .filter(nebula => excludeNebula?.id !== nebula.id)
        .map((nebula) => {
          // Calculate direction from origin to nebula
          const direction = new THREE.Vector3(...nebula.position).normalize();

          // Place nebula sprites at the same distance as the starfield skybox (2000 units)
          const skyboxDistance = 20000; // Match the starfield skybox distance
          const skyboxPosition = direction.multiplyScalar(skyboxDistance);

          // Scale based on original nebula size but make it much larger to be visible from far away
          const scale = Math.max(nebula.radius * 4.8, 150); // Scale up to match larger galactic nebulas

          return (
            <sprite
              key={nebula.id}
              position={[skyboxPosition.x, skyboxPosition.y, skyboxPosition.z]}
              scale={[scale, scale, 1]}
            >
              <spriteMaterial
                map={texture}
                color={nebula.color}
                transparent
                opacity={0.15}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </sprite>
          );
        })}
    </group>
  );
}