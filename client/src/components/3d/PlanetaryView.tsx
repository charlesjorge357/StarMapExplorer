import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';



// Note: PlanetaryView deliberately does not include NebulaScreenTint

interface PlanetaryViewProps {
  planet: any;
  selectedFeature: any;
  onFeatureClick: (feature: any) => void;
}

export function PlanetaryView({ planet }: PlanetaryViewProps) {
  const [isHeld, setIsHeld] = useState(false);
  console.log('PlanetaryView: Rendering Google Earth-like view for', planet?.name);
  console.log('Planet computed properties:', {
    computedColor: planet?.computedColor,
    computedGlow: planet?.computedGlow,
    computedEmissiveIntensity: planet?.computedEmissiveIntensity
  });

  const { camera, gl } = useThree();
  const planetRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Planet radius for close-up view
  const planetRadius = planet?.radius ? planet.radius * 15 : 10;

  // Get texture path for planet type
  const getTextureForPlanet = (planetType: string, textureIndex: number = 0) => {
    const texturePaths: Record<string, string[]> = {
      'gas_giant': ['/textures/jupiter.jpg'],
      'frost_giant': ['/textures/uranus.jpg', '/textures/neptune.jpg'],
      'arid_world': ['/textures/mars.jpg', '/textures/venus_surface.jpg'],
      'verdant_world': ['/textures/terrestrial1.jpg', '/textures/terrestrial2.jpg', '/textures/terrestrial3.png'],
      'acidic_world': ['/textures/venus_atmosphere.jpg'],
      'nuclear_world': ['/textures/ceres.jpg'],
      'ocean_world': ['/textures/ocean.jpg'],
      'dead_world': ['/textures/mercury.jpg', '/textures/moon.jpg', '/textures/eris.jpg']
    };

    const paths = texturePaths[planetType] || texturePaths['dead_world'];
    return paths[textureIndex % paths.length];
  };



  // Load planet texture
  let texture;
  try {
    const texturePath = getTextureForPlanet(planet.type, planet.textureIndex || 0);
    console.log(`Loading texture for ${planet.name}: ${texturePath}`);
    texture = useTexture(texturePath);
  } catch (error) {
    console.error(`Failed to load texture for ${planet?.type}:`, error);
    texture = null;
  }

  // Mouse interaction state
  const mouseState = useRef({
    isDown: false,
    lastX: 0,
    lastY: 0,
    rotationX: 0,
    rotationY: 0
  });

  // Set up camera for close planetary view
  useEffect(() => {
    if (camera && planet) {
      console.log(`Setting up Google Earth camera for ${planet.name}`);

      // Position camera close to planet surface
      const distance = planetRadius * 1.8;
      camera.position.set(0, 0, distance);
      camera.lookAt(0, 0, 0);
      camera.updateMatrix();
      camera.updateMatrixWorld(true);

      // Reset rotation state
      mouseState.current.rotationX = 0;
      mouseState.current.rotationY = 0;
    }
  }, [camera, planet, planetRadius]);

  // Keyboard controls for zoom only (W/S keys)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'w' || event.key === 'W') {
        event.preventDefault();
        // Zoom in
        const currentDistance = camera.position.length();
        const minDistance = planetRadius * 1.2;
        const zoomSpeed = 0.05;
        const newDistance = Math.max(minDistance, currentDistance - zoomSpeed * planetRadius);
        
        camera.position.normalize().multiplyScalar(newDistance);
        camera.updateMatrix();
        camera.updateMatrixWorld(true);
      } else if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        // Zoom out
        const currentDistance = camera.position.length();
        const maxDistance = planetRadius * 5;
        const zoomSpeed = 0.05;
        const newDistance = Math.min(maxDistance, currentDistance + zoomSpeed * planetRadius);
        
        camera.position.normalize().multiplyScalar(newDistance);
        camera.updateMatrix();
        camera.updateMatrixWorld(true);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [camera, planetRadius]);

  // Planet rotation animation
  useFrame((state) => {
    if (planetRef.current && !isHeld) {
      // Slow automatic rotation
      planetRef.current.rotation.y += 0.001;
    }
  });

  if (!planet) {
    console.error('PlanetaryView: No planet data provided');
    return null;
  }

  console.log(`Rendering Google Earth view for ${planet.name} with radius ${planetRadius}`);

  return (
    <group ref={groupRef}>
      {/* Planet sphere with high detail */}
      <mesh ref={planetRef}
        onPointerDown={() => setIsHeld(true)}
        onPointerUp={() => setIsHeld(false)}
        onPointerLeave={() => setIsHeld(false)} // in case the user drags out of bounds
        >
        <sphereGeometry args={[planetRadius, 128, 64]} />
        <meshStandardMaterial
          color={
            // Use computed values from SystemView if available, otherwise fallback
            planet.computedColor || (texture ? '#ffffff' : '#666666')
          }
          emissive={
            // Use computed glow from SystemView if available, otherwise fallback
            planet.computedGlow || '#000000'
          }
          emissiveIntensity={
            planet.computedEmissiveIntensity !== undefined ? planet.computedEmissiveIntensity : (texture ? 0.1 : 0.2)
          }
          map={texture}
          roughness={planet.type === 'gas_giant' || planet.type === 'frost_giant' ? 0.1 : 0.8}
          metalness={planet.type === 'nuclear_world' ? 0.7 : 0.1}
          transparent={false}
          opacity={1.0}
        />
      </mesh>



      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[planetRadius * 2, planetRadius * 2, planetRadius * 2]} 
        intensity={0.7}
        castShadow
      />
      
    </group>
  );
}