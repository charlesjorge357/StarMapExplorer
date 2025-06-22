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
        <sphereGeometry args={[planet.radius, 16, 16]} />
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

  return (
    <group onClick={handleBackgroundClick}>
      {/* Central star */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial 
          color="#FFFF00" 
          emissive="#FFFF00" 
          emissiveIntensity={0.5}
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