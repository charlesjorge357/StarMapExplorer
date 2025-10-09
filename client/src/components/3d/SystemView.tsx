import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useUniverse } from '../../lib/stores/useUniverse';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { StarGenerator } from '../../lib/universe/StarGenerator';
import { SystemGenerator } from '../../lib/universe/SystemGenerator';
import { NebulaScreenTint } from './NebulaScreenTint';
import { SystemNebulaSkybox } from './SystemNebulaSkybox';
import { StarSkybox } from './StarSkybox';
import { LazyTexturePlanet } from './LazyTexturePlanet';
import { PlanetRings } from './PlanetRings';
import { Console } from 'console';
import { CometTrail } from './CometTrail';
import { SpaceFeatureMarker } from './SpaceFeatureMarker';
import { FleetMarker } from './FleetMarker';
import { FleetInfoPanel } from '../ui/FleetInfoPanel';
import { SpaceFeature } from '../../../../shared/schema';

function MoonMesh({ 
  moon, 
  planetRef,
  planetRadius,
  moonIndex,
  planetId 
}: { 
  moon: any; 
  planetRef: React.RefObject<any>;
  planetRadius: number;
  moonIndex: number;
  planetId: string;
}) {
  const moonRef = useRef<THREE.Mesh>(null);

  // Generate varied moon colors based on planet and moon index
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

  const emissiveColor = useMemo(() => {
    // Slight glow based on moon color
    const color = new THREE.Color(moonColor);
    return color.multiplyScalar(0.1);
  }, [moonColor]);

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
        color={moonColor} 
        emissive={emissiveColor}
        emissiveIntensity={0.15}
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}


// Use SystemGenerator.getPlanetColor for consistency with generation

// Texture cache to prevent re-loading the same texture multiple times
const textureCache = new Map<string, THREE.Texture>();

function getPlanetTexture(type: string, planetTextures: any, textureIndex: number): any {
  // For legacy textures (nuclear_world, ocean_world) that are already loaded
  const textures = planetTextures[type as keyof typeof planetTextures];
  if (textures) {
    if (Array.isArray(textures)) {
      return textures[textureIndex % textures.length];
    }
    return textures;
  }

  // For new planet types, use lazy loading with cache
  if (planetTextures.getTextureForPlanet) {
    const texturePath = planetTextures.getTextureForPlanet(type, textureIndex);
    if (texturePath) {
      // Check cache first
      if (textureCache.has(texturePath)) {
        return textureCache.get(texturePath);
      }
      
      try {
        const texture = new THREE.TextureLoader().load(
          texturePath,
          // onLoad callback
          (loadedTexture) => {
            console.log(`✓ Successfully loaded texture: ${texturePath}`);
            loadedTexture.wrapS = loadedTexture.wrapT = THREE.RepeatWrapping;
          },
          // onProgress callback
          undefined,
          // onError callback
          (error) => {
            console.error(`✗ Failed to load texture: ${texturePath}`, error);
            textureCache.delete(texturePath); // Remove failed texture from cache
          }
        );
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        textureCache.set(texturePath, texture);
        return texture;
      } catch (e) {
        console.error(`✗ Exception loading texture: ${texturePath}`, e);
        return null;
      }
    }
  }
  
  console.warn(`⚠ No texture found for planet type: ${type}, using fallback`);
  return null;
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
    gas_giant: [15, 85, 55],      // Orange-red
    frost_giant: [200, 70, 70],   // Blue
    arid_world: [45, 75, 50],     // Gold
    barren_world: [35, 40, 35],   // Dim brown
    dusty_world: [40, 60, 40],    // Tan glow
    grassland_world: [80, 50, 45], // Green glow
    jungle_world: [120, 60, 40],  // Forest green
    marshy_world: [90, 45, 35],   // Olive green
    martian_world: [0, 65, 45],   // Red glow
    methane_world: [290, 55, 50], // Purple glow
    sandy_world: [35, 65, 50],    // Sandy glow
    snowy_world: [200, 15, 80],   // Icy blue
    tundra_world: [180, 25, 45],  // Cold gray
    nuclear_world: [0, 90, 45],   // Red
    ocean_world: [210, 85, 60]    // Blue
  };

  let [h, s, l] = baseGlows[type] || [0, 0, 30];

  h = (h + variation * 60 + 360) % 360;
  return `hsl(${Math.round(h)}, ${s}%, ${l}%)`;
}



// Use StarGenerator.getStarColor instead of local duplicate function

