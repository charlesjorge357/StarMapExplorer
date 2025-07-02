import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useUniverse } from '../../lib/stores/useUniverse';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { StarGenerator } from '../../lib/universe/StarGenerator';
import { NebulaScreenTint } from './NebulaScreenTint';
import { SystemNebulaSkybox } from './SystemNebulaSkybox';
import { StarSkybox } from './StarSkybox';

function MoonMesh({ 
  moon, 
  planetRef,
  planetRadius,
  moonIndex 
}: { 
  moon: any; 
  planetRef: React.RefObject<any>;
  planetRadius: number;
  moonIndex: number;
}) {
  const moonRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (moonRef.current && planetRef.current) {
      // Use same time calculation as planets for consistency
      const time = Date.now() * 0.0001;
      const angle = time * moon.orbitSpeed * 10 + moonIndex * (Math.PI * 2 / 8); // Apply planetary offset pattern

      // Moon orbit relative to planet's current position
      const moonX = planetRef.current.position.x + Math.cos(angle) * moon.orbitRadius * planetRadius * 1.05;
      const moonZ = planetRef.current.position.z + Math.sin(angle) * moon.orbitRadius * planetRadius * 1.05;
      const moonY = planetRef.current.position.y;

      moonRef.current.position.set(moonX, moonY, moonZ);
    }
  });

  return (
    <mesh ref={moonRef}>
      <sphereGeometry args={[moon.radius * planetRadius * 0.15, 8, 8]} />
      <meshStandardMaterial 
        color="#888888" 
        emissive="#222222"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}


// Helper functions for planet materials
function getPlanetColor(type: string, planetId?: string): string {
  // Use the same color variation system as SystemGenerator
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const seed = (planetId || 'default').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variation = (seededRandom(seed + 2000) - 0.5) * 0.3;

  const baseColors: Record<string, [number, number, number]> = {
    gas_giant: [30, 80, 50],
    frost_giant: [220, 60, 60],
    arid_world: [30, 50, 45],
    verdant_world: [125, 70, 45],
    acidic_world: [55, 90, 60],
    nuclear_world: [10, 90, 50],
    ocean_world: [210, 80, 55],
    dead_world: [0, 0, 40]
  };

  let [h, s, l] = baseColors[type] || [0, 0, 50];
  h = (h + variation * 360 + 360) % 360;
  return `hsl(${Math.round(h)}, ${s}%, ${l}%)`;
}

function getPlanetTexture(type: string, planetTextures: any, textureIndex: number): any {
  const textures = planetTextures[type as keyof typeof planetTextures];
  if (!textures) return undefined;

  // Handle array of textures (use stored texture index)
  if (Array.isArray(textures)) {
    return textures[textureIndex % textures.length];
  }

  // Single texture
  return textures;
}

// Helper function to get texture for a planet - moved to top level
function getPlanetTextureForMaterial(planetType: string, planetTextures: any, planetId: string) {
  const textures = planetTextures[planetType as keyof typeof planetTextures];
  if (!textures) return undefined;

  // Handle array of textures (deterministic selection based on planet ID)
  if (Array.isArray(textures)) {
    if (textures.length === 0) return undefined;
    // Use planet ID hash for consistent texture selection
    const hash = planetId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return textures[hash % textures.length];
  }

  // Single texture
  return textures;
}



function getPlanetGlow(type: string, planetId?: string): string {
  // Generate varied glow colors based on planet type and ID
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const seed = (planetId || 'default').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variation = (seededRandom(seed + 3000) - 0.5) * 0.2; // Less variation for glow

  const baseGlows: Record<string, [number, number, number]> = {
    gas_giant: [15, 85, 55],   // Orange-red
    frost_giant: [200, 70, 70], // Blue
    arid_world: [45, 75, 50],   // Gold
    verdant_world: [200, 70, 70],   // No glow for textured verdant worlds
    acidic_world: [35, 90, 55], // Orange
    nuclear_world: [0, 90, 45], // Red
    ocean_world: [210, 85, 60], // Blue
    dead_world: [0, 0, 35]      // Dark gray
  };

  let [h, s, l] = baseGlows[type] || [0, 0, 30];
  if (type === 'verdant_world') return '#000000'; // No glow for verdant worlds

  h = (h + variation * 60 + 360) % 360;
  return `hsl(${Math.round(h)}, ${s}%, ${l}%)`;
}



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

