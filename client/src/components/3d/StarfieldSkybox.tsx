import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StarGenerator } from '../../lib/universe/StarGenerator';

interface StarfieldSkyboxProps {
  stars: any[];
  scale?: number;
}

export function StarfieldSkybox({ stars, scale = 0.1 }: StarfieldSkyboxProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Create distant scaled version of the starfield
  const skyboxData = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];
    const matrices: THREE.Matrix4[] = [];
    
    stars.forEach((star) => {
      // Scale down and push far away
      const scaledPos = new THREE.Vector3(
        star.position[0] * scale,
        star.position[1] * scale, 
        star.position[2] * scale
      );
      
      // Push to distance for skybox effect
      const distance = 3000;
      scaledPos.normalize().multiplyScalar(distance);
      
      positions.push(scaledPos);
      colors.push(new THREE.Color(StarGenerator.getStarColor(star.spectralClass)));
      
      // Create transformation matrix
      const matrix = new THREE.Matrix4();
      const starScale = 0.5 + Math.random() * 1.0;
      matrix.compose(
        scaledPos,
        new THREE.Quaternion(),
        new THREE.Vector3(starScale, starScale, starScale)
      );
      matrices.push(matrix);
    });
    
    return { positions, colors, matrices };
  }, [stars, scale]);

  useFrame((state) => {
    if (meshRef.current) {
      // Set instance matrices and colors
      skyboxData.matrices.forEach((matrix, i) => {
        // Add gentle pulsing
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + i * 0.1) * 0.1;
        const pulsedMatrix = matrix.clone();
        pulsedMatrix.scale(new THREE.Vector3(pulse, pulse, pulse));
        meshRef.current!.setMatrixAt(i, pulsedMatrix);
      });
      
      // Set colors
      const colorArray = new Float32Array(skyboxData.colors.length * 3);
      skyboxData.colors.forEach((color, i) => {
        colorArray[i * 3] = color.r;
        colorArray[i * 3 + 1] = color.g;
        colorArray[i * 3 + 2] = color.b;
      });
      
      if (!meshRef.current.instanceColor) {
        meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
      } else {
        meshRef.current.instanceColor.array = colorArray;
        meshRef.current.instanceColor.needsUpdate = true;
      }
      
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, stars.length]}
      renderOrder={-1000}
      raycast={() => null}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        transparent
        opacity={0.7}
        depthWrite={false}
        emissive="#ffffff"
        emissiveIntensity={0.5}
      />
    </instancedMesh>
  );
}