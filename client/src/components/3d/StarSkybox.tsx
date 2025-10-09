import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarSkyboxProps {
  count?: number;
  radius?: number;
  starPosition?: [number, number, number];
}

export function StarSkybox({ count = 5000, radius = 800, starPosition = [0, 0, 0] }: StarSkyboxProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Generate star data once
  const starData = useMemo(() => {
    const positions = [];
    const colors = [];
    const matrices = [];
    
    for (let i = 0; i < count; i++) {
      // Generate points on sphere surface
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(1 - 2 * Math.random());
      
      const x = starPosition[0] + radius * Math.sin(phi) * Math.cos(theta);
      const y = starPosition[1] + radius * Math.sin(phi) * Math.sin(theta);
      const z = starPosition[2] + radius * Math.cos(phi);
      
      positions.push(x, y, z);
      
      // Stellar classification colors
      const rand = Math.random();
      let r, g, b;
      
      if (rand < 0.05) {
        r = 0.6; g = 0.7; b = 1.0; // O-type: Blue
      } else if (rand < 0.15) {
        r = 0.7; g = 0.8; b = 1.0; // B-type: Blue-white
      } else if (rand < 0.25) {
        r = 0.9; g = 0.9; b = 1.0; // A-type: White
      } else if (rand < 0.35) {
        r = 1.0; g = 0.95; b = 0.8; // F-type: Yellow-white
      } else if (rand < 0.55) {
        r = 1.0; g = 0.9; b = 0.6; // G-type: Yellow
      } else if (rand < 0.75) {
        r = 1.0; g = 0.7; b = 0.4; // K-type: Orange
      } else {
        r = 1.0; g = 0.5; b = 0.3; // M-type: Red
      }
      
      const brightness = 0.4 + Math.random() * 0.6;
      colors.push(r * brightness, g * brightness, b * brightness);
      
      // Create transformation matrix for each star
      const matrix = new THREE.Matrix4();
      const scale = 0.5 + Math.random() * 1.0; // Random star sizes
      matrix.compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion(),
        new THREE.Vector3(scale, scale, scale)
      );
      matrices.push(matrix);
    }
    
    return { positions, colors, matrices };
  }, [count, radius]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, count]}
      position={[0, 0, 0]}
      renderOrder={-1000}
      raycast={() => null}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.8}
        depthWrite={false}
      />
      <primitive 
        object={{
          onBeforeRender: () => {
            if (meshRef.current) {
              // Set instance matrices
              starData.matrices.forEach((matrix, i) => {
                meshRef.current!.setMatrixAt(i, matrix);
              });
              
              // Set instance colors
              const colorArray = new Float32Array(starData.colors);
              meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
              
              meshRef.current.instanceMatrix.needsUpdate = true;
              if (meshRef.current.instanceColor) {
                meshRef.current.instanceColor.needsUpdate = true;
              }
            }
          }
        }}
      />
    </instancedMesh>
  );
}