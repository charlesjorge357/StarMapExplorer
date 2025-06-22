import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface SimpleStar {
  id: string;
  name?: string;
  position: [number, number, number];
  radius: number;
  spectralClass: string;
  mass?: number;
  temperature?: number;
}

// Selection ring component to match galactic view style
function SelectionRing({ star, isSelected }: { star: SimpleStar; isSelected: boolean }) {
  const ringRef = useRef<any>();
  
  useFrame((state) => {
    if (ringRef.current && isSelected) {
      // Pulse effect
      const pulse = 0.8 + Math.sin(state.clock.getElapsedTime() * 3) * 0.2;
      ringRef.current.scale.setScalar(pulse);
    }
  });
  
  if (!isSelected) return null;
  
  return (
    <mesh ref={ringRef}>
      <sphereGeometry args={[star.radius * 0.5 + 2, 16, 16]} />
      <meshBasicMaterial 
        color="#ffffff"
        transparent
        opacity={0.3}
        wireframe
      />
    </mesh>
  );
}

interface StarFieldProps {
  selectedStar: SimpleStar | null;
  setSelectedStar: (star: SimpleStar | null) => void;
  stars: SimpleStar[];
}

function StarField({ selectedStar, setSelectedStar, stars }: StarFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  
  // Load star surface texture
  const starBumpMap = useTexture('/textures/star_surface.jpg');

  // Get star color based on spectral class
  const getStarColor = (spectralClass: string): string => {
    const firstChar = spectralClass.charAt(0).toUpperCase();
    switch (firstChar) {
      case 'O': return '#9bb0ff';
      case 'B': return '#aabfff';
      case 'A': return '#cad7ff';
      case 'F': return '#f8f7ff';
      case 'G': return '#fff4ea';
      case 'K': return '#ffd2a1';
      case 'M': return '#ffad51';
      default: return '#ffffff';
    }
  };

  // Update instance matrix for all stars
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    stars.forEach((star, i) => {
      dummy.position.set(...star.position);
      dummy.scale.setScalar(star.radius * 0.5); // Half solar radii for visibility
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      // Set color based on spectral class
      const color = new THREE.Color(getStarColor(star.spectralClass));
      meshRef.current.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Instanced star field */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, stars.length]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1.5}
          // Star surface bump map for detailed surface features
          bumpMap={starBumpMap}
          bumpScale={0.05}
        />
      </instancedMesh>

      {/* Individual stars for interaction */}
      {stars.map((star) => (
        <group key={star.id} position={star.position}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStar(star);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
          >
            <sphereGeometry args={[star.radius * 0.5, 8, 6]} />
            <meshBasicMaterial 
              color={getStarColor(star.spectralClass)}
              transparent
              opacity={0}
            />
          </mesh>
          
          {/* Selection ring */}
          <SelectionRing star={star} isSelected={selectedStar?.id === star.id} />
        </group>
      ))}
    </group>
  );
}

export { StarField };