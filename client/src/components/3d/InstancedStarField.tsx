import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { StarGenerator } from '../../lib/universe/StarGenerator';
import { usePerformance } from '../../lib/stores/usePerformance';

interface Star {
  id: string;
  name?: string;
  position: [number, number, number];
  radius: number;
  spectralClass: string;
}

interface InstancedStarFieldProps {
  stars: Star[];
  selectedStar: Star | null;
  onStarClick: (star: Star) => void;
}

export function InstancedStarField({ stars, selectedStar, onStarClick }: InstancedStarFieldProps) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const interactionMeshRef = useRef<THREE.InstancedMesh>(null);
  const { starGeometrySegments } = usePerformance();
  
  // Load star surface texture
  const starBumpMap = useTexture('/textures/star_surface.jpg');
  
  // Pre-calculate star data
  const starData = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const starMap = new Map<number, Star>();
    
    stars.forEach((star, index) => {
      // Visual matrix
      const matrix = new THREE.Matrix4();
      const visualRadius = Math.max(0.2, star.radius * 1.0);
      matrix.compose(
        new THREE.Vector3(...star.position),
        new THREE.Quaternion(),
        new THREE.Vector3(visualRadius, visualRadius, visualRadius)
      );
      matrices.push(matrix);
      
      // Color based on spectral class
      const color = new THREE.Color(StarGenerator.getStarColor(star.spectralClass));
      colors.push(color);
      
      // Map index to star for click handling
      starMap.set(index, star);
    });
    
    return { matrices, colors, starMap };
  }, [stars]);
  
  // Interaction matrices (larger hitboxes)
  const interactionMatrices = useMemo(() => {
    return stars.map(star => {
      const matrix = new THREE.Matrix4();
      const hitboxRadius = Math.max(2.0, star.radius * 2.0);
      matrix.compose(
        new THREE.Vector3(...star.position),
        new THREE.Quaternion(),
        new THREE.Vector3(hitboxRadius, hitboxRadius, hitboxRadius)
      );
      return matrix;
    });
  }, [stars]);
  
  // Set instance matrices and colors after mount and when data changes
  useEffect(() => {
    if (instancedMeshRef.current) {
      starData.matrices.forEach((matrix, i) => {
        instancedMeshRef.current!.setMatrixAt(i, matrix);
        instancedMeshRef.current!.setColorAt(i, starData.colors[i]);
      });
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      if (instancedMeshRef.current.instanceColor) {
        instancedMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
    
    if (interactionMeshRef.current) {
      interactionMatrices.forEach((matrix, i) => {
        interactionMeshRef.current!.setMatrixAt(i, matrix);
      });
      interactionMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [starData, interactionMatrices]);
  
  // Handle click on interaction mesh
  const handleClick = (event: any) => {
    event.stopPropagation();
    const instanceId = event.instanceId;
    if (instanceId !== undefined) {
      const star = starData.starMap.get(instanceId);
      if (star) {
        console.log(`Selected star: ${star.name || star.id}`);
        onStarClick(star);
      }
    }
  };
  
  return (
    <group>
      {/* Visual stars - instanced */}
      <instancedMesh 
        ref={instancedMeshRef}
        args={[undefined, undefined, stars.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, starGeometrySegments, starGeometrySegments]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.8}
          map={starBumpMap}
          transparent={false}
          depthTest={false}
        />
      </instancedMesh>
      
      {/* Interaction hitboxes - instanced, invisible */}
      <instancedMesh 
        ref={interactionMeshRef}
        args={[undefined, undefined, stars.length]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial visible={false} />
      </instancedMesh>
      
      {/* Selection overlay - only for selected star */}
      {selectedStar && (
        <mesh position={selectedStar.position}>
          <sphereGeometry args={[Math.max(0.2, selectedStar.radius * 1.0) + 0.2, starGeometrySegments, starGeometrySegments]} />
          <meshBasicMaterial 
            color="#ffffff"
            transparent
            opacity={0.3}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      )}
    </group>
  );
}
