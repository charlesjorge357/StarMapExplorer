
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { Nebula } from 'shared/schema';

interface NebulaMeshProps {
  nebula: Nebula;
  isSelected: boolean;
  onNebulaClick: (nebula: Nebula) => void;
}

export function NebulaMesh({ nebula, isSelected, onNebulaClick }: NebulaMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Create a simple circular texture procedurally
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    // Create a smooth circular gradient
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Generate elliptical nebula dimensions (1.2x larger on average)
  const nebulaShape = useMemo(() => {
    const aspectRatio1 = 0.5 + Math.random() * 1.5; // 0.5 to 2.0
    const aspectRatio2 = 0.5 + Math.random() * 1.5; // 0.5 to 2.0
    const sizeMultiplier = 3.2; // Make nebulas 80% larger on average
    
    const radiusX = nebula.radius * aspectRatio1 * sizeMultiplier;
    const radiusY = nebula.radius * sizeMultiplier;
    const radiusZ = nebula.radius * aspectRatio2 * sizeMultiplier;
    
    // Calculate max XYZ for central glow sizing
    const maxRadius = (Math.max(radiusX, radiusY, radiusZ) * 1.5);
    
    return {
      radiusX,
      radiusY,
      radiusZ,
      rotation: Math.random() * Math.PI * 2,
      maxRadius
    };
  }, [nebula.radius, nebula.id]);

  // Generate particle positions within the elliptical nebula volume
  const particles = useMemo(() => {
    const particleCount = 130; // Fixed count to prevent LOD popping
    const data = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Create elliptical distribution
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      
      // Base spherical coordinates
      const r = 1 - Math.pow(Math.random(), 0.3); // Bias towards center
      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.sin(phi) * Math.sin(theta);
      let z = r * Math.cos(phi);
      
      // Apply elliptical scaling
      x *= nebulaShape.radiusX;
      y *= nebulaShape.radiusY;
      z *= nebulaShape.radiusZ;
      
      // Apply rotation
      const cosRot = Math.cos(nebulaShape.rotation);
      const sinRot = Math.sin(nebulaShape.rotation);
      const rotatedX = x * cosRot - z * sinRot;
      const rotatedZ = x * sinRot + z * cosRot;
      
      const scale = 1.5 + Math.random() * 4;
      const opacity = 0.08 + Math.random() * 0.25;
      const rotationSpeed = (Math.random() - 0.5) * 0.008;
      
      data.push({
        position: [rotatedX, y, rotatedZ] as [number, number, number],
        scale,
        opacity,
        rotationSpeed,
        initialRotation: Math.random() * Math.PI * 2
      });
    }
    return data;
  }, [nebula.radius, nebula.id, nebulaShape]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle overall rotation
      groupRef.current.rotation.y += delta * 0.003;
      groupRef.current.rotation.x += delta * 0.001;
      
      // Individual particle animation
      groupRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Sprite && particles[index]) {
          const particle = particles[index];
          child.material.rotation += particle.rotationSpeed;
          
          // Gentle floating motion
          const time = state.clock.elapsedTime;
          child.position.x += Math.sin(time * 0.3 + index * 0.1) * 0.005;
          child.position.y += Math.cos(time * 0.4 + index * 0.15) * 0.008;
        }
      });
    }
  });

  // Calculate the maximum radius for the hitbox and selection ring (elliptical bounding sphere)
  const selectionRadius = Math.max(nebulaShape.radiusX, nebulaShape.radiusZ); // Use X or Z, whichever is longer

  return (
    <group ref={groupRef} position={nebula.position}>
      {/* Invisible sphere for hitbox */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
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
        <sphereGeometry args={[selectionRadius, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Particle cloud */}
      {particles.map((particle, i) => (
        <sprite
          key={i}
          position={particle.position}
          scale={[particle.scale, particle.scale, 1]}
        >
          <spriteMaterial
            map={texture}
            color={nebula.color}
            transparent
            opacity={particle.opacity * (isSelected ? 1.8 : 1)}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            rotation={particle.initialRotation}
          />
        </sprite>
      ))}

      {/* Central glow for emission nebulas */}
      {nebula.type === 'emission' && (
        <sprite scale={[nebulaShape.maxRadius, nebulaShape.maxRadius, 1]}>
          <spriteMaterial
            map={texture}
            color={nebula.color}
            transparent
            opacity={0.04}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      )}

      {/* Selection indicator - spherical wireframe */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[selectionRadius * 1.1, 32, 16]} />
          <meshBasicMaterial
            color={nebula.color}
            transparent
            opacity={0.15}
            wireframe
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Labels - only when selected */}
      {isSelected && (
        <Text
          position={[0, selectionRadius + 5, 0]}
          fontSize={2}
          color={nebula.color}
          anchorX="center"
          anchorY="middle"
          renderOrder={1000}
        >
          {nebula.name}
        </Text>
      )}

      {isSelected && (
        <Text
          position={[0, selectionRadius + 2, 0]}
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
