
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { Nebula } from '../../../shared/schema';

interface NebulaMeshProps {
  nebula: Nebula;
  isSelected: boolean;
  onNebulaClick: (nebula: Nebula) => void;
}

export function NebulaMesh({ nebula, isSelected, onNebulaClick }: NebulaMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle rotation and pulsing for nebulas
      meshRef.current.rotation.y += 0.002;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      const scale = pulse * (isSelected ? 1.2 : 1);
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={nebula.position}>
      <mesh
        ref={meshRef}
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
        <sphereGeometry args={[nebula.radius, 32, 32]} />
        <meshBasicMaterial
          color={nebula.color}
          opacity={isSelected ? 0.8 : 0.6}
          transparent
        />
      </mesh>

      {(hovered || isSelected) && (
        <Text
          position={[0, nebula.radius + 5, 0]}
          fontSize={2}
          color={nebula.color}
          anchorX="center"
          anchorY="middle"
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
        >
          {nebula.type} • {nebula.composition}
        </Text>
      )}
    </group>
  );
}
