import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useUniverse } from '../../lib/stores/useUniverse';
import { useCamera } from '../../lib/stores/useCamera';
import { PlanetGenerator } from '../../lib/universe/PlanetGenerator';
import { Planet, AsteroidBelt } from '../../shared/schema';

interface PlanetMeshProps {
  planet: Planet;
  onClick: (planet: Planet) => void;
  isSelected: boolean;
}

function PlanetMesh({ planet, onClick, isSelected }: PlanetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const color = PlanetGenerator.getPlanetColor(planet.type);
  const scale = Math.max(0.2, Math.min(2, planet.radius * 0.3));

  useFrame((state) => {
    if (meshRef.current) {
      // Orbital rotation
      const angle = state.clock.elapsedTime * planet.orbitSpeed;
      meshRef.current.position.x = planet.orbitRadius * Math.cos(angle) * 10;
      meshRef.current.position.z = planet.orbitRadius * Math.sin(angle) * 10;
      
      // Planet rotation
      meshRef.current.rotation.y += planet.rotationSpeed * 0.1;
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(planet);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[scale, 16, 12]} />
        <meshLambertMaterial 
          color={color}
          emissive={isSelected ? new THREE.Color(color).multiplyScalar(0.3) : new THREE.Color(0x000000)}
        />
      </mesh>
      
      {/* Orbit line */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[planet.orbitRadius * 10 - 0.1, planet.orbitRadius * 10 + 0.1, 64]} />
        <meshBasicMaterial color="#333333" transparent opacity={0.3} />
      </mesh>
      
      {(hovered || isSelected) && (
        <Text
          position={[planet.orbitRadius * 10, scale + 1, 0]}
          fontSize={0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {planet.name}
        </Text>
      )}
      
      {(hovered || isSelected) && (
        <Text
          position={[planet.orbitRadius * 10, scale + 0.2, 0]}
          fontSize={0.4}
          color="lightblue"
          anchorX="center"
          anchorY="middle"
        >
          {planet.type.replace('_', ' ')} • {planet.moons.length} moons
        </Text>
      )}
    </group>
  );
}

interface AsteroidBeltMeshProps {
  belt: AsteroidBelt;
}

function AsteroidBeltMesh({ belt }: AsteroidBeltMeshProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < belt.asteroidCount; i++) {
      const angle = (i / belt.asteroidCount) * Math.PI * 2;
      const radius = belt.innerRadius + Math.random() * (belt.outerRadius - belt.innerRadius);
      const x = radius * Math.cos(angle) * 10;
      const z = radius * Math.sin(angle) * 10;
      const y = (Math.random() - 0.5) * 2;
      
      positions.push(x, y, z);
    }
    
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [belt]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001; // Slow rotation
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.3} color="#888888" />
    </points>
  );
}

export function SystemView() {
  const { selectedStar, selectedSystem, selectedPlanet, selectPlanet, setScope } = useUniverse();
  const { transitionTo } = useCamera();
  
  if (!selectedStar || !selectedSystem) {
    return (
      <Text
        position={[0, 0, 0]}
        fontSize={2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        No system selected
      </Text>
    );
  }

  const handlePlanetClick = (planet: Planet) => {
    console.log("Planet clicked:", planet.name);
    selectPlanet(planet);
    
    // Transition to planet view
    const planetPos = new THREE.Vector3(
      planet.orbitRadius * 10,
      0,
      0
    );
    const cameraPos = planetPos.clone().add(new THREE.Vector3(5, 3, 5));
    
    transitionTo(cameraPos, planetPos, 2000);
    
    // After transition, switch to planetary view
    setTimeout(() => {
      setScope('planetary');
    }, 2000);
  };

  return (
    <group>
      {/* Central star */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 16, 12]} />
        <meshBasicMaterial 
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      <Text
        position={[0, 3, 0]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {selectedStar.name}
      </Text>
      
      {/* Planets */}
      {selectedSystem.planets.map((planet) => (
        <PlanetMesh
          key={planet.id}
          planet={planet}
          onClick={handlePlanetClick}
          isSelected={selectedPlanet?.id === planet.id}
        />
      ))}
      
      {/* Asteroid belts */}
      {selectedSystem.asteroidBelts.map((belt) => (
        <AsteroidBeltMesh key={belt.id} belt={belt} />
      ))}
      
      {/* Reference grid */}
      <gridHelper args={[200, 20]} position={[0, -20, 0]} />
      
      {/* System info */}
      <Text
        position={[0, 50, 0]}
        fontSize={3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        System View - Click on planets to explore
      </Text>
    </group>
  );
}
