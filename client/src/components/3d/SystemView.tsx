import React from 'react';
import { SystemGenerator } from '../../lib/universe/SystemGenerator';

interface SystemViewProps {
  system: any;
}

function PlanetMesh({ planet, onClick }: { planet: any; onClick: (planet: any) => void }) {
  const color = SystemGenerator.getPlanetColor(planet.type);
  
  return (
    <group>
      {/* Orbit path */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[planet.orbitRadius * 10 - 0.1, planet.orbitRadius * 10 + 0.1, 64]} />
        <meshBasicMaterial color="#333333" transparent opacity={0.3} />
      </mesh>
      
      {/* Planet */}
      <mesh 
        position={planet.position}
        onClick={(e) => {
          e.stopPropagation();
          onClick(planet);
        }}
      >
        <sphereGeometry args={[planet.radius * 0.1, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

export function SystemView({ system }: SystemViewProps) {
  const handlePlanetClick = (planet: any) => {
    console.log(`Selected planet: ${planet.name}`);
  };

  const handleBackgroundClick = () => {
    console.log('Clicked system background');
  };

  // Get the star data from the system (we'll need to pass this)
  const star = system.star || { 
    radius: 1, 
    spectralClass: 'G', 
    temperature: 5778 
  };

  return (
    <group onClick={handleBackgroundClick}>
      {/* Central star - use authentic solar radius and spectral color */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[star.radius, 16, 16]} />
        <meshStandardMaterial 
          color={SystemGenerator.getStarColor(star.spectralClass)}
          emissive={SystemGenerator.getStarColor(star.spectralClass)}
          emissiveIntensity={0.6}
        />
      </mesh>
      
      {/* Planets */}
      {system.planets.map((planet: any) => (
        <PlanetMesh
          key={planet.id}
          planet={planet}
          onClick={handlePlanetClick}
        />
      ))}
    </group>
  );
}