interface SystemViewProps {
  system: any;
  selectedPlanet: any;
  onPlanetClick: (planet: any) => void;
}

// Selection ring component that follows the planet
function SelectionRing({ planet, isSelected, index }: { planet: any; isSelected: boolean; index: number }) {
  const ringRef = useRef<any>();

  useFrame((state) => {
    if (ringRef.current && isSelected) {
      // Match the planet's orbital position exactly
      const time = state.clock.getElapsedTime() * 0.1;
      const angle = time * planet.orbitSpeed + index * (Math.PI * 2 / 8);
      ringRef.current.position.x = Math.cos(angle) * planet.orbitRadius * 2;
      ringRef.current.position.z = Math.sin(angle) * planet.orbitRadius * 2;

      // Pulse effect
      const pulse = 1.0 + Math.sin(state.clock.getElapsedTime() * 3) * 0.2;
      ringRef.current.scale.setScalar(pulse);
    }
  });

  if (!isSelected) return null;

  return (
    <mesh ref={ringRef}>
      <sphereGeometry args={[planet.radius * 0.8 + 0.5, 16, 16]} />  
      <meshBasicMaterial 
        color="#ffffff"
        transparent
        opacity={0.3}
        wireframe
      />
    </mesh>
  );
}

function PlanetMesh({ 
  planet, 
  index, 
  isSelected, 
  onPlanetClick, 
  planetTextures
}: { 
  planet: any; 
  index: number; 
  isSelected: boolean;
  onPlanetClick: (planet: any) => void;
  planetTextures: any;
}) {
  const planetRef = useRef<any>();

  useFrame((state) => {
    if (planetRef.current) {
      // Use Date.now() for consistent timing across components
      const time = Date.now() * 0.0001;
      const angle = time * planet.orbitSpeed + index * (Math.PI * 2 / 8);
      planetRef.current.position.x = Math.cos(angle) * planet.orbitRadius * 2;
      planetRef.current.position.z = Math.sin(angle) * planet.orbitRadius * 2;

      // Axis rotation using frame time
      planetRef.current.rotation.y = state.clock.getElapsedTime() * (planet.rotationSpeed || 0.01) * 10;
    }
  });

  // Compute material properties and store them on the planet object for reuse in planetary view
  const hasTexture = getPlanetTexture(planet.type, planetTextures, planet.textureIndex || 0);
  const isVerdantWithTexture = planet.type === 'verdant_world' && hasTexture;

  const materialColor = isVerdantWithTexture
    ? '#ffffff'  // Pure white for verdant worlds to show true texture colors
    : hasTexture 
      ? '#ffffff'  // White for all textured planets
      : getPlanetColor(planet.type, planet.id || planet.name);  // Use seeded color variation

  const materialEmissive = isVerdantWithTexture
    ? '#000000'  // No emissive glow for verdant worlds with textures
    : getPlanetGlow(planet.type, planet.id || planet.name);

  const materialEmissiveIntensity = isVerdantWithTexture
    ? 0.0  // No emissive intensity for verdant worlds
    : hasTexture ? 0.1 : 0.2;

  // Store these computed values directly on the planet object for planetary view
  planet.computedColor = materialColor;
  planet.computedGlow = materialEmissive;
  planet.computedEmissiveIntensity = materialEmissiveIntensity;

 const handleClick = (event: any) => {
    event.stopPropagation();
    if (isSelected) {
      // Stop orbital tracking when deselecting
      if ((window as any).homeToPlanet) {
        (window as any).homeToPlanet(new THREE.Vector3(0, 0, 0), 1, null, false);
      }
      console.log(`Deselected planet: ${planet.name}`);
      onPlanetClick(null);
    } else {
      console.log(`Selected planet: ${planet.name}`);
      onPlanetClick(planet);
    }
  };

  return (
    <>
      {/* Planet mesh */}
      <mesh 
        ref={planetRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[planet.radius * 0.6, 32, 32]} />
        <meshStandardMaterial 
          color={materialColor}
          emissive={materialEmissive}
          emissiveIntensity={materialEmissiveIntensity}
          map={getPlanetTexture(planet.type, planetTextures, planet.textureIndex || 0)}
          roughness={planet.type === 'gas_giant' || planet.type === 'frost_giant' ? 0.1 : 0.8}
          metalness={planet.type === 'nuclear_world' ? 0.7 : 0.1}
          transparent={false}
          opacity={1.0}
        />
      </mesh>


      {/* Atmospheric glow for gas planets */}
      {(planet.type === 'gas_giant' || planet.type === 'frost_giant') && (
        <mesh position={[0, 0, 0]} raycast={() => null}>
          <sphereGeometry args={[planet.radius * 0.8 + 1, 16, 16]} />
          <meshBasicMaterial 
            color={getPlanetGlow(planet.type)}
            transparent
            opacity={0.15}
          />
        </mesh>
      )}

      {/* Render moons orbiting this planet - pass planet ref directly */}
      {planet.moons && planet.moons.length > 0 && planet.moons.map((moon: any, moonIndex: number) => (
        <MoonMesh 
          key={`${planet.id}-moon-${moonIndex}`}
          moon={moon}
          planetRef={planetRef}
          planetRadius={planet.radius * 0.6}
          moonIndex={moonIndex}
        />
      ))}
    </>
  );
}

