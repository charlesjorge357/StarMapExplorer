import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SystemGenerator } from '../../lib/universe/SystemGenerator';

// Helper functions for planet materials
const getPlanetEmissive = (type: string): string => {
  switch (type) {
    case 'gas_giant': return '#332200';
    case 'frost_giant': return '#001122';
    case 'arid_world': return '#331100';
    case 'verdant_world': return '#002200';
    case 'acidic_world': return '#223300';
    case 'nuclear_world': return '#331100';
    case 'ocean_world': return '#001133';
    case 'dead_world': return '#111111';
    default: return '#111111';
  }
};

const getPlanetEmissiveIntensity = (type: string): number => {
  switch (type) {
    case 'gas_giant': return 0.2;
    case 'frost_giant': return 0.15;
    case 'arid_world': return 0.1;
    case 'verdant_world': return 0.15;
    case 'acidic_world': return 0.25;
    case 'nuclear_world': return 0.4;
    case 'ocean_world': return 0.2;
    case 'dead_world': return 0.05;
    default: return 0.1;
  }
};

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
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[planet.radius * 0.1, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={getPlanetEmissive(planet.type)}
          emissiveIntensity={getPlanetEmissiveIntensity(planet.type)}
          metalness={planet.type === 'nuclear_world' ? 0.8 : 0.1}
          roughness={planet.type === 'gas_giant' ? 0.2 : 0.7}
        />
      </mesh>
    </group>
  );
}

export function SystemView({ system }: SystemViewProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<any>(null);
  const [selectedStar, setSelectedStar] = useState<boolean>(false);

  const handlePlanetClick = (planet: any) => {
    console.log(`Selected planet: ${planet.name}`);
    setSelectedPlanet(planet);
    setSelectedStar(false);
  };

  const handleStarClick = () => {
    console.log(`Selected central star: ${system.star?.name || 'Central Star'}`);
    setSelectedStar(true);
    setSelectedPlanet(null);
  };

  const handleBackgroundClick = () => {
    console.log('Clicked system background');
    setSelectedPlanet(null);
    setSelectedStar(false);
  };

  // Get the star data from the system (we'll need to pass this)
  const star = system.star || { 
    radius: 1, 
    spectralClass: 'G', 
    temperature: 5778,
    name: 'Central Star'
  };

  return (
    <group onClick={handleBackgroundClick}>
      {/* Central star with strong bloom effect scaled by radius */}
      <mesh 
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleStarClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[star.radius, 16, 16]} />
        <meshStandardMaterial 
          color={SystemGenerator.getStarColor(star.spectralClass)}
          emissive={SystemGenerator.getStarColor(star.spectralClass)}
          emissiveIntensity={Math.max(2.0, star.radius * 1.2)}
        />
      </mesh>

      {/* Star selection ring */}
      {selectedStar && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[star.radius + 0.5, 16, 16]} />
          <meshBasicMaterial 
            color="#ffffff"
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}
      
      {/* Planets with selection rings */}
      {system.planets.map((planet: any) => {
        const PlanetWithSelection = () => {
          const planetRef = useRef<any>();
          const selectionRef = useRef<any>();
          
          useFrame((state, delta) => {
            // Sync both planet and selection ring positions
            const time = state.clock.getElapsedTime() * planet.orbitSpeed * 0.3;
            const x = Math.cos(time) * planet.orbitRadius * 10;
            const z = Math.sin(time) * planet.orbitRadius * 10;
            const y = Math.sin(planet.inclination || 0) * planet.orbitRadius * 2;
            
            if (planetRef.current) {
              planetRef.current.position.set(x, y, z);
              planetRef.current.rotation.y += planet.rotationSpeed * delta;
            }
            if (selectionRef.current && selectedPlanet?.id === planet.id) {
              selectionRef.current.position.set(x, y, z);
            }
          });
          
          return (
            <>
              <mesh 
                ref={planetRef}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanetClick(planet);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'auto';
                }}
              >
                <sphereGeometry args={[planet.radius * 0.1, 16, 16]} />
                <meshStandardMaterial 
                  color={SystemGenerator.getPlanetColor(planet.type)}
                  emissive={getPlanetEmissive(planet.type)}
                  emissiveIntensity={getPlanetEmissiveIntensity(planet.type)}
                  metalness={planet.type === 'nuclear_world' ? 0.8 : 0.1}
                  roughness={planet.type === 'gas_giant' ? 0.2 : 0.7}
                />
              </mesh>
              
              {/* Selection ring */}
              {selectedPlanet?.id === planet.id && (
                <mesh ref={selectionRef}>
                  <sphereGeometry args={[planet.radius * 0.1 + 0.3, 16, 16]} />
                  <meshBasicMaterial 
                    color="#ffffff"
                    transparent
                    opacity={0.4}
                    wireframe
                  />
                </mesh>
              )}
            </>
          );
        };
        
        return <PlanetWithSelection key={planet.id} />;
      })}

      {/* Information Panel */}
      {(selectedPlanet || selectedStar) && (
        <Html position={[15, 8, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bg-black/80 text-white p-4 rounded-lg min-w-64 backdrop-blur">
            {selectedStar ? (
              <div>
                <h3 className="text-lg font-bold text-blue-300">{star.name}</h3>
                <p className="text-sm text-gray-300 mb-2">Central Star</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-blue-200">Spectral Class:</span> {star.spectralClass}</p>
                  <p><span className="text-blue-200">Radius:</span> {star.radius.toFixed(2)} R☉</p>
                  <p><span className="text-blue-200">Temperature:</span> {star.temperature?.toFixed(0)} K</p>
                  <p><span className="text-blue-200">Mass:</span> {star.mass?.toFixed(2)} M☉</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-green-300">{selectedPlanet.name}</h3>
                <p className="text-sm text-gray-300 mb-2 capitalize">{selectedPlanet.type.replace('_', ' ')}</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-green-200">Radius:</span> {selectedPlanet.radius.toFixed(2)} R⊕</p>
                  <p><span className="text-green-200">Mass:</span> {selectedPlanet.mass.toFixed(2)} M⊕</p>
                  <p><span className="text-green-200">Orbit:</span> {selectedPlanet.orbitRadius.toFixed(2)} AU</p>
                  <p><span className="text-green-200">Temperature:</span> {selectedPlanet.temperature.toFixed(0)} K</p>
                  {selectedPlanet.atmosphere.length > 0 && (
                    <div>
                      <p className="text-green-200">Atmosphere:</p>
                      <p className="text-xs text-gray-400">{selectedPlanet.atmosphere.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}