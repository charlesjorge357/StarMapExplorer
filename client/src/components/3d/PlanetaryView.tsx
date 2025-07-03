import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SurfaceFeatureMarker } from '../ui/SurfaceFeatures';
import { getPlanetTexturePath } from '../../hooks/useLazyTexture';
import { SystemGenerator } from '../../lib/universe/SystemGenerator';

// Note: PlanetaryView deliberately does not include NebulaScreenTint

interface PlanetaryViewProps {
  planet: any;
  selectedFeature: any;
  onFeatureClick: (feature: any) => void;
}

export function PlanetaryView({ planet, selectedFeature, onFeatureClick }: PlanetaryViewProps) {
  // Early return if planet is not provided or invalid
  if (!planet || !planet.type) {
    console.error('PlanetaryView: Invalid or missing planet data');
    return null;
  }

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

  // Load planet texture using the same system as SystemView
  const texturePath = useMemo(() => {
    if (!planet?.type) return '/textures/Barren/Barren_01-1024x512.png';
    const path = getPlanetTexturePath(planet.type, planet.textureIndex || 0);
    return path || '/textures/Barren/Barren_01-1024x512.png';
  }, [planet?.type, planet?.textureIndex]);

  // Generate consistent planet coloring using the same system as SystemView
  const planetMaterial = useMemo(() => {
    // Use computed values from SystemView if available, otherwise generate them
    let color = planet?.computedColor;
    let glow = planet?.computedGlow;
    let emissiveIntensity = planet?.computedEmissiveIntensity;

    // If no computed values exist (planet with features might be missing them), generate them
    if (!color || color === '#ffffff' || color === '#000000') {
      const planetSeed = (planet?.id || planet?.name || 'default').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      color = SystemGenerator.getPlanetColor(planet?.type, planetSeed);
    }

    // Generate glow and emissive intensity if missing
    if (!glow) {
      if (planet?.type === 'nuclear_world') {
        glow = '#ff2200';
        emissiveIntensity = 0.2;
      } else {
        glow = '#000000';
        emissiveIntensity = 0.1;
      }
    }

    return {
      color: color || '#ffffff',
      glow: glow || '#000000',
      emissiveIntensity: emissiveIntensity !== undefined ? emissiveIntensity : 0.1
    };
  }, [planet?.computedColor, planet?.computedGlow, planet?.computedEmissiveIntensity, planet?.type, planet?.id, planet?.name]);
  
  console.log(`Loading texture for ${planet?.name}: ${texturePath}`);
  
  // Always load a texture (with fallback)
  const texture = useTexture(texturePath);
  
  // Validate texture loading
  useEffect(() => {
    if (texture) {
      console.log('PlanetaryView: Texture loaded successfully for', planet?.name);
    } else {
      console.warn('PlanetaryView: No texture loaded for', planet?.name);
    }
  }, [texture, planet?.name]);

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
    if (!gl?.domElement || !mouseState.current) {
      console.warn('PlanetaryView: Missing gl.domElement or mouseState');
      return;
    }
    
    const canvas = gl.domElement;

    const handleMouseDown = (event: MouseEvent) => {
      try {
        if (!mouseState.current) return;
        mouseState.current.isDown = true;
        mouseState.current.lastX = event.clientX;
        mouseState.current.lastY = event.clientY;
        if (canvas) canvas.style.cursor = 'grabbing';
      } catch (error) {
        console.error('PlanetaryView handleMouseDown error:', error);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      try {
        if (!mouseState.current?.isDown || !groupRef.current) return;

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
      } catch (error) {
        console.error('PlanetaryView handleMouseMove error:', error);
      }
    };

    const handleMouseUp = () => {
      try {
        if (!mouseState.current) return;
        mouseState.current.isDown = false;
        if (canvas) canvas.style.cursor = 'grab';
      } catch (error) {
        console.error('PlanetaryView handleMouseUp error:', error);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      try {
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
      } catch (error) {
        console.error('PlanetaryView handleWheel error:', error);
      }
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
          color={planetMaterial.color}
          emissive={planet.type === 'nuclear_world' ? '#330000' : '#000000'}
          emissiveIntensity={planet.type === 'nuclear_world' ? 0.3 : 0}
          map={texture || undefined}
          roughness={planet.type === 'gas_giant' || planet.type === 'frost_giant' ? 0.1 : 0.8}
          metalness={planet.type === 'nuclear_world' ? 0.7 : 0.1}
          transparent={false}
          opacity={1.0}
        />
      </mesh>

      {/* Atmospheric glow for gas planets (matching SystemView) */}
      {(planet.type === 'gas_giant' || planet.type === 'frost_giant') && (
        <mesh position={[0, 0, 0]} raycast={() => null}>
          <sphereGeometry args={[planetRadius * 1.05, 32, 16]} />
          <meshBasicMaterial 
            color={planet.type === 'gas_giant' ? '#FF7043' : '#81C784'}
            transparent
            opacity={0.15}
          />
        </mesh>
      )}

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

      {/* Moons orbiting the planet */}
      {planet.moons && planet.moons.length > 0 && planet.moons.map((moon: any, moonIndex: number) => (
        <PlanetaryMoon
          key={`moon-${moonIndex}`}
          moon={moon}
          planetRadius={planetRadius}
          moonIndex={moonIndex}
        />
      ))}

      {/* Cosmic neighbors starfield background */}
      <CosmicNeighbors planetRadius={planetRadius} />

      {/* Subtle additional lighting for planetary detail (matches SystemView brightness) */}
      <ambientLight intensity={0.05} />
      <directionalLight 
        position={[planetRadius * 2, planetRadius * 2, planetRadius * 2]} 
        intensity={0.15}
        castShadow
      />
      
    </group>
  );
}

// Component for individual moons orbiting the planet
function PlanetaryMoon({ moon, planetRadius, moonIndex }: { moon: any; planetRadius: number; moonIndex: number }) {
  const moonRef = useRef<any>();
  
  // Moon visual properties based on index for variety
  const moonColors = ['#C0C0C0', '#D2B48C', '#8B7D6B', '#A0A0A0', '#B8860B'];
  const moonColor = moonColors[moonIndex % moonColors.length];
  
  useFrame((state) => {
    if (moonRef.current) {
      const time = state.clock.getElapsedTime();
      // Stagger moon phases and vary orbital speeds
      const baseSpeed = (moon.orbitSpeed || 0.5) * (0.8 + moonIndex * 0.3);
      const angle = time * baseSpeed + moonIndex * (Math.PI * 2 / Math.max(1, moonIndex + 1));
      
      // Scale orbit distance based on moon properties and add spacing between moons
      const baseOrbitDistance = planetRadius * 1.5;
      const moonOrbitMultiplier = (moon.orbitRadius || 2) + moonIndex * 0.8;
      const orbitDistance = baseOrbitDistance + moonOrbitMultiplier * planetRadius * 0.4;
      
      moonRef.current.position.x = Math.cos(angle) * orbitDistance;
      moonRef.current.position.z = Math.sin(angle) * orbitDistance;
      // Add slight orbital inclination for visual interest
      moonRef.current.position.y = Math.sin(angle * 0.2 + moonIndex) * orbitDistance * 0.05;
      
      // Rotate the moon
      moonRef.current.rotation.y = time * 0.1;
    }
  });

  const moonRadius = Math.max(0.3, (moon.radius || 0.3) * planetRadius * 0.08);

  return (
    <group>
      {/* Moon body */}
      <mesh ref={moonRef} raycast={() => null}>
        <sphereGeometry args={[moonRadius, 12, 12]} />
        <meshStandardMaterial 
          color={moonColor}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
      
      {/* Subtle moon glow */}
      <mesh ref={moonRef} raycast={() => null}>
        <sphereGeometry args={[moonRadius * 1.1, 8, 8]} />
        <meshBasicMaterial 
          color={moonColor}
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}

// Component for distant cosmic neighbors (parent star, other planets, distant stars)
function CosmicNeighbors({ planetRadius }: { planetRadius: number }) {
  const cosmicObjects = useMemo(() => {
    const objects = [];
    const skyboxRadius = planetRadius * 50;
    
    // Add the parent star (sun) - positioned at a realistic distance
    objects.push({
      id: 'parent-star',
      type: 'star',
      position: [skyboxRadius * 0.7, skyboxRadius * 0.2, skyboxRadius * 0.3] as [number, number, number],
      size: planetRadius * 0.8,
      color: '#FDB813', // Solar yellow
      brightness: 1.0,
      emissive: true
    });
    
    // Add other planets in the system as distant points
    const planetPositions = [
      [-skyboxRadius * 0.4, skyboxRadius * 0.1, skyboxRadius * 0.8],
      [skyboxRadius * 0.6, -skyboxRadius * 0.3, skyboxRadius * 0.7],
      [-skyboxRadius * 0.8, skyboxRadius * 0.5, -skyboxRadius * 0.2],
      [skyboxRadius * 0.3, skyboxRadius * 0.8, -skyboxRadius * 0.5]
    ];
    
    planetPositions.forEach((pos, index) => {
      objects.push({
        id: `planet-${index}`,
        type: 'planet',
        position: pos as [number, number, number],
        size: Math.random() * 0.3 + 0.1,
        color: ['#FF7043', '#81C784', '#D4A574', '#9ACD32'][index % 4],
        brightness: 0.6,
        emissive: false
      });
    });
    
    // Add distant stars
    for (let i = 0; i < 150; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);
      
      const x = skyboxRadius * Math.sin(theta) * Math.cos(phi);
      const y = skyboxRadius * Math.sin(theta) * Math.sin(phi);
      const z = skyboxRadius * Math.cos(theta);
      
      objects.push({
        id: `star-${i}`,
        type: 'distant-star',
        position: [x, y, z] as [number, number, number],
        size: Math.random() * 0.2 + 0.05,
        brightness: Math.random() * 0.4 + 0.1,
        color: ['#ffffff', '#ffffcc', '#ffcccc', '#ccccff'][Math.floor(Math.random() * 4)],
        emissive: false
      });
    }
    
    return objects;
  }, [planetRadius]);

  return (
    <group>
      {cosmicObjects.map((obj) => (
        <mesh key={obj.id} position={obj.position} raycast={() => null}>
          <sphereGeometry args={[obj.size, obj.type === 'star' ? 16 : 8, obj.type === 'star' ? 16 : 8]} />
          {obj.emissive ? (
            <meshStandardMaterial 
              color={obj.color}
              emissive={obj.color}
              emissiveIntensity={0.5}
            />
          ) : (
            <meshBasicMaterial 
              color={obj.color}
              transparent
              opacity={obj.brightness}
            />
          )}
          {/* Add corona effect for the parent star */}
          {obj.type === 'star' && (
            <mesh raycast={() => null}>
              <sphereGeometry args={[obj.size * 1.5, 12, 12]} />
              <meshBasicMaterial 
                color={obj.color}
                transparent
                opacity={0.2}
              />
            </mesh>
          )}
        </mesh>
      ))}
    </group>
  );
}