export function SystemView({ system, selectedPlanet, onPlanetClick }: SystemViewProps) {
  const [selectedStar, setSelectedStar] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { selectStar } = useUniverse();

  // Generate nebulas for this system view
  const nebulas = useMemo(() => StarGenerator.generateNebulas(35), []);

  // Check if current star is inside any nebula (using scaled radius to match visual representation)
  const starInNebula = useMemo(() => {
    if (!system.star || !system.star.position) {
      console.log('No star or star position:', system.star);
      return null;
    }

    const starPos = new THREE.Vector3(...(system.star.position || [0, 0, 0]));
    console.log(`Checking nebula for ${system.star.spectralClass}-class star "${system.star.name}" at position:`, starPos, 'with radius:', system.star.radius);

    for (const nebula of nebulas) {
      const nebulaPos = new THREE.Vector3(...nebula.position);
      const distance = starPos.distanceTo(nebulaPos);
      const scaledRadius = nebula.radius * 4.5; // Match nebula scaling used in NebulaScreenTint and NebulaMesh

      console.log(`Distance to ${nebula.name}: ${distance.toFixed(2)}, scaled radius: ${scaledRadius.toFixed(2)}, inside: ${distance < scaledRadius}`);

      if (distance < scaledRadius) {
        console.log(`${system.star.spectralClass}-class star "${system.star.name}" is inside ${nebula.name}`);
        return nebula;
      }
    }
    console.log(`${system.star.spectralClass}-class star "${system.star.name}" is NOT inside any nebula`);
    return null;
  }, [system.star, nebulas]);

  const star = system.star || {
    radius: 1,
    spectralClass: 'G',
    temperature: 5778,
    name: 'Central Star'
  };

  // Load all planetary textures
  const starBumpMap = useTexture('/textures/star_surface.jpg');

  // Gaseous planet textures
  const jupiterTexture = useTexture('/textures/jupiter.jpg');
  const uranusTexture = useTexture('/textures/uranus.jpg');
  const neptuneTexture = useTexture('/textures/neptune.jpg');

  // Terrestrial planet textures
  const marsTexture = useTexture('/textures/mars.jpg');
  const venusAtmosphereTexture = useTexture('/textures/venus_atmosphere.jpg');
  const venusSurfaceTexture = useTexture('/textures/venus_surface.jpg');
  const mercuryTexture = useTexture('/textures/mercury.jpg');
  const moonTexture = useTexture('/textures/moon.jpg');
  const ceresTexture = useTexture('/textures/ceres.jpg');
  const erisTexture = useTexture('/textures/eris.jpg');
  const oceanTexture = useTexture('/textures/ocean.jpg');

  // Verdant world (Earth-like) textures with proper opacity
  const terrestrial1Texture = useTexture('/textures/terrestrial1.jpg');
  const terrestrial2Texture = useTexture('/textures/terrestrial2.jpg');
  const terrestrial3Texture = useTexture('/textures/terrestrial3.png');


  // Note: acidic_world.jpg and nuclear_world.jpg are corrupted placeholder files

  // Comprehensive planet texture mapping based on planet types
  const planetTextures = {
    gas_giant: jupiterTexture, // Jupiter texture for gas giants
    frost_giant: [neptuneTexture, jupiterTexture, uranusTexture], // Neptune has better detail than Uranus
    arid_world: [marsTexture, venusSurfaceTexture], // Mars/Venus surfaces for arid worlds
    verdant_world: [terrestrial1Texture, terrestrial2Texture, terrestrial3Texture], // Earth-like worlds
    acidic_world: [venusAtmosphereTexture, venusSurfaceTexture], // Toxic atmosphere worlds
    nuclear_world: [ceresTexture, erisTexture], // Irradiated/barren worlds
    ocean_world: oceanTexture, // Water worlds with ocean texture
    dead_world: [moonTexture, mercuryTexture, erisTexture] // Barren rocky worlds
  };

  // Use planets from the cached system
  const planets = system.planets || [];
  const asteroidBelts = system.asteroidBelts || [];

  // Debug planet data including surface features
  console.log('SystemView planets data:', planets.map(p => ({ 
    name: p.name, 
    type: p.type,
    moonCount: p.moons?.length || 0,
    surfaceFeatureCount: p.surfaceFeatures?.length || 0,
    surfaceFeatures: p.surfaceFeatures?.map(f => f.name) || []
  })));

  // Debug: Log system data
  console.log('System data:', {
    planets: planets.length,
    asteroidBelts: asteroidBelts.length,
    belts: asteroidBelts
  });

  // Debug: Log planet data to check IDs
  if (planets.length > 0 && !planets[0].id) {
    console.warn('Planets missing IDs:', planets);
  } else if (planets.length > 0) {
    console.log('Planets have IDs:', planets.map(p => ({ name: p.name, id: p.id })));
  }

  // No longer needed - using currentSystem.star directly in UI

  // Handle background click to deselect planets only
  const handleBackgroundClick = () => {
    if (selectedPlanet) {
      console.log('Deselecting planet');
      // Stop orbital tracking
      if ((window as any).homeToPlanet) {
        (window as any).homeToPlanet(new THREE.Vector3(0, 0, 0), 1, null, false);
      }
      onPlanetClick(null);
    }
  };

  // Planet search and camera homing
  const searchPlanet = (planetName: string) => {
    const planet = system.planets.find((p: any) => 
      p.name.toLowerCase().includes(planetName.toLowerCase())
    );

    if (planet) {
      // Select the planet
      onPlanetClick(planet);
      console.log(`Found and selected planet: ${planet.name}`);
      return planet;
    }
    return null;
  };

  // Asteroid field component with stable generation
  function AsteroidField({ belt }: { belt: any }) {
    const asteroidData = useMemo(() => {
      const totalAsteroids = Math.min(Math.pow(belt.outerRadius, 1.5) * 5, 500);
      const asteroids = [];

      for (let i = 0; i < totalAsteroids; i++) {
        // Use index-based pseudo-random for consistent distribution
        const seed1 = (i * 73 + 37) % 1000 / 1000;
        const seed2 = (i * 149 + 83) % 1000 / 1000;
        const seed3 = (i * 211 + 127) % 1000 / 1000;

        const baseAngle = seed1 * Math.PI * 2;
        const radius = belt.innerRadius + seed2 * (belt.outerRadius - belt.innerRadius);
        const size = 0.1 + (seed3 * 0.3); // Random size variation
        const yOffset = (seed1 - 0.5) * 3; // Random y offset
        const orbitSpeed = 0.01 + (radius * 0.00005); // Slower for outer asteroids

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
    }, [belt.id]); // Only regenerate if belt ID changes

    const groupRef = useRef<any>();

    useFrame((state) => {
      if (groupRef.current) {
        const time = state.clock.getElapsedTime();
        groupRef.current.children.forEach((child: any, i: number) => {
          const asteroid = asteroidData[i];
          if (asteroid) {
            const angle = asteroid.baseAngle + time * asteroid.orbitSpeed;
            const x = Math.cos(angle) * asteroid.radius * 2;
            const z = Math.sin(angle) * asteroid.radius * 2;
            child.position.set(x, asteroid.yOffset, z);
          }
        });
      }
    });

    return (
      <group ref={groupRef}>
        {asteroidData.map((asteroid) => (
          <mesh key={asteroid.id}>
            <sphereGeometry args={[asteroid.size, 4, 4]} />
            <meshBasicMaterial color="#888888" />
          </mesh>
        ))}
      </group>
    );
  }

  // Expose search functions to parent component
  React.useEffect(() => {
    // Add search functionality to window for external access
    (window as any).searchPlanet = searchPlanet;
    (window as any).systemPlanets = system.planets;

    return () => {
      delete (window as any).searchPlanet;
      delete (window as any).systemPlanets;
    };
  }, [system.planets]);

  return (
    <group>
      {/* Nebula screen tint - only if star is inside a nebula */}
      {starInNebula && <NebulaScreenTint nebulas={[starInNebula]} />}

      {/* Distant nebula skybox */}
      <SystemNebulaSkybox 
        nebulas={nebulas} 
        excludeNebula={starInNebula} 
        starPosition={system.star?.position || [0, 0, 0]} 
      />

      {/* Starfield skybox */}
      <StarSkybox 
        count={5000} 
        radius={800} 
        starPosition={system.star?.position || [0, 0, 0]} 
      />

      {/* Background plane for deselection clicks */}
      <mesh 
        position={[0, 0, -5000]} 
        onClick={handleBackgroundClick}
        visible={false}
      >
        <planeGeometry args={[50000, 50000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Central Star - non-interactive, info shown permanently */}
      <mesh 
        position={[0, 0, 0]}
      >
        <sphereGeometry args={[Math.log((star.radius*1.1) + 1) * 6 + 4, 32, 32]} />
        <meshStandardMaterial 
          color={getStarColor(star.spectralClass)}
          emissive={getStarColor(star.spectralClass)}
          emissiveIntensity={2.0}
          toneMapped={false}
          // Star surface texture - fully opaque
          map={starBumpMap || undefined}
          transparent={false}
          opacity={1.0}
        />
      </mesh>

      {/* No selection ring needed - star info always shown */}

      {/* Star glow effect - scaled with star size */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[Math.log(star.radius + 1) * 8 + 6, 16, 16]} />
        <meshBasicMaterial 
          color={getStarColor(star.spectralClass)}
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Orbital paths (static) */}
      {planets.map((planet) => (
        <mesh key={`orbit-${planet.id}`} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.orbitRadius * 2 - 0.05, planet.orbitRadius * 2 + 0.05, 128]} />
          <meshBasicMaterial 
            color="#444444" 
            transparent 
            opacity={0.3}
            side={2}
          />
        </mesh>
      ))}

      {/* Planets with selection functionality */}
      {planets.map((planet, index) => (
        <PlanetMesh 
          key={planet.id} 
          planet={planet} 
          index={index}
          isSelected={selectedPlanet?.id === planet.id}
          onPlanetClick={onPlanetClick}
          planetTextures={planetTextures}
        />
      ))}

      {/* Asteroid belts */}
      {asteroidBelts.map((belt) => (
        <group key={belt.id}>
          {/* Belt ring visualization */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry 
              args={[
                belt.innerRadius * 2, 
                belt.outerRadius * 2, 
                64
              ]} 
            />
            <meshBasicMaterial 
              color="#666666" 
              transparent 
              opacity={0.3}
              side={2}
            />
          </mesh>

          {/* Individual asteroids (exponentially scaled by belt radius) */}
          <AsteroidField belt={belt} />
        </group>
      ))}
    </group>
  );
}