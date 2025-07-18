import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useUniverse } from '../../lib/stores/useUniverse';
import { useCamera } from '../../lib/stores/useCamera';
import { StarGenerator } from '../../lib/universe/StarGenerator';
import { NebulaMesh } from './NebulaMesh';
import { Star, Nebula } from 'shared/schema';

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
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      const finalScale = scale * pulse * (isSelected ? 1.5 : 1);
      meshRef.current.scale.set(finalScale, finalScale, finalScale);
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
        renderOrder={999}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : 0.4}
          transparent={false}
          opacity={1.0}
          depthTest = {false}
          depthWrite={true}
        />
      </mesh>

      {(hovered || isSelected) && (
        <Text
          position={[0, scale + 2, 0]}
          fontSize={1}
          color={color}
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
          color={color}
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

  const handleBackgroundClick = () => {
    if (selectedStar) {
      // Only clear star selection since GalacticView doesn't manage nebula state
      console.log('Cleared star selection in GalacticView');
    }
    if (selectedNebula) {
      setSelectedNebula(null);
      console.log('Cleared nebula selection in GalacticView');
    }
  };

  const handleStarClick = (star: Star) => {
    console.log('Star clicked:', star.name);
    selectStar(star);
    
    // Get current camera state for smooth transition
    const { camera } = useThree.getState();
    const currentPos = camera.position.clone();
    const currentTarget = new THREE.Vector3(0, 0, 0);
    
    // Calculate target position for system view
    const starPos = new THREE.Vector3(...star.position);
    const systemViewPos = new THREE.Vector3(0, 20, 200); // Standard system view position
    const systemViewTarget = new THREE.Vector3(0, 0, 0);
    
    // Start smooth transition
    transitionTo(currentPos, systemViewPos, currentTarget, systemViewTarget, 2000);
    
    // Switch scope after transition completes
    setTimeout(() => setScope('system'), 2000);
  };

  // Use nebulas from universe data (generated with stars)
  const nebulas = useMemo<Nebula[]>(
    () => {
      // If universe has nebulas, use them; otherwise generate them for backward compatibility
      if (universeData?.nebulas) {
        return universeData.nebulas;
      }
      return StarGenerator.generateNebulas(40, stars);
    },
    [universeData, stars]
  );
  const [selectedNebula, setSelectedNebula] = useState<Nebula | null>(null);
  const onNebulaClick = (nebula: Nebula) => {
    if (selectedNebula?.id === nebula.id) {
      // Deselect if clicking the same nebula
      console.log(`Deselected nebula: ${nebula.name}`);
      setSelectedNebula(null);
    } else {
      // Select new nebula
      console.log(`Nebula selected: ${nebula.name}`);
      setSelectedNebula(nebula);
    }
  };

  // starfield background
  const starfield = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    for (let i = 0; i < 5000; i++) {
      positions.push(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000
      );
      const intensity = Math.random();
      colors.push(intensity, intensity, intensity);
    }
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
    return geometry;
  }, []);

  // Display star count in header
  useEffect(() => {
    console.log(`Displaying ${stars.length} stars in galactic view`);
  }, [stars.length]);

  // Display all generated stars
  const displayedStars = useMemo(() => stars, [stars]);

  if (stars.length === 0) {
    return (
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 16, 12]} />
        <meshBasicMaterial color="orange" />
      </mesh>
    );
  }

  return (
    <group onClick={handleBackgroundClick}>
      {/* Background starfield */}
      <points geometry={starfield}>
        <pointsMaterial size={0.5} vertexColors transparent opacity={0.6} />
      </points>

      {/* Main stars */}
      {displayedStars.map((star) => (
        <StarMesh
          key={star.id}
          star={star}
          onClick={handleStarClick}
          isSelected={selectedStar?.id === star.id}
        />
      ))}

      {/* Nebulas */}
      {nebulas.map((nebula) => (
        <NebulaMesh
          key={nebula.id}
          nebula={nebula}
          isSelected={selectedNebula?.id === nebula.id}
          onNebulaClick={onNebulaClick}
        />
      ))}

      {/* Grid helper */}
      <gridHelper args={[1000, 50]} position={[0, -500, 0]} />

      {/* Navigation info */}
      <mesh position={[0, 400, 0]}>
        <planeGeometry args={[200, 50]} />
        <meshBasicMaterial color="#222222" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}