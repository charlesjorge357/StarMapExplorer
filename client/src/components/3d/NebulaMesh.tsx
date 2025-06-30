
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { Nebula } from '../../../shared/schema';

interface NebulaMeshProps {
  nebula: Nebula;
  isSelected: boolean;
  onNebulaClick: (nebula: Nebula) => void;
}

export function NebulaMesh({ nebula, isSelected, onNebulaClick }: NebulaMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Try to load smoke texture, fallback to a simple circle if not available
  let texture;
  try {
    texture = useTexture('/textures/smoke.png');
  } catch {
    // Create a simple circular texture as fallback
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    texture = new THREE.CanvasTexture(canvas);
  }

  // Generate particle positions within the nebula volume
  const particles = useMemo(() => {
    const particleCount = Math.min(200, Math.max(50, Math.floor(nebula.radius * 2)));
    const data = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Create a more realistic cloud distribution
      const r = nebula.radius * (0.2 + Math.pow(Math.random(), 0.5) * 0.8);
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      // Add some randomness to particle sizes and opacity
      const scale = 2 + Math.random() * 8;
      const opacity = 0.1 + Math.random() * 0.3;
      const rotationSpeed = (Math.random() - 0.5) * 0.01;
      
      data.push({
        position: [x, y, z] as [number, number, number],
        scale,
        opacity,
        rotationSpeed,
        initialRotation: Math.random() * Math.PI * 2
      });
    }
    return data;
  }, [nebula.radius, nebula.id]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle overall rotation
      groupRef.current.rotation.y += delta * 0.005;
      groupRef.current.rotation.x += delta * 0.002;
      
      // Individual particle animation
      groupRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Sprite && particles[index]) {
          const particle = particles[index];
          child.material.rotation += particle.rotationSpeed;
          
          // Gentle floating motion
          const time = state.clock.elapsedTime;
          child.position.y += Math.sin(time * 0.5 + index) * 0.01;
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={nebula.position}>
      {/* Particle cloud */}
      {particles.map((particle, i) => (
        <sprite
          key={i}
          position={particle.position}
          scale={[particle.scale, particle.scale, 1]}
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            onNebulaClick(nebula);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          <spriteMaterial
            map={texture}
            color={nebula.color}
            transparent
            opacity={particle.opacity * (isSelected ? 1.5 : 1) * (hovered ? 1.2 : 1)}
            depthWrite={false}
            depthTest={true}
            blending={THREE.AdditiveBlending}
            rotation={particle.initialRotation}
          />
        </sprite>
      ))}

      {/* Central glow for emission nebulas */}
      {nebula.type === 'emission' && (
        <sprite scale={[nebula.radius * 0.8, nebula.radius * 0.8, 1]}>
          <spriteMaterial
            color={nebula.color}
            transparent
            opacity={0.05}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[nebula.radius * 1.1, 32, 16]} />
          <meshBasicMaterial
            color={nebula.color}
            transparent
            opacity={0.1}
            wireframe
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Labels */}
      {(hovered || isSelected) && (
        <Text
          position={[0, nebula.radius + 5, 0]}
          fontSize={2}
          color={nebula.color}
          anchorX="center"
          anchorY="middle"
          renderOrder={1000}
        >
          {nebula.name}
        </Text>
      )}

      {(hovered || isSelected) && (
        <Text
          position={[0, nebula.radius + 2, 0]}
          fontSize={1}
          color={nebula.color}
          anchorX="center"
          anchorY="middle"
          renderOrder={1000}
        >
          {nebula.type} • {nebula.composition}
        </Text>
      )}
    </group>
  );
}
