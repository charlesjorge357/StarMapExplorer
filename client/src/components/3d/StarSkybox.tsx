import React, { useMemo } from 'react';
import * as THREE from 'three';

interface StarSkyboxProps {
  count?: number;
  radius?: number;
}

export function StarSkybox({ count = 2000, radius = 1000 }: StarSkyboxProps) {
  // Generate random star positions on a sphere
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Generate points on sphere surface using spherical coordinates
      const theta = Math.random() * Math.PI * 2; // Azimuth
      const phi = Math.acos(1 - 2 * Math.random()); // Inclination (uniform distribution)
      
      const x = 200 * Math.sin(phi) * Math.cos(theta); // Much closer radius
      const y = 200 * Math.sin(phi) * Math.sin(theta);
      const z = 200 * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    
    return positions;
  }, [count, radius]);

  // Generate random star colors and sizes
  const colors = useMemo(() => {
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Create realistic star colors based on stellar classification
      const rand = Math.random();
      let r, g, b;
      
      if (rand < 0.05) {
        // O-type: Blue
        r = 0.6; g = 0.7; b = 1.0;
      } else if (rand < 0.15) {
        // B-type: Blue-white
        r = 0.7; g = 0.8; b = 1.0;
      } else if (rand < 0.25) {
        // A-type: White
        r = 0.9; g = 0.9; b = 1.0;
      } else if (rand < 0.35) {
        // F-type: Yellow-white
        r = 1.0; g = 0.95; b = 0.8;
      } else if (rand < 0.55) {
        // G-type: Yellow (Sun-like)
        r = 1.0; g = 0.9; b = 0.6;
      } else if (rand < 0.75) {
        // K-type: Orange
        r = 1.0; g = 0.7; b = 0.4;
      } else {
        // M-type: Red
        r = 1.0; g = 0.5; b = 0.3;
      }
      
      // Add some brightness variation
      const brightness = 0.3 + Math.random() * 0.7;
      colors[i * 3] = r * brightness;
      colors[i * 3 + 1] = g * brightness;
      colors[i * 3 + 2] = b * brightness;
    }
    
    return colors;
  }, [count]);

  // Create individual star meshes for better visibility
  const starMeshes = useMemo(() => {
    const meshes = [];
    for (let i = 0; i < Math.min(count, 500); i++) { // Limit for performance
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const r = colors[i * 3];
      const g = colors[i * 3 + 1];
      const b = colors[i * 3 + 2];
      
      meshes.push(
        <mesh
          key={i}
          position={[x, y, z]}
          renderOrder={-1000}
          raycast={() => null}
        >
          <sphereGeometry args={[1.5, 6, 6]} />
          <meshBasicMaterial
            color={new THREE.Color(r, g, b)}
            emissive={new THREE.Color(r * 0.3, g * 0.3, b * 0.3)}
          />
        </mesh>
      );
    }
    return meshes;
  }, [positions, colors, count]);

  return <group>{starMeshes}</group>;
}