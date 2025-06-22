import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { SystemGenerator } from '../../lib/universe/SystemGenerator';
import * as THREE from 'three';

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

  // Make selection state available globally for main App UI
  (window as any).systemViewState = {
    selectedPlanet,
    selectedStar,
    star: system.star || { 
      radius: 1, 
      spectralClass: 'G', 
      temperature: 5778,
      name: 'Central Star',
      mass: 1
    }
  };



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

  // Navigation mode selection logic
  useFrame(() => {
    if (!mouseMode) {
      // In navigation mode, use raycasting to detect what's in the center
      const raycaster = new THREE.Raycaster();
      const camera = useThree.getState().camera;
      
      // Cast ray from camera center
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      
      // Check for intersections with planets and star
      // This is a simplified approach - in a real implementation you'd check specific objects
      // For now, we'll trigger selection based on distance to camera center
      const cameraPosition = camera.position;
      
      // Check distance to star (at origin)
      const starDistance = cameraPosition.distanceTo(new THREE.Vector3(0, 0, 0));
      
      // Check distance to planets
      let closestPlanet = null;
      let closestDistance = Infinity;
      
      planets.forEach((planet: any) => {
        const planetWorldPos = new THREE.Vector3(
          planet.orbitRadius * Math.cos(planet.orbitSpeed * Date.now() * 0.001),
          0,
          planet.orbitRadius * Math.sin(planet.orbitSpeed * Date.now() * 0.001)
        );
        const distance = cameraPosition.distanceTo(planetWorldPos);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPlanet = planet;
        }
      });
      
      // Select based on proximity (simplified logic)
      if (starDistance < 20 && (closestDistance > starDistance || closestDistance > 30)) {
        if (!(window as any).systemViewState?.selectedStar) {
          handleStarClick();
        }
      } else if (closestDistance < 15 && closestPlanet) {
        if ((window as any).systemViewState?.selectedPlanet?.id !== closestPlanet.id) {
          handlePlanetClick(closestPlanet);
        }
      }
    }
  });

  return (
    <group onClick={handleBackgroundClick}>
      {/* Central star with strong bloom effect scaled by radius */}
      <mesh 
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleStarClick(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (mouseMode) document.body.style.cursor = 'pointer';
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
                  handlePlanetClick(planet, e);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  if (mouseMode) document.body.style.cursor = 'pointer';
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
              
              {/* Selection ring - scaled to visual planet size */}
              {selectedPlanet?.id === planet.id && (
                <mesh ref={selectionRef}>
                  <sphereGeometry args={[planet.radius * 0.1 + 0.05, 16, 16]} />
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



    </group>
  );
}