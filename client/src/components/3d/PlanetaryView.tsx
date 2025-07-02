import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SurfaceFeatureMarker } from '../ui/SurfaceFeatures';

// Note: PlanetaryView deliberately does not include NebulaScreenTint

interface PlanetaryViewProps {
  planet: any;
  selectedFeature: any;
  onFeatureClick: (feature: any) => void;
}

export function PlanetaryView({ planet, selectedFeature, onFeatureClick }: PlanetaryViewProps) {
  const [isHeld, setIsHeld] = useState(false);
  console.log('PlanetaryView: Rendering Google Earth-like view for', planet?.name);
  console.log('Planet computed properties:', {
    computedColor: planet?.computedColor,
    computedGlow: planet?.computedGlow,
    computedEmissiveIntensity: planet?.computedEmissiveIntensity
  });

  const { camera, gl } = useThree();
  const planetMeshRef = useRef<THREE.Mesh>(null);
  const featuresGroupRef = useRef<THREE.Group>(null);
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
      'acidic_world': ['/textures/venus_atmosphere.jpg', '/textures/venus_surface.jpg'],
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

  // Mouse controls for globe rotation
  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = (event: MouseEvent) => {
      mouseState.current.isDown = true;
      mouseState.current.lastX = event.clientX;
      mouseState.current.lastY = event.clientY;
      canvas.style.cursor = 'grabbing';
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseState.current.isDown || !groupRef.current) return;

      const deltaX = event.clientX - mouseState.current.lastX;
      const deltaY = event.clientY - mouseState.current.lastY;

      // Rotate globe based on mouse movement
      mouseState.current.rotationY += deltaX * 0.005;
      mouseState.current.rotationX += deltaY * 0.005;

      // Clamp vertical rotation to prevent flipping
      mouseState.current.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseState.current.rotationX));

      // Apply rotations to planet group
      groupRef.current.rotation.y = mouseState.current.rotationY;
      groupRef.current.rotation.x = mouseState.current.rotationX;

      mouseState.current.lastX = event.clientX;
      mouseState.current.lastY = event.clientY;
    };

    const handleMouseUp = () => {
      mouseState.current.isDown = false;
      canvas.style.cursor = 'grab';
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      // Zoom in/out by moving camera
      const zoomSpeed = 0.1;
      const direction = event.deltaY > 0 ? 1 : -1;
      const currentDistance = camera.position.length();
      const minDistance = planetRadius * 1.2;
      const maxDistance = planetRadius * 5;

      const newDistance = Math.max(minDistance, Math.min(maxDistance, currentDistance + direction * zoomSpeed * planetRadius));

      camera.position.normalize().multiplyScalar(newDistance);
      camera.updateMatrix();
      camera.updateMatrixWorld(true);
    };

    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Set initial cursor
    canvas.style.cursor = 'grab';

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.style.cursor = 'auto';
    };
  }, [gl, camera, planetRadius]);

  // Planet and features rotation animation
  useFrame((state) => {
    if (!isHeld) {
      // Rotate planet mesh
      if (planetMeshRef.current) {
        planetMeshRef.current.rotation.y += 0.001;
      }
      // Rotate features group to match planet
      if (featuresGroupRef.current) {
        featuresGroupRef.current.rotation.y += 0.001;
      }
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
      <mesh ref={planetMeshRef}
        onPointerDown={() => setIsHeld(true)}
        onPointerUp={() => setIsHeld(false)}
        onPointerLeave={() => setIsHeld(false)} // in case the user drags out of bounds
        >
        <sphereGeometry args={[planetRadius, 128, 64]} />
        <meshStandardMaterial
          color={
            // Always use computed values from SystemView when available
            planet.computedColor || '#ffffff'
          }
          emissive={
            // Always use computed glow from SystemView when available
            planet.computedGlow || '#000000'
          }
          emissiveIntensity={
            // Always use computed emissive intensity from SystemView when available
            planet.computedEmissiveIntensity !== undefined ? planet.computedEmissiveIntensity : 0.1
          }
          map={texture}
          roughness={planet.type === 'gas_giant' || planet.type === 'frost_giant' ? 0.1 : 0.8}
          metalness={planet.type === 'nuclear_world' ? 0.7 : 0.1}
          transparent={false}
          opacity={1.0}
        />
      </mesh>

      {/* Surface Features - grouped to rotate with planet */}
      <group ref={featuresGroupRef}>
        {planet.surfaceFeatures && planet.surfaceFeatures.map((feature: any) => (
          <SurfaceFeatureMarker
            key={feature.id}
            feature={feature}
            planetRadius={planetRadius}
            onFeatureClick={onFeatureClick}
          />
        ))}
      </group>

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