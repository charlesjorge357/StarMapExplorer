import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useUniverse } from '../../lib/stores/useUniverse';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';


// Helper functions for planet materials
function getPlanetColor(type: string): string {
  const colors = {
    gas_giant: '#FF7043',
    frost_giant: '#5DADE2', 
    arid_world: '#D4A574',
    verdant_world: '#4CAF50',
    acidic_world: '#FFC107',
    nuclear_world: '#F44336',
    ocean_world: '#2196F3',
    dead_world: '#616161'
  };
  return colors[type as keyof typeof colors] || '#888888';
}

function getPlanetTexture(type: string, planetTextures: any): any {
  const textures = planetTextures[type as keyof typeof planetTextures];
  if (!textures) return undefined;

  // Handle array of textures (random selection)
  if (Array.isArray(textures)) {
    return textures[Math.floor(Math.random() * textures.length)];
  }

  // Single texture
  return textures;
}

// Helper function to get texture for a planet - moved to top level
function getPlanetTextureForMaterial(planetType: string, planetTextures: any) {
  const textures = planetTextures[planetType as keyof typeof planetTextures];
  if (!textures) return undefined;

  // Handle array of textures (random selection)
  if (Array.isArray(textures)) {
    if (textures.length === 0) return undefined;
    return textures[Math.floor(Math.random() * textures.length)];
  }

  // Single texture
  return textures;
}

function getPlanetGlow(type: string): string {
  const glows = {
    gas_giant: '#FF5722',
    frost_giant: '#5DADE2', 
    arid_world: '#D4AF37',
    verdant_world: '#388E3C',
    acidic_world: '#FF9800',
    nuclear_world: '#D32F2F',
    ocean_world: '#1976D2',
    dead_world: '#424242'
  };
  return glows[type as keyof typeof glows] || '#444444';
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
      const time = state.clock.getElapsedTime() * 0.1;
      const angle = time * planet.orbitSpeed + index * (Math.PI * 2 / 8);
      planetRef.current.position.x = Math.cos(angle) * planet.orbitRadius * 2;
      planetRef.current.position.z = Math.sin(angle) * planet.orbitRadius * 2;
    }
  });

 const handleClick = (event: any) => {
    event.stopPropagation();
    console.log(`Selected planet: ${planet.name}`);
    onPlanetClick(planet);
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
        <sphereGeometry args={[planet.radius * 0.8, 32, 32]} />
        <meshStandardMaterial 
          color={getPlanetTexture(planet.type, planetTextures) ? '#ffffff' : getPlanetColor(planet.type)}
          emissive={getPlanetGlow(planet.type)}
          emissiveIntensity={getPlanetTexture(planet.type, planetTextures) ? 0.1 : 0.2}
          map={getPlanetTexture(planet.type, planetTextures)}
          roughness={planet.type === 'gas_giant' || planet.type === 'frost_giant' ? 0.1 : 0.8}
          metalness={planet.type === 'nuclear_world' ? 0.7 : 0.1}
          transparent={false}
          opacity={1.0}
        />
      </mesh>

      {/* Planet selection ring with pulsing effect */}
      {isSelected && (
        <mesh position={[0, 0, 0]} raycast={() => null}>
          <sphereGeometry args={[planet.radius * 0.8 + 2, 16, 16]} />
          <meshBasicMaterial 
            color="#ffffff"
            transparent
            opacity={0.4}
            wireframe
          />
        </mesh>
      )}

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
    </>
  );
}

export function SystemView({ system, selectedPlanet, onPlanetClick }: SystemViewProps) {
  const [selectedStar, setSelectedStar] = useState<any>(null);
  const { selectStar } = useUniverse();

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
  const acidicTexture = useTexture('/textures/acidic_world.jpg');
  const nuclearTexture = useTexture('/textures/nuclear_world.jpg');
  
  // Comprehensive planet texture mapping based on planet types
  const planetTextures = {
    gas_giant: jupiterTexture, // Jupiter texture for gas giants
    frost_giant: [uranusTexture, neptuneTexture], // Ice giant variety
    arid_world: [marsTexture, venusSurfaceTexture], // Mars/Venus surfaces for arid worlds
    verdant_world: null, // Earth-like (awaiting Earth textures)
    acidic_world: [acidicTexture, venusAtmosphereTexture], // Toxic atmosphere worlds
    nuclear_world: [nuclearTexture, ceresTexture], // Irradiated/barren worlds
    ocean_world: null, // Water worlds (awaiting ocean textures)
    dead_world: [moonTexture, mercuryTexture, erisTexture] // Barren rocky worlds
  };

  // Use planets from the cached system
  const planets = system.planets || [];

  // No longer needed - using currentSystem.star directly in UI

  // Handle background click to deselect planets only
  const handleBackgroundClick = () => {
    if (selectedPlanet) {
      console.log('Deselecting planet');
      onPlanetClick(null);
    }
  };

  return (
    <group>
      {/* Background plane for deselection clicks */}
      <mesh 
        position={[0, 0, -1000]} 
        onClick={handleBackgroundClick}
        visible={false}
      >
        <planeGeometry args={[10000, 10000]} />
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
          emissiveIntensity={0.8}
          toneMapped={false}
          // Star surface texture with opacity blending
          map={starBumpMap || undefined}
          transparent={true}
          opacity={0.85}
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
    </group>
  );
}