import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SystemGenerator } from '../../lib/universe/SystemGenerator';

interface SystemViewProps {
  system: any;
}

function PlanetMesh({ planet, onClick }: { planet: any; onClick: (planet: any) => void }) {
  const color = SystemGenerator.getPlanetColor(planet.type);
  const planetRef = useRef<any>();
  const orbitGroupRef = useRef<any>();
  
  // Calculate initial orbital angle from planet position
  const initialAngle = Math.atan2(planet.position[2], planet.position[0]);
  const angleRef = useRef(initialAngle);
  
  useFrame((state, delta) => {
    if (orbitGroupRef.current) {
      // Update orbital angle based on orbital speed
      angleRef.current += planet.orbitSpeed * delta;
      
      // Calculate new position
      const x = Math.cos(angleRef.current) * planet.orbitRadius * 10;
      const z = Math.sin(angleRef.current) * planet.orbitRadius * 10;
      const y = planet.position[1]; // Keep original Y position
      
      // Update planet position
      if (planetRef.current) {
        planetRef.current.position.set(x, y, z);
      }
    }
    
    // Rotate planet on its axis
    if (planetRef.current) {
      planetRef.current.rotation.y += planet.rotationSpeed * delta;
    }
  });
  
  return (
    <group ref={orbitGroupRef}>
      {/* Orbit path */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[planet.orbitRadius * 10 - 0.1, planet.orbitRadius * 10 + 0.1, 64]} />
        <meshBasicMaterial color="#333333" transparent opacity={0.3} />
      </mesh>
      
      {/* Planet */}
      <mesh 
        ref={planetRef}
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