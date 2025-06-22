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
    // Update orbital angle based on orbital speed (independent of camera)
    angleRef.current += planet.orbitSpeed * delta;
    
    // Calculate new position with orbital inclination (fixed orbital mechanics)
    const inclination = planet.inclination || 0;
    const x = Math.cos(angleRef.current) * planet.orbitRadius * 10;
    const z = Math.sin(angleRef.current) * planet.orbitRadius * 10;
    const y = Math.sin(inclination) * planet.orbitRadius * 2 + 
              Math.sin(angleRef.current) * Math.sin(inclination) * planet.orbitRadius * 1;
    
    // Update planet position directly (not via group)
    if (planetRef.current) {
      planetRef.current.position.set(x, y, z);
      // Rotate planet on its axis
      planetRef.current.rotation.y += planet.rotationSpeed * delta;
    }
  });
  
  return (
    <group ref={orbitGroupRef}>
      {/* Orbit path - tilted based on inclination */}
      <mesh 
        position={[0, 0, 0]} 
        rotation={[Math.PI / 2 + (planet.inclination || 0), 0, 0]}
      >
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
      {/* Central star with strong bloom effect */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[star.radius, 16, 16]} />
        <meshStandardMaterial 
          color={SystemGenerator.getStarColor(star.spectralClass)}
          emissive={SystemGenerator.getStarColor(star.spectralClass)}
          emissiveIntensity={1.5}
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