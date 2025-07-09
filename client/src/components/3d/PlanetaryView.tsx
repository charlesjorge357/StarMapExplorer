import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SurfaceFeatureMarker } from '../ui/SurfaceFeatures';
import { getPlanetTexturePath } from '../../hooks/useLazyTexture';
import { SystemGenerator } from '../../lib/universe/SystemGenerator';
import { NebulaScreenTint } from './NebulaScreenTint';

interface PlanetaryViewProps {
  planet: any;
  selectedFeature: any;
  onFeatureClick: (feature: any) => void;
  system?: any; // Optional system data for asteroid belts
}

// Component for planet rings in planetary view
function PlanetaryRings({ rings, planetRadius }: { rings: any[]; planetRadius: number }) {
  return (
    <group>
      {rings.map((ring: any, index: number) => {
        // Generate EXACT same deterministic rotation angles as SystemView
        const ringHash = ring.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const rotationX = ((ringHash % 100) / 100 - 0.5) * 0.4; // Deterministic tilt up to ±0.2 radians
        const rotationY = ((ringHash * 7) % 360) * (Math.PI / 180); // Deterministic rotation around Y axis  
        const rotationZ = (((ringHash * 13) % 100) / 100 - 0.5) * 0.4; // Deterministic tilt around Z axis
        
        return (
          <mesh 
            key={`ring-${index}`} 
            rotation={[Math.PI / 2 + rotationX, rotationY, rotationZ]} // EXACT same formula as SystemView
            raycast={() => null}
          >
            <ringGeometry 
              args={[
                planetRadius * ring.innerRadius * 1.2, 
                planetRadius * ring.outerRadius * 1.2, 
                64
              ]} 
            />
            <meshBasicMaterial 
              color={ring.color}
              transparent 
              opacity={ring.density * 0.6}
              side={2} // THREE.DoubleSide
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function PlanetaryView({ planet, selectedFeature, onFeatureClick, system }: PlanetaryViewProps) {
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

  // Camera lock state for surface feature tracking
  const [isFeatureTracking, setIsFeatureTracking] = useState(false);
  const featureTrackingRef = useRef<any>(null);
  const trackingDistanceRef = useRef<number>(0);

  // Planet radius for close-up view
  const planetRadius = planet?.radius ? planet.radius * 15 : 10;

  // Expose feature tracking function globally (similar to homeToPlanet in SystemView)
  useEffect(() => {
    (window as any).homeToFeature = (feature: any, distance: number) => {
      if (feature) {
        setIsFeatureTracking(true);
        featureTrackingRef.current = feature;
        trackingDistanceRef.current = distance || planetRadius * 0.9;
        console.log(`Starting feature tracking for ${feature.name}`);
      } else {
        setIsFeatureTracking(false);
        featureTrackingRef.current = null;
        console.log('Stopping feature tracking');
      }
    };

    return () => {
      delete (window as any).homeToFeature;
    };
  }, [planetRadius]);

  // Keyboard controls for feature tracking (Enter key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && selectedFeature) {
        event.preventDefault();

        if (isFeatureTracking) {
          // Disable tracking
          if ((window as any).homeToFeature) {
            (window as any).homeToFeature(null, 0);
          }
        } else {
          // Enable tracking for selected feature
          if ((window as any).homeToFeature) {
            (window as any).homeToFeature(selectedFeature, planetRadius * 0.9);
          }
        }
        setIsFeatureTracking(!isFeatureTracking); // Toggle the state
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFeature, isFeatureTracking, planetRadius]);

  // Generate nebulas for atmospheric effect
  const nebulas = useMemo(() => {
    return [{
      id: 'planetary-nebula',
      name: 'Atmospheric Nebula',
      position: [0, 0, 0] as [number, number, number],
      radius: planetRadius * 100,
      color: planet.type === 'gas_giant' ? '#FF7043' : 
             planet.type === 'frost_giant' ? '#81C784' :
             planet.type === 'nuclear_world' ? '#FF4500' : '#4A90E2',
      composition: 'hydrogen',
      type: 'emission' as const
    }];
  }, [planetRadius, planet.type]);

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
        if (!mouseState.current || isFeatureTracking) return; // Disable mouse during tracking
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
        if (!mouseState.current?.isDown || !groupRef.current || isFeatureTracking) return; // Disable mouse during tracking

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
  }, [gl, camera, planetRadius, isFeatureTracking]);

  // Handle feature tracking camera positioning
  useFrame((state, delta) => {
    // Handle feature tracking camera positioning
    if (isFeatureTracking && featureTrackingRef.current && featuresGroupRef.current) {
      const feature = featureTrackingRef.current;
      
      // Find the actual rendered SurfaceFeatureMarker mesh in the scene
      let featureMesh = null;
      featuresGroupRef.current.traverse((child: any) => {
        // Look for mesh with matching feature data
        if (child.userData?.featureId === feature.id || 
            (child.type === 'Mesh' && child.userData?.feature?.id === feature.id)) {
          featureMesh = child;
        }
      });
      
      if (featureMesh) {
        // Get the actual world position of the rendered feature
        const worldFeaturePosition = new THREE.Vector3();
        featureMesh.getWorldPosition(worldFeaturePosition);
        
        // Calculate camera position - offset from the feature
        const distance = trackingDistanceRef.current;
        
        // Direction from planet center to feature (surface normal)
        const surfaceNormal = worldFeaturePosition.clone().normalize();
        
        // Position camera offset from the feature looking at it
        const cameraOffset = surfaceNormal.clone().multiplyScalar(distance);
        const targetCameraPosition = worldFeaturePosition.clone().add(cameraOffset);
        
        // Smoothly interpolate camera position
        camera.position.lerp(targetCameraPosition, delta * 3);
        
        // Look directly at the feature
        camera.lookAt(worldFeaturePosition);
        camera.updateMatrix();
        camera.updateMatrixWorld(true);
        
        // Debug logging (occasional)
        if (Math.random() < 0.005) {
          console.log('Feature tracking debug (using actual rendered mesh position):', {
            featureName: feature.name,
            featureId: feature.id,
            worldFeaturePos: worldFeaturePosition,
            cameraPos: camera.position,
            distance: worldFeaturePosition.distanceTo(camera.position)
          });
        }
      } else {
        console.warn('Could not find rendered feature mesh for tracking:', feature.name, feature.id);
        // Fallback: disable tracking if we can't find the mesh
        setIsFeatureTracking(false);
        featureTrackingRef.current = null;
      }
    }

    // Planet and features rotation (only if not being held by mouse)
    if (!isHeld && !isFeatureTracking) {
      // Rotate planet mesh
      if (planetMeshRef.current) {
        planetMeshRef.current.rotation.y += 0.001;
      }
      // Rotate features group to match planet
      if (featuresGroupRef.current) {
        featuresGroupRef.current.rotation.y += 0.001;
      }
    } else if (!isHeld && isFeatureTracking) {
      // Still rotate planet even when tracking (camera moves with it)
      if (planetMeshRef.current) {
        planetMeshRef.current.rotation.y += 0.001;
      }
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

      {/* Planet Rings - render around this planet */}
      {planet.rings && planet.rings.length > 0 && (
        <PlanetaryRings rings={planet.rings} planetRadius={planetRadius} />
      )}

      {/* Moons orbiting the planet */}
      {planet.moons && planet.moons.length > 0 && planet.moons.map((moon: any, moonIndex: number) => (
        <PlanetaryMoon
          key={`moon-${moonIndex}`}
          moon={moon}
          planetRadius={planetRadius}
          moonIndex={moonIndex}
          planetId={planet.id}
        />
      ))}

      {/* Cosmic neighbors starfield background */}
      <CosmicNeighbors planetRadius={planetRadius} system={system} planet={planet} />

      {/* Asteroid belts from the system */}
      {system?.asteroidBelts && system.asteroidBelts.length > 0 && (
        <AsteroidBelts belts={system.asteroidBelts} planetRadius={planetRadius} />
      )}

      {/* Removed nebula screen tint to prevent planet color tinting */}

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
function PlanetaryMoon({ moon, planetRadius, moonIndex, planetId }: { moon: any; planetRadius: number; moonIndex: number; planetId: string }) {
  const moonRef = useRef<any>();

  // Generate varied moon colors based on planet and moon index (same system as SystemView)
  const moonColor = useMemo(() => {
    const seededRandom = (seed: number): number => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const seed = planetId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const moonSeed = seed + moonIndex * 1000;
    
    // Create varied moon colors - some rocky, some icy, some metallic
    const moonTypes = [
      '#8B7355', // Rocky brown
      '#C0C0C0', // Silver metallic  
      '#E6E6FA', // Ice blue-white
      '#D2B48C', // Sandy tan
      '#778899', // Slate gray
      '#DDA0DD', // Light purple (rare minerals)
      '#F5DEB3', // Wheat (dusty)
      '#B22222'  // Iron red
    ];
    
    const colorIndex = Math.floor(seededRandom(moonSeed) * moonTypes.length);
    return moonTypes[colorIndex];
  }, [planetId, moonIndex]);

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

// Component for asteroid belts in planetary view
function AsteroidBelts({ belts, planetRadius }: { belts: any[]; planetRadius: number }) {
  return (
    <group>
      {belts.map((belt: any, beltIndex: number) => (
        <AsteroidBelt key={belt.id} belt={belt} planetRadius={planetRadius} beltIndex={beltIndex} />
      ))}
    </group>
  );
}

// Individual asteroid belt component
function AsteroidBelt({ belt, planetRadius, beltIndex }: { belt: any; planetRadius: number; beltIndex: number }) {
  const asteroidData = useMemo(() => {
    const asteroidCount = Math.min(25, belt.asteroidCount || 25); // Limit asteroids for performance
    const asteroids = [];

    for (let i = 0; i < asteroidCount; i++) {
      // Use deterministic generation based on belt ID and asteroid index
      const seed1 = (beltIndex * 1000 + i * 73 + 37) % 1000 / 1000;
      const seed2 = (beltIndex * 1000 + i * 149 + 83) % 1000 / 1000;
      const seed3 = (beltIndex * 1000 + i * 211 + 127) % 1000 / 1000;

      const baseAngle = seed1 * Math.PI * 2;
      const radius = (belt.innerRadius + seed2 * (belt.outerRadius - belt.innerRadius)) * planetRadius * 5; // Scale relative to planet
      const size = (0.3 + seed3 * 0.8) * planetRadius * 0.02; // Size relative to planet
      const yOffset = (seed1 - 0.5) * planetRadius * 0.5; // Y variation
      const orbitSpeed = 0.001 + (radius * 0.000001); // Very slow orbit

      asteroids.push({
        id: i,
        baseAngle,
        radius,
        size,
        yOffset,
        orbitSpeed
      });
    }

    return asteroids;
  }, [belt.id, beltIndex, planetRadius]);

  const groupRef = useRef<any>();

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.children.forEach((child: any, i: number) => {
        const asteroid = asteroidData[i];
        if (asteroid) {
          const angle = asteroid.baseAngle + time * asteroid.orbitSpeed;
          const x = Math.cos(angle) * asteroid.radius;
          const z = Math.sin(angle) * asteroid.radius;
          child.position.set(x, asteroid.yOffset, z);
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {asteroidData.map((asteroid) => (
        <mesh key={asteroid.id} raycast={() => null}>
          <sphereGeometry args={[asteroid.size, 6, 6]} />
          <meshStandardMaterial 
            color="#999999" 
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// Helper function to get star color based on spectral class (same as SystemView)
function getStarColor(spectralClass: string): string {
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
}

// Component for distant cosmic neighbors (parent star, other planets, distant stars)
function CosmicNeighbors({ planetRadius, system, planet }: { planetRadius: number; system?: any; planet?: any }) {
  const cosmicObjects = useMemo(() => {
    const objects = [];

    // Use the same orbital distance calculation as SystemView
    // In SystemView: planetRef.current.position.x = Math.cos(angle) * planet.orbitRadius * 2
    const starDistance = planet?.orbitRadius ? planet.orbitRadius * 20 : planetRadius * 50;

    // Add the parent star (sun) - positioned at the same orbital distance used in SystemView
    // Use actual star data from system if available
    const star = system?.star;
    // Use logarithmic scaling to prevent extremely large stars from overwhelming the view
    const starSize = star?.radius ? Math.log((star.radius * 1.5) + 1) * 8 + 12 : planetRadius * 0.8;
    const starColor = star ? getStarColor(star.spectralClass) : '#FDB813';
    
    // Position star at the orbital distance, offset in a direction
    const starAngle = Math.PI * 0.3; // Fixed angle for consistent positioning
    objects.push({
      id: 'parent-star',
      type: 'star',
      position: [
        Math.cos(starAngle) * starDistance,
        starDistance * 0.1, // Small Y offset for 3D effect
        Math.sin(starAngle) * starDistance
      ] as [number, number, number],
      size: starSize * 0.15, // Scale down for distant appearance
      color: starColor,
      brightness: 1.0,
      emissive: true
    });

    // Add other planets in the system as distant points using realistic orbital distances
    if (system?.planets) {
      system.planets.forEach((otherPlanet: any, index: number) => {
        // Skip the current planet we're viewing
        if (otherPlanet.id === planet?.id) return;
        
        // Use actual orbital distance with some angular offset
        const orbitDistance = otherPlanet.orbitRadius * 2;
        const angle = index * (Math.PI * 2 / Math.max(1, system.planets.length - 1)); // Distribute around
        
        objects.push({
          id: `planet-${otherPlanet.id}`,
          type: 'planet',
          position: [
            Math.cos(angle) * orbitDistance,
            orbitDistance * 0.05, // Small Y offset
            Math.sin(angle) * orbitDistance
          ] as [number, number, number],
          size: otherPlanet.radius * 0.6 * 0.2, // Scale based on actual radius, but smaller for distance
          color: otherPlanet.computedColor || ['#FF7043', '#81C784', '#D4A574', '#9ACD32', '#FF4500', '#006994'][index % 6],
          brightness: 0.9,
          emissive: false
        });
      });
    }

    // Add asteroid belts as visible clusters using orbital distance scaling
    const beltBaseDistance = starDistance * 1.5; // Position belts further out than the star
    const beltPositions = [
      [beltBaseDistance * 0.3, 0, beltBaseDistance * 0.3],
      [-beltBaseDistance * 0.5, beltBaseDistance * 0.1, -beltBaseDistance * 0.4],
      [beltBaseDistance * 0.4, -beltBaseDistance * 0.2, beltBaseDistance * 0.6]
    ];

    beltPositions.forEach((pos, index) => {
      // Create multiple asteroids in each belt
      for (let i = 0; i < 25; i++) {
        const spread = beltBaseDistance * 0.15;
        const offsetX = (Math.random() - 0.5) * spread;
        const offsetY = (Math.random() - 0.5) * spread * 0.2;
        const offsetZ = (Math.random() - 0.5) * spread;

        objects.push({
          id: `asteroid-${index}-${i}`,
          type: 'asteroid',
          position: [pos[0] + offsetX, pos[1] + offsetY, pos[2] + offsetZ] as [number, number, number],
          size: Math.random() * 0.8 + 0.3, // Much larger asteroids
          color: '#8B7355', // Rocky brown
          brightness: 0.8, // Brighter
          emissive: false
        });
      }
    });

    // Add distant stars using orbital distance scaling
    const distantStarRadius = starDistance * 3; // Much further out than the star
    for (let i = 0; i < 150; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);

      const x = distantStarRadius * Math.sin(theta) * Math.cos(phi);
      const y = distantStarRadius * Math.sin(theta) * Math.sin(phi);
      const z = distantStarRadius * Math.cos(theta);

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
  }, [planetRadius, system, planet]);

  return (
    <group>
      {cosmicObjects.map((obj) => (
        <CosmicObject key={obj.id} obj={obj} />
      ))}
    </group>
  );
}

// Individual cosmic object component with animation
function CosmicObject({ obj }: { obj: any }) {
  const meshRef = useRef<any>();

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation for planets and asteroids
      if (obj.type === 'planet' || obj.type === 'asteroid') {
        meshRef.current.rotation.y += 0.001;
      }
      // Gentle pulsing for stars
      if (obj.type === 'star') {
        const pulse = Math.sin(state.clock.getElapsedTime() * 2) * 0.1 + 1;
        meshRef.current.scale.setScalar(pulse);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={obj.position} raycast={() => null}>
      <sphereGeometry args={[obj.size, obj.type === 'star' ? 16 : 8, obj.type === 'star' ? 16 : 8]} />
      {obj.emissive ? (
        <meshStandardMaterial 
          color={obj.color}
          emissive={obj.color}
          emissiveIntensity={obj.type === 'star' ? 2.0 : 0.5}
          toneMapped={obj.type === 'star' ? false : true}
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
  );
}