interface SystemViewProps {
  system: any;
  selectedPlanet: any;
  onPlanetClick: (planet: any) => void;
  selectedSpaceFeature?: SpaceFeature | null;
  onSpaceFeatureClick?: (feature: SpaceFeature | null) => void;
  selectedFleet?: any;
  onFleetClick?: (fleet: any) => void;
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
  totalPlanets,
  isSelected, 
  onPlanetClick, 
  planetTextures,
  selectedSpaceFeature,
  onSpaceFeatureClick
}: { 
  planet: any; 
  index: number; 
  totalPlanets: number;
  isSelected: boolean;
  onPlanetClick: (planet: any) => void;
  planetTextures: any;
  selectedSpaceFeature?: any;
  onSpaceFeatureClick?: (feature: any) => void;
}) {
  const planetRef = useRef<any>();

  useFrame((state) => {
    if (planetRef.current) {
      // Use Date.now() for consistent timing across components
      const time = Date.now() * 0.0001;
      const angle = time * planet.orbitSpeed + index * (Math.PI * 2 / totalPlanets);
      const x = Math.cos(angle) * planet.orbitRadius * 2;
      const z = Math.sin(angle) * planet.orbitRadius * 2;
      planetRef.current.position.x = x;
      planetRef.current.position.z = z;

      // Expose current planet position to window for persistence
      if (!(window as any).currentPlanetPositions) {
        (window as any).currentPlanetPositions = {};
      }
      (window as any).currentPlanetPositions[planet.id] = [x, 0, z];

      // Axis rotation using frame time
      planetRef.current.rotation.y = state.clock.getElapsedTime() * (planet.rotationSpeed || 0.01) * 10;
    }
  });

  // Calculate planet properties with debug logging
  const planetSeed = (planet.id || planet.name).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const planetColor = SystemGenerator.getPlanetColor(planet.type, planetSeed);
  const planetGlow = getPlanetGlow(planet.type, planet.id || planet.name);
  const planetRadius = planet.radius * 0.6; // Visual scaling

  // Store these computed values directly on the planet object for planetary view
  planet.computedColor = planetColor;
  planet.computedGlow = planetGlow;

  // Debug texture loading for this specific planet
  const planetTexture = getPlanetTexture(planet.type, planetTextures, planet.textureIndex || 0);
  console.log(`🎨 Planet ${planet.name} (${planet.type}) texture info:`, {
    textureIndex: planet.textureIndex,
    hasTexture: !!planetTexture,
    color: planetColor,
    textureStatus: planetTexture ? 'loaded' : 'missing'
  });

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
      
      // Deselect space feature if one is selected and stop its tracking
      if (selectedSpaceFeature) {
        console.log('Deselecting space feature due to planet selection (3D click)');
        if ((window as any).homeToSpaceFeature) {
          (window as any).homeToSpaceFeature(null, 0, false);
        }
        if (onSpaceFeatureClick) {
          onSpaceFeatureClick(null);
        }
      }
      
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
          color={planetColor}
          emissive={planet.type === 'nuclear_world' ? '#330000' : '#000000'}
          emissiveIntensity={planet.type === 'nuclear_world' ? 0.3 : 0}
          map={getPlanetTexture(planet.type, planetTextures, planet.textureIndex || 0) || undefined}
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
          planetId={planet.id}
        />
      ))}
      
      {/* Render planet rings directly following the planet */}
      {planet.rings && planet.rings.length > 0 && (
        <PlanetRings
          rings={planet.rings}
          planetRadius={planetRadius}
          planetRef={planetRef}
        />
      )}
    </>
  );
}

