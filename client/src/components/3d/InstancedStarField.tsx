import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { StarGenerator } from '../../lib/universe/StarGenerator';
import { usePerformance } from '../../lib/stores/usePerformance';

// Custom shader material for instanced stars with per-instance colors and glow
const InstancedStarMaterial = shaderMaterial(
  {
    map: null,
  },
  // Vertex shader
  `
    attribute vec3 instanceColor;
    varying vec3 vColor;
    varying vec2 vUv;
    
    void main() {
      vColor = instanceColor;
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment shader
  `
    uniform sampler2D map;
    varying vec3 vColor;
    varying vec2 vUv;
    
    void main() {
      vec4 texColor = texture2D(map, vUv);
      
      // Calculate color brightness (luminance)
      float brightness = dot(vColor, vec3(0.299, 0.587, 0.114));
      
      // Bright stars wash out the texture more, dim stars show more texture
      // Mix between texture and pure color based on brightness
      float colorDominance = 0.7 + brightness * 0.3; // 0.7 to 1.0 range
      
      vec3 finalColor = mix(vColor * texColor.rgb, vColor, colorDominance);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ InstancedStarMaterial });

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
  
  // Create material once
  const starMaterial = useMemo(() => {
    return new InstancedStarMaterial();
  }, []);
  
  // Create geometry with current quality setting
  const starGeometry = useMemo(() => {
    return new THREE.SphereGeometry(1, starGeometrySegments, starGeometrySegments);
  }, [starGeometrySegments]);
  
  // Update material texture when it loads
  useEffect(() => {
    if (starMaterial && starBumpMap) {
      (starMaterial as any).map = starBumpMap;
      starMaterial.needsUpdate = true;
    }
  }, [starMaterial, starBumpMap]);
  
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
      // Set matrices
      starData.matrices.forEach((matrix, i) => {
        instancedMeshRef.current!.setMatrixAt(i, matrix);
      });
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      
      // Set up instance colors using the built-in instanceColor attribute
      const count = starData.colors.length;
      const colors = new Float32Array(count * 3);
      
      starData.colors.forEach((color, i) => {
        colors[i * 3 + 0] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      });
      
      // Create the instanceColor buffer attribute
      const instanceColorAttr = new THREE.InstancedBufferAttribute(colors, 3);
      instancedMeshRef.current.instanceColor = instanceColorAttr;
      instancedMeshRef.current.instanceColor.needsUpdate = true;
      
      // Update the material's emissive color to multiply with instance colors
      if (instancedMeshRef.current.material) {
        const mat = instancedMeshRef.current.material as THREE.MeshStandardMaterial;
        mat.needsUpdate = true;
      }
    }
    
    if (interactionMeshRef.current) {
      interactionMatrices.forEach((matrix, i) => {
        interactionMeshRef.current!.setMatrixAt(i, matrix);
      });
      interactionMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [starData, interactionMatrices, starGeometry]);
  
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
      {/* Visual stars - instanced with interaction */}
      <instancedMesh 
        ref={instancedMeshRef}
        args={[undefined, undefined, stars.length]}
        frustumCulled={false}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[1, starGeometrySegments, starGeometrySegments]} />
        <meshStandardMaterial 
          emissive={new THREE.Color(1, 1, 1)}
          emissiveIntensity={2}
          emissiveMap={starBumpMap}
          toneMapped={false}
        />
      </instancedMesh>
      
      {/* Larger invisible hitboxes for easier clicking */}
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
