import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { SystemGenerator } from '../../lib/universe/SystemGenerator';

// Helper functions for planet materials
function getPlanetColor(type: string): string {
  const colors = {
    gas_giant: '#FF7043',
    frost_giant: '#81C784', 
    arid_world: '#D4A574',
    verdant_world: '#4CAF50',
    acidic_world: '#FFC107',
    nuclear_world: '#F44336',
    ocean_world: '#2196F3',
    dead_world: '#616161'
  };
  return colors[type as keyof typeof colors] || '#888888';
}

function getPlanetGlow(type: string): string {
  const glows = {
    gas_giant: '#FF5722',
    frost_giant: '#66BB6A', 
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
  mouseMode: boolean;
}

// Selection ring component to match galactic view style
function SelectionRing({ planet, isSelected }: { planet: any; isSelected: boolean }) {
  const ringRef = useRef<any>();
  
  useFrame((state) => {
    if (ringRef.current && isSelected) {
      const time = state.clock.getElapsedTime() * 0.1;
      const angle = time * planet.orbitSpeed + (Math.PI * 2 / 8);
      ringRef.current.position.x = Math.cos(angle) * planet.orbitRadius;
      ringRef.current.position.z = Math.sin(angle) * planet.orbitRadius;
      
      // Pulse effect
      const pulse = 0.8 + Math.sin(state.clock.getElapsedTime() * 3) * 0.2;
      ringRef.current.scale.setScalar(pulse);
    }
  });
  
  if (!isSelected) return null;
  
  return (
    <mesh ref={ringRef}>
      <sphereGeometry args={[planet.radius + 0.3, 16, 16]} />
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
  mouseMode 
}: { 
  planet: any; 
  index: number; 
  isSelected: boolean;
  onPlanetClick: (planet: any) => void;
  mouseMode: boolean;
}) {
  const planetRef = useRef<any>();
  
  useFrame((state) => {
    if (planetRef.current) {
      const time = state.clock.getElapsedTime() * 0.1;
      const angle = time * planet.orbitSpeed + index * (Math.PI * 2 / 8);
      planetRef.current.position.x = Math.cos(angle) * planet.orbitRadius;
      planetRef.current.position.z = Math.sin(angle) * planet.orbitRadius;
    }
  });
  
  const handleClick = (event: any) => {
    if (mouseMode) {
      event.stopPropagation();
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
          if (mouseMode) {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          if (mouseMode) {
            document.body.style.cursor = 'auto';
          }
        }}
      >
        <sphereGeometry args={[planet.radius, 16, 16]} />
        <meshStandardMaterial 
          color={getPlanetColor(planet.type)}
          emissive={getPlanetGlow(planet.type)}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Selection ring */}
      <SelectionRing planet={planet} isSelected={isSelected} />

      {/* Orbital path */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[planet.orbitRadius - 0.05, planet.orbitRadius + 0.05, 128]} />
        <meshBasicMaterial 
          color="#444444" 
          transparent 
          opacity={0.3}
          side={2}
        />
      </mesh>
    </>
  );
}

export function SystemView({ system, selectedPlanet, onPlanetClick, mouseMode }: SystemViewProps) {
  const star = system.star || {
    radius: 1,
    spectralClass: 'G',
    temperature: 5778,
    name: 'Central Star'
  };

  // Generate planets with better spacing like before
  const planets = [];
  const planetCount = Math.floor(Math.random() * 6) + 3; // 3-8 planets
  const planetTypes = [
    'gas_giant', 'frost_giant', 'arid_world', 'verdant_world',
    'acidic_world', 'nuclear_world', 'ocean_world', 'dead_world'
  ];

  for (let i = 0; i < planetCount; i++) {
    const planetType = planetTypes[Math.floor(Math.random() * planetTypes.length)];
    const orbitRadius = 5 + i * (3 + Math.random() * 4); // Better spacing
    
    planets.push({
      id: `planet-${i}`,
      name: `${star.name} ${String.fromCharCode(945 + i)}`, // Greek letters
      type: planetType,
      radius: 0.3 + Math.random() * 1.2, // 0.3 to 1.5 units
      mass: 0.5 + Math.random() * 5, // Earth masses
      orbitRadius: orbitRadius,
      orbitSpeed: 0.1 + Math.random() * 0.3, // Orbital speed
      rotationSpeed: 0.01 + Math.random() * 0.05,
      temperature: 200 + Math.random() * 600, // Kelvin
      atmosphere: generateAtmosphere(planetType),
      position: [orbitRadius, 0, 0] as [number, number, number]
    });
  }

  function generateAtmosphere(planetType: string): string[] {
    const atmospheres = {
      gas_giant: ['Hydrogen', 'Helium', 'Methane'],
      frost_giant: ['Nitrogen', 'Methane', 'Argon'],
      arid_world: ['Carbon Dioxide', 'Nitrogen'],
      verdant_world: ['Nitrogen', 'Oxygen', 'Argon'],
      acidic_world: ['Sulfuric Acid', 'Carbon Dioxide'],
      nuclear_world: ['Radioactive Gases', 'Xenon'],
      ocean_world: ['Nitrogen', 'Oxygen', 'Water Vapor'],
      dead_world: []
    };
    return atmospheres[planetType as keyof typeof atmospheres] || [];
  }

  // Handle background click to deselect
  const handleBackgroundClick = () => {
    if (mouseMode && selectedPlanet) {
      console.log('Deselecting planet');
      onPlanetClick(null);
    }
  };

  return (
    <group onClick={handleBackgroundClick}>
      {/* Central Star */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[star.radius * 2, 32, 32]} />
        <meshStandardMaterial 
          color={getStarColor(star.spectralClass)}
          emissive={getStarColor(star.spectralClass)}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* Star glow effect */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[star.radius * 3, 16, 16]} />
        <meshBasicMaterial 
          color={getStarColor(star.spectralClass)}
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Planets with selection functionality */}
      {planets.map((planet, index) => (
        <PlanetMesh 
          key={planet.id} 
          planet={planet} 
          index={index}
          isSelected={selectedPlanet?.id === planet.id}
          onPlanetClick={onPlanetClick}
          mouseMode={mouseMode}
        />
      ))}
    </group>
  );
}