export function SystemView({ 
  system, 
  selectedPlanet, 
  onPlanetClick, 
  selectedSpaceFeature: propSelectedSpaceFeature,
  onSpaceFeatureClick: propOnSpaceFeatureClick,
  selectedFleet: propSelectedFleet,
  onFleetClick: propOnFleetClick
}: SystemViewProps) {
  const [selectedStar, setSelectedStar] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // Use either prop state or local state for space features
  const [localSelectedSpaceFeature, setLocalSelectedSpaceFeature] = useState<SpaceFeature | null>(null);
  const selectedSpaceFeature = propSelectedSpaceFeature ?? localSelectedSpaceFeature;
  const setSelectedSpaceFeature = propOnSpaceFeatureClick ? 
    ((feature: SpaceFeature | null) => propOnSpaceFeatureClick(feature)) : 
    setLocalSelectedSpaceFeature;
    
  // Use either prop state or local state for fleets
  const [localSelectedFleet, setLocalSelectedFleet] = useState<any>(null);
  const selectedFleet = propSelectedFleet ?? localSelectedFleet;
  const setSelectedFleet = propOnFleetClick ? 
    ((fleet: any) => propOnFleetClick(fleet)) : 
    setLocalSelectedFleet;
  
  // Handle fleet selection
  const handleFleetClick = (fleet: any) => {
    console.log('🚀 FLEET CLICKED - selecting:', {
      fleetId: fleet.id,
      fleetPosition: fleet.position,
      fleetSize: fleet.size
    });
    setSelectedFleet(fleet);
    console.log('✅ FLEET SELECTION STATE UPDATED - orbital disk should now appear');
  };
  // Add try-catch to handle useUniverse hook issues
  let universeStore;
  try {
    universeStore = useUniverse();
  } catch (error) {
    console.warn('useUniverse hook error:', error);
    universeStore = null;
  }
  const selectStar = universeStore?.selectStar || (() => {});

  // Expose current system data to window for space feature orbital tracking
  useEffect(() => {
    if (system) {
      (window as any).currentSystemRef = { current: system };
    }
    return () => {
      delete (window as any).currentSystemRef;
    };
  }, [system]);

  const outermostOrbit = useMemo(() => {
    if (!system || !system.planets || system.planets.length === 0) return 0;
    return Math.max(...system.planets.map((p: any) => p.orbitRadius * 1.5));
  }, [system?.planets]);

  const cometRef = useRef<THREE.Mesh>(null);
  const cometDataRef = useRef<{
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    angle: number;
  } | null>(null);

  function randomAngleExcludingRange() {
    // Decide randomly which range to pick from: 0 => negative, 1 => positive
    const pickRange = Math.random() < 10 ? -10 : 10;

    // Generate a random float between 0 and 1
    const rand = Math.random();

    // Scale and shift rand to range [1, 2], then multiply by pickRange
    return pickRange * (0.1 + rand);
  }

  const [showComet, setShowComet] = useState(false);

  // Function to spawn a new comet
  const spawnComet = () => {
    setShowComet(true);
    const angle = randomAngleExcludingRange();
    const radius = outermostOrbit * 4;
    const randomValue = 0.9 + Math.random() * 0.2;

    const scaledAngle = Math.random() * Math.PI * 2;

    const pos = new THREE.Vector3(
      Math.cos(scaledAngle) * radius,
      0,
      Math.sin(scaledAngle) * radius
    );

    const radial = new THREE.Vector3(
      -Math.cos(scaledAngle * randomValue),
      0,
      -Math.sin(scaledAngle * randomValue)
    );

    

    const speed = 9;
    const velocity = radial.multiplyScalar(speed * 0.9);

    cometDataRef.current = { position: pos, velocity, angle };

    // Set initial mesh position
    if (cometRef.current) {
      cometRef.current.position.copy(pos);
    }

    console.log(`Spawned comet at outermost orbit: ${outermostOrbit}`);
  };

  useEffect(() => {
    if (outermostOrbit > 0) {
      spawnComet();
    }
  }, [outermostOrbit]);

  useFrame((_, delta) => {
    const cometData = cometDataRef.current;
    if (!cometData || !cometRef.current) return;

    const pos = cometData.position;
    const vel = cometData.velocity;

    const toStar = pos.clone().negate();
    const dist = toStar.length();
    const dirToStar = toStar.normalize();

    const accelerationMag = 0.0005 / (dist * dist + 0.1);
    const acceleration = dirToStar.multiplyScalar(accelerationMag);

    vel.add(acceleration.multiplyScalar(delta * 6));
    pos.add(vel.clone().multiplyScalar(delta * 6));

    cometRef.current.position.copy(pos);

    if (dist > outermostOrbit * 5) {
      cometDataRef.current = null;
      console.log(`Comet destroyed at outermost orbit: ${outermostOrbit}`);
      setShowComet(false);
      setTimeout(spawnComet, 100);
    }
  });

  

  // Generate nebulas for this system view
  const nebulas = useMemo(() => StarGenerator.generateNebulas(35), []);

  // Check if current star is inside any nebula (using scaled radius to match visual representation)
  const starInNebula = useMemo(() => {
    if (!system?.star || !system.star.position) {
      console.log('No star or star position:', system?.star);
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

  const star = system?.star || {
    radius: 1,
    spectralClass: 'G',
    temperature: 5778,
    name: 'Central Star'
  };

  // Load only essential textures immediately with error handling
  const starBumpMap = useTexture('/textures/star_surface.jpg');
  const ceresTexture = useTexture('/textures/ceres.jpg');
  const erisTexture = useTexture('/textures/eris.jpg');
  
  // Use lazy loading for ocean texture to prevent blocking
  const [oceanTexture, setOceanTexture] = useState<THREE.Texture | null>(null);
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      '/textures/ocean.jpg',
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        setOceanTexture(texture);
      },
      undefined,
      (error) => {
        console.warn('Failed to load ocean texture:', error);
        setOceanTexture(null);
      }
    );
  }, []);

  // Use planets from the cached system with null checks
  const planets = system?.planets || [];
  const asteroidBelts = system?.asteroidBelts || [];
  const spaceFeatures = system?.spaceFeatures || [];

  // Optimized lazy texture loading - only load textures as needed
  const planetTextures = useMemo(() => {
    const textures: any = {
      nuclear_world: [ceresTexture, erisTexture],
      ocean_world: oceanTexture || null
    };
    
    // Return texture path getter instead of loading all textures upfront
    const getTextureForPlanet = (planetType: string, textureIndex: number = 0) => {
      const texturePaths: Record<string, string[]> = {
        gas_giant: Array.from({length: 20}, (_, i) => 
          `/textures/Gaseous/Gaseous_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        frost_giant: Array.from({length: 20}, (_, i) => 
          `/textures/Gaseous/Gaseous_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        arid_world: Array.from({length: 5}, (_, i) => 
          `/textures/Arid/Arid_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        barren_world: Array.from({length: 5}, (_, i) => 
          `/textures/Barren/Barren_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        dusty_world: Array.from({length: 5}, (_, i) => 
          `/textures/Dusty/Dusty_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        grassland_world: Array.from({length: 5}, (_, i) => 
          `/textures/Grassland/Grassland_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        jungle_world: Array.from({length: 5}, (_, i) => 
          `/textures/Jungle/Jungle_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        marshy_world: [
          '/textures/Marshy/Marshy_01-1024x512.png',
          '/textures/Marshy/Marshy_02-1024x512.png',
          '/textures/Marshy/Marshy_03-1024x512.png',
          '/textures/Marshy/Marshy_04-1024x512.png',
          '/textures/Marshy/Marshy_05-1024x512.png'  // Fixed naming - was 1024-512 instead of 1024x512
        ],
        martian_world: Array.from({length: 5}, (_, i) => 
          `/textures/Martian/Martian_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        methane_world: Array.from({length: 5}, (_, i) => 
          `/textures/Methane/Methane_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        sandy_world: Array.from({length: 5}, (_, i) => 
          `/textures/Sandy/Sandy_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        snowy_world: Array.from({length: 5}, (_, i) => 
          `/textures/Snowy/Snowy_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        tundra_world: Array.from({length: 5}, (_, i) => 
          `/textures/Tundra/Tundra_${String(i + 1).padStart(2, '0')}-1024x512.png`
        ),
        nuclear_world: ['/textures/ceres.jpg'],
        ocean_world: ['/textures/ocean.jpg']
      };
      
      const paths = texturePaths[planetType] || texturePaths['barren_world'];
      return paths[textureIndex % paths.length];
    };
    
    textures.getTextureForPlanet = getTextureForPlanet;
    return textures;
  }, [ceresTexture, erisTexture, oceanTexture]);

  // Debug planet data including texture information
  console.log('SystemView planets data:', planets.map(p => ({ 
    name: p.name, 
    type: p.type,
    textureIndex: p.textureIndex,
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

  // Handle space feature selection with toggle behavior like planets
  const handleSpaceFeatureClick = (feature: SpaceFeature) => {
    console.log('handleSpaceFeatureClick called with:', feature);
    try {
      // Toggle selection: if already selected, deselect it
      if (selectedSpaceFeature && selectedSpaceFeature.id === feature.id) {
        console.log('Deselecting space feature (toggle)');
        // Stop space feature orbital tracking
        if ((window as any).homeToSpaceFeature) {
          (window as any).homeToSpaceFeature(null, 0, false);
        }
        if (propOnSpaceFeatureClick) {
          propOnSpaceFeatureClick(null);
        } else {
          setSelectedSpaceFeature(null);
        }
      } else {
        console.log('Selecting space feature');
        
        // Deselect planet if one is selected and stop its tracking
        if (selectedPlanet) {
          console.log('Deselecting planet due to space feature selection (3D click)');
          if ((window as any).homeToPlanet) {
            (window as any).homeToPlanet(new THREE.Vector3(0, 0, 0), 1, null, false);
          }
          onPlanetClick(null);
        }
        
        if (propOnSpaceFeatureClick) {
          propOnSpaceFeatureClick(feature);
        } else {
          setSelectedSpaceFeature(feature);
        }
      }
    } catch (error) {
      console.error('Error in handleSpaceFeatureClick:', error);
      console.error('Error stack:', error.stack);
    }
  };

  // Handle background click to deselect planets, space features, and fleets
  const handleBackgroundClick = (event: any) => {
    // Prevent event bubbling to avoid conflicts with other objects
    event.stopPropagation();
    
    // Check if this is an orbital disk click for fleet movement
    console.log('Background click detected:', {
      hasSelectedFleet: !!selectedFleet,
      hasIntersections: !!event.intersections,
      intersectionCount: event.intersections?.length || 0
    });
    
    // Skip orbital disk handling in background - it has its own handler
    console.log('Background click handler - checking for orbital disk conflicts');
    
    // Only deselect if not clicking on orbital disk
    if (selectedPlanet) {
      console.log('Deselecting planet');
      // Stop orbital tracking
      if ((window as any).homeToPlanet) {
        (window as any).homeToPlanet(new THREE.Vector3(0, 0, 0), 1, null, false);
      }
      onPlanetClick(null);
    }

    if (selectedFleet) {
      console.log('Deselecting fleet');
      setSelectedFleet(null);
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

  // Expose search functions and orbital data to parent component
  React.useEffect(() => {
    // Add search functionality to window for external access
    (window as any).searchPlanet = searchPlanet;
    (window as any).systemPlanets = planets; // Use processed planets with all data
    (window as any).systemSpaceFeatures = spaceFeatures; // Expose space features for fleet orbital sync
    
    console.log(`📡 Exposed ${planets.length} planets to fleet orbital system:`, planets.map(p => ({
      name: p.name,
      orbitSpeed: p.orbitSpeed,
      orbitRadius: p.orbitRadius
    })));
    
    console.log(`📡 Exposed ${spaceFeatures.length} space features to fleet orbital system:`, spaceFeatures.map(f => ({
      name: f.name,
      type: f.type,
      orbitSpeed: f.orbitSpeed,
      orbitRadius: f.orbitRadius
    })));

    return () => {
      delete (window as any).searchPlanet;
      delete (window as any).systemPlanets;
      delete (window as any).systemSpaceFeatures;
    };
  }, [planets, spaceFeatures, searchPlanet]);

  return (
    <group>
      {/* Comet mesh */}
      {showComet && (
        <mesh ref={cometRef} position={cometDataRef.current.position}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" emissive='#FFFFFF' emissiveIntensity={2.0} metalness={0.1}/>
        </mesh>
      )}

      {/* Add this after the comet mesh */}
      <CometTrail cometRef={cometRef} />
      
      {/* Nebula screen tint disabled due to visual issues */}
      {/* {starInNebula && <NebulaScreenTint nebulas={[starInNebula]} />} */}

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

      {/* Background plane for deselection clicks - positioned behind orbital disk */}
      <mesh 
        position={[0, 0, -10000]}
        onClick={(event) => {
          // Only handle background clicks if no orbital disk is active
          if (!selectedFleet) {
            handleBackgroundClick(event);
          } else {
            console.log('🚫 BACKGROUND CLICK BLOCKED - orbital disk is active');
          }
        }}
        visible={false}
        renderOrder={-1000}
      >
        <planeGeometry args={[50000, 50000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Orbital selection disk - positioned at fleet's current height for accurate click detection */}
      {selectedFleet && (
        <mesh 
          position={[0, selectedFleet.position[1], 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(event) => {
            console.log('🎯 ORBITAL DISK CLICKED - fleet movement initiated');
            console.log('Raw click point:', event.point);
            console.log('Camera position:', event.camera.position);
            console.log('Event object properties:', Object.keys(event));
            event.stopPropagation();
            
            if (event.point) {
              // Use x and z coordinates directly - Y comes from the plane position
              const clickX = event.point.x;
              const clickY = event.point.y; // This should now be the fleet's Y position
              const clickZ = event.point.z;
              
              console.log(`🎯 CLICK TARGET: [${clickX.toFixed(2)}, ${clickY.toFixed(2)}, ${clickZ.toFixed(2)}]`);
              
              // Update fleet position directly in system data
              const targetFleet = system.factions?.flatMap((f: any) => f.fleets || [])
                .find((f: any) => f.id === selectedFleet.id);
              
              if (targetFleet) {
                console.log(`📍 OLD FLEET POSITION: [${targetFleet.position.join(', ')}]`);
                
                // Update the fleet's position in the system data - use click Y coordinate
                targetFleet.position = [clickX, clickY, clickZ];
                
                // Persist fleet position in universe store
                if (universeStore?.updateFleetPosition) {
                  console.log(`💾 Saving fleet position with system ID: ${system.id}`);
                  universeStore.updateFleetPosition(system.id, targetFleet.id, [clickX, clickY, clickZ]);
                }
                
                // Update selected fleet state to trigger re-render
                setSelectedFleet({ ...targetFleet });
                
                console.log(`🚀 FLEET MOVED TO: [${clickX.toFixed(2)}, ${clickY.toFixed(2)}, ${clickZ.toFixed(2)}]`);
                console.log(`📊 Updated targetFleet.position:`, targetFleet.position);
                console.log(`📊 Updated selectedFleet will be:`, { ...targetFleet });
              } else {
                console.error('❌ TARGET FLEET NOT FOUND in system data');
                console.log('Available fleets:', system.factions?.flatMap((f: any) => f.fleets || []).map((f: any) => ({ id: f.id, position: f.position })));
              }
            } else {
              console.error('❌ NO CLICK POINT DETECTED');
            }
          }}
          visible={false}
          renderOrder={2000}
        >
          <planeGeometry args={[Math.max(outermostOrbit * 5, 200), Math.max(outermostOrbit * 5, 200)]} />
          <meshBasicMaterial 
            transparent 
            opacity={0} 
            depthTest={false}
            depthWrite={false}
            side={2}
          />
        </mesh>
      )}

      {/* Central Star - non-interactive, info shown permanently */}
      <mesh 
        position={[0, 0, 0]}
      >
        <sphereGeometry args={[Math.log((star.radius*1.1) + 1) * 6 + 4, 32, 32]} />
        <meshStandardMaterial 
          color={StarGenerator.getStarColor(star.spectralClass)}
          emissive={StarGenerator.getStarColor(star.spectralClass)}
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
          color={StarGenerator.getStarColor(star.spectralClass)}
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Orbital paths (static) - positioned behind orbital disk */}
      {planets.map((planet) => (
        <mesh key={`orbit-${planet.id}`} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
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
          totalPlanets={planets.length}
          isSelected={selectedPlanet?.id === planet.id}
          onPlanetClick={onPlanetClick}
          planetTextures={planetTextures}
          selectedSpaceFeature={selectedSpaceFeature}
          onSpaceFeatureClick={setSelectedSpaceFeature}
        />
      ))}

      {/* Rings are now rendered directly within each PlanetMesh component for proper tracking */}

      {/* Asteroid belts - positioned behind orbital disk */}
      {asteroidBelts.map((belt) => (
        <group key={belt.id}>
          {/* Belt ring visualization */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
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

      {/* Space features */}
      {spaceFeatures.map((feature: SpaceFeature) => (
        <SpaceFeatureMarker
          key={feature.id}
          feature={feature}
          planets={planets}
          asteroidBelts={asteroidBelts}
          isSelected={selectedSpaceFeature?.id === feature.id}
          onFeatureClick={handleSpaceFeatureClick}
        />
      ))}
      
      {/* Visible wireframe circle for visual feedback - non-interactive */}
      {selectedFleet && (
        <mesh 
          position={[0, -5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          visible={true}
          onPointerOver={undefined}
          onPointerOut={undefined}
          onClick={undefined}
          raycast={() => null}
        >
          <circleGeometry args={[Math.max(outermostOrbit * 2.5, 100), 64]} />
          <meshBasicMaterial 
            transparent 
            opacity={0.1}
            color="#00ffff"
            wireframe={true}
            depthTest={false}
          />
        </mesh>
      )}



      {/* Fleets */}
      {system.factions?.flatMap((faction: any) => 
        faction.fleets?.map((fleet: any) => (
          <FleetMarker
            key={fleet.id}
            fleet={fleet}
            isSelected={selectedFleet?.id === fleet.id}
            onFleetClick={handleFleetClick}
            starMass={star.mass || 1}
          />
        )) || []
      )}
    </group>
  );
}