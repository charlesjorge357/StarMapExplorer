import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useUniverse } from '../../lib/stores/useUniverse';
import { PlanetGenerator } from '../../lib/universe/PlanetGenerator';
import { SurfaceFeature } from '../../shared/schema';

interface SurfaceFeatureMesh {
  feature: SurfaceFeature;
  planetRadius: number;
  onClick: (feature: SurfaceFeature) => void;
}

function SurfaceFeatureMesh({ feature, planetRadius, onClick }: SurfaceFeatureMesh) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Convert lat/lon to 3D position on sphere
  const position = useMemo(() => {
    const lat = (feature.position[0] * Math.PI) / 180;
    const lon = (feature.position[1] * Math.PI) / 180;
    
    const x = planetRadius * Math.cos(lat) * Math.cos(lon);
    const y = planetRadius * Math.sin(lat);
    const z = planetRadius * Math.cos(lat) * Math.sin(lon);
    
    return [x, y, z] as [number, number, number];
  }, [feature.position, planetRadius]);

  const color = feature.type === 'city' ? '#ffff00' : 
                feature.type === 'fort' ? '#ff0000' : '#00ff00';

  const geometry = feature.type === 'city' ? 'box' :
                   feature.type === 'fort' ? 'cone' : 'sphere';

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(feature);
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
        {geometry === 'box' && <boxGeometry args={[0.3, 0.3, 0.3]} />}
        {geometry === 'cone' && <coneGeometry args={[0.2, 0.4, 6]} />}
        {geometry === 'sphere' && <sphereGeometry args={[0.15, 8, 6]} />}
        <meshLambertMaterial color={color} />
      </mesh>
      
      {hovered && (
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI, 0]}
        >
          {feature.name}
        </Text>
      )}
    </group>
  );
}

export function PlanetaryView() {
  const { selectedPlanet } = useUniverse();
  const planetRef = useRef<THREE.Mesh>(null);
  const [selectedFeature, setSelectedFeature] = useState<SurfaceFeature | null>(null);
  
  if (!selectedPlanet) {
    return (
      <Text
        position={[0, 0, 0]}
        fontSize={2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        No planet selected
      </Text>
    );
  }

  const planetRadius = Math.max(3, selectedPlanet.radius * 2);
  const color = PlanetGenerator.getPlanetColor(selectedPlanet.type);

  // Generate surface features if none exist
  if (selectedPlanet.surfaceFeatures.length === 0) {
    selectedPlanet.surfaceFeatures = PlanetGenerator.generateSurfaceFeatures(selectedPlanet, 8);
  }

  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += selectedPlanet.rotationSpeed * 0.05;
    }
  });

  const handleFeatureClick = (feature: SurfaceFeature) => {
    console.log("Surface feature clicked:", feature.name);
    setSelectedFeature(feature);
  };

  return (
    <group>
      {/* Planet sphere */}
      <mesh ref={planetRef} position={[0, 0, 0]}>
        <sphereGeometry args={[planetRadius, 32, 24]} />
        <meshLambertMaterial color={color} />
      </mesh>
      
      {/* Surface features */}
      {selectedPlanet.surfaceFeatures.map((feature) => (
        <SurfaceFeatureMesh
          key={feature.id}
          feature={feature}
          planetRadius={planetRadius + 0.1}
          onClick={handleFeatureClick}
        />
      ))}
      
      {/* Planet info */}
      <Text
        position={[0, planetRadius + 3, 0]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {selectedPlanet.name}
      </Text>
      
      <Text
        position={[0, planetRadius + 2, 0]}
        fontSize={0.6}
        color="lightblue"
        anchorX="center"
        anchorY="middle"
      >
        {selectedPlanet.type.replace('_', ' ')} • {selectedPlanet.surfaceFeatures.length} features
      </Text>
      
      {/* Selected feature info */}
      {selectedFeature && (
        <group position={[planetRadius + 5, 0, 0]}>
          <Text
            position={[0, 2, 0]}
            fontSize={0.8}
            color="yellow"
            anchorX="center"
            anchorY="middle"
          >
            {selectedFeature.name}
          </Text>
          
          <Text
            position={[0, 1, 0]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Type: {selectedFeature.type}
          </Text>
          
          {selectedFeature.description && (
            <Text
              position={[0, 0, 0]}
              fontSize={0.4}
              color="lightgray"
              anchorX="center"
              anchorY="middle"
              maxWidth={8}
            >
              {selectedFeature.description}
            </Text>
          )}
        </group>
      )}
      
      {/* Navigation hint */}
      <Text
        position={[0, -planetRadius - 2, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Planetary View - Click on surface features to inspect
      </Text>
    </group>
  );
}
