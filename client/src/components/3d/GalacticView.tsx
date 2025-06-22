import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useUniverse } from '../../lib/stores/useUniverse';
import { useCamera } from '../../lib/stores/useCamera';
import { StarGenerator } from '../../lib/universe/StarGenerator';
import { Star } from '../../shared/schema';

interface StarMeshProps {
  star: Star;
  onClick: (star: Star) => void;
  isSelected: boolean;
}

function StarMesh({ star, onClick, isSelected }: StarMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const color = StarGenerator.getStarColor(star.spectralClass);
  const scale = Math.max(0.5, Math.min(3, star.radius * 0.5));

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle pulsing animation
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(scale * pulse * (isSelected ? 1.5 : 1));
    }
  });

  return (
    <group position={star.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(star);
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
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : 0.4}
        />
      </mesh>
      
      {(hovered || isSelected) && (
        <Text
          position={[0, scale + 2, 0]}
          fontSize={1}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {star.name}
        </Text>
      )}
      
      {(hovered || isSelected) && (
        <Text
          position={[0, scale + 1, 0]}
          fontSize={0.5}
          color="lightblue"
          anchorX="center"
          anchorY="middle"
        >
          {star.spectralClass} • {star.planetCount} planets
        </Text>
      )}
    </group>
  );
}

export function GalacticView() {
  const { universeData, selectedStar, selectStar, setScope } = useUniverse();
  const { transitionTo } = useCamera();
  
  const stars = universeData?.stars || [];

  const handleStarClick = (star: Star) => {
    console.log("Star clicked:", star.name);
    selectStar(star);
    
    // Transition camera to star and then to system view
    const starPos = new THREE.Vector3(...star.position);
    const cameraPos = starPos.clone().add(new THREE.Vector3(10, 5, 10));
    
    transitionTo(cameraPos, starPos, 2000);
    
    // After transition, switch to system view
    setTimeout(() => {
      setScope('system');
    }, 2000);
  };

  // Create starfield background
  const starfield = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    // Generate background stars
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      positions.push(x, y, z);
      
      const intensity = Math.random();
      colors.push(intensity, intensity, intensity);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    return geometry;
  }, []);

  if (stars.length === 0) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="red" />
      </mesh>
    );
  }

  return (
    <group>
      {/* Test cube to verify 3D rendering */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5, 5, 5]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      
      {/* Grid helper for reference */}
      <gridHelper args={[100, 10]} position={[0, -10, 0]} />
      
      {/* Simple stars */}
      {stars.slice(0, 50).map((star, index) => (
        <mesh 
          key={star.id} 
          position={[star.position[0] * 0.1, star.position[1] * 0.1, star.position[2] * 0.1]}
          onClick={(e) => {
            e.stopPropagation();
            handleStarClick(star);
          }}
        >
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
      ))}
    </group>
  );
}
