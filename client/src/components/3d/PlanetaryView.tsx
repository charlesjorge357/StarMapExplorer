import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SurfaceFeature } from '../../../shared/schema';

interface PlanetaryViewProps {
  planet: any;
  selectedFeature: SurfaceFeature | null;
  onFeatureClick: (feature: SurfaceFeature | null) => void;
}

interface SurfaceFeatureMeshProps {
  feature: SurfaceFeature;
  planetRadius: number;
  isSelected: boolean;
  onClick: (feature: SurfaceFeature) => void;
}

function SurfaceFeatureMesh({ feature, planetRadius, isSelected, onClick }: SurfaceFeatureMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Convert lat/lon to 3D position on sphere
  const position = useMemo(() => {
    const [lat, lon] = feature.position;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = planetRadius * 1.02 * Math.sin(phi) * Math.cos(theta);
    const y = planetRadius * 1.02 * Math.cos(phi);
    const z = planetRadius * 1.02 * Math.sin(phi) * Math.sin(theta);
    
    return [x, y, z] as [number, number, number];
  }, [feature.position, planetRadius]);

  // Get light color based on technology level
  const getLightColor = () => {
    switch (feature.technology) {
      case 'primitive': return '#FFA500'; // Orange firelight
      case 'industrial': return '#FFD700'; // Yellow industrial light
      case 'advanced': return '#00BFFF'; // Blue advanced light
      default: return '#FFFFFF'; // White default
    }
  };

  // Get feature size based on type and size
  const getFeatureSize = () => {
    const baseSize = feature.type === 'city' ? 0.3 : feature.type === 'fort' ? 0.2 : 0.15;
    const sizeMultiplier = feature.size === 'large' ? 1.5 : feature.size === 'medium' ? 1.2 : 1.0;
    return baseSize * sizeMultiplier;
  };

  // Get light intensity based on size and population
  const getLightIntensity = () => {
    const baseIntensity = feature.type === 'city' ? 1.0 : 0.5;
    const sizeMultiplier = feature.size === 'large' ? 2.0 : feature.size === 'medium' ? 1.5 : 1.0;
    const popMultiplier = feature.population ? Math.log10(feature.population) / 6 : 1.0;
    
    return Math.min(baseIntensity * sizeMultiplier * popMultiplier, 3.0);
  };

  // Flickering animation for city lights
  useFrame((state) => {
    if (meshRef.current && feature.type === 'city') {
      const time = state.clock.getElapsedTime();
      const flicker = 0.8 + Math.sin(time * 10 + feature.position[0]) * 0.1 + Math.sin(time * 7 + feature.position[1]) * 0.1;
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0.3, flicker * 0.8);
    }
  });

  const handleClick = (event: any) => {
    event.stopPropagation();
    onClick(feature);
  };

  return (
    <group position={position}>
      {/* Main feature marker */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[getFeatureSize(), 8, 8]} />
        <meshBasicMaterial 
          color={getLightColor()}
          transparent
          opacity={0.8}
          emissive={getLightColor()}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Selection ring for selected feature */}
      {isSelected && (
        <mesh>
          <torusGeometry args={[getFeatureSize() * 1.5, getFeatureSize() * 0.1, 8, 16]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Light cluster for larger cities */}
      {feature.type === 'city' && feature.size !== 'small' && (
        <>
          {Array.from({ length: feature.size === 'large' ? 8 : 4 }, (_, i) => {
            const angle = (i / (feature.size === 'large' ? 8 : 4)) * Math.PI * 2;
            const radius = feature.size === 'large' ? 1.0 : 0.5;
            const offsetX = Math.cos(angle) * radius;
            const offsetZ = Math.sin(angle) * radius;
            
            return (
              <mesh key={i} position={[offsetX, 0, offsetZ]}>
                <sphereGeometry args={[0.1, 6, 6]} />
                <meshBasicMaterial 
                  color={getLightColor()}
                  transparent
                  opacity={0.6}
                  emissive={getLightColor()}
                  emissiveIntensity={0.3}
                />
              </mesh>
            );
          })}
        </>
      )}

      {/* Point light for illumination */}
      <pointLight
        color={getLightColor()}
        intensity={getLightIntensity()}
        distance={planetRadius}
        decay={2}
      />
    </group>
  );
}

export function PlanetaryView({ planet, selectedFeature, onFeatureClick }: PlanetaryViewProps) {
  console.log('PlanetaryView render:', {
    planet: planet?.name,
    planetType: planet?.type,
    surfaceFeatures: planet?.surfaceFeatures?.length,
    selectedFeature: selectedFeature?.name,
    planetRadius: planet?.radius
  });

  const { camera } = useThree();
  const planetRef = useRef<THREE.Mesh>(null);
  const planetRadius = planet?.radius ? planet.radius * 10 : 5;

  // Load textures for different planet types
  const getTextureForPlanet = (planetType: string, textureIndex: number = 0) => {
    const texturePaths: Record<string, string[]> = {
      'gas_giant': ['/attached_assets/2k_jupiter_1750720210242.jpg'],
      'frost_giant': ['/attached_assets/2k_uranus_1750633974238.jpg', '/attached_assets/2k_neptune_1750633977824.jpg'],
      'arid_world': ['/attached_assets/2k_mars_1750720210242.jpg', '/attached_assets/2k_venus_surface_1750720210241.jpg'],
      'verdant_world': ['/attached_assets/2k_terrestrial1_1750721706116.jpg', '/attached_assets/2k_terrestrial2_1750721704007.jpg', '/attached_assets/2k_terrestrial3_1750721701962.png'],
      'acidic_world': ['/attached_assets/2k_venus_atmosphere_1750720210240.jpg'],
      'nuclear_world': ['/attached_assets/2k_ceres_fictional_1750720210241.jpg'],
      'ocean_world': ['/attached_assets/2k_ocean_planet_1750721323369.jpg'],
      'dead_world': ['/attached_assets/2k_mercury_1750720210243.jpg', '/attached_assets/2k_moon_1750720210243.jpg', '/attached_assets/2k_eris_fictional_1750720210241.jpg']
    };
    
    const paths = texturePaths[planetType] || texturePaths['dead_world'];
    return paths[textureIndex % paths.length];
  };

  let texture;
  try {
    const texturePath = getTextureForPlanet(planet.type, planet.textureIndex || 0);
    console.log(`Loading texture for ${planet.name}: ${texturePath}`);
    texture = useTexture(texturePath);
  } catch (error) {
    console.error(`Failed to load texture for ${planet?.type}:`, error);
    texture = null;
  }

  // Position camera for planetary view on component mount
  useEffect(() => {
    if (planet && camera) {
      console.log(`Setting camera for planetary view of ${planet.name}`);
      camera.position.set(0, 0, planetRadius * 2.5);
      camera.lookAt(0, 0, 0);
      camera.updateMatrix();
      camera.updateMatrixWorld(true);
    }
  }, [camera, planet, planetRadius]);

  if (!planet) {
    console.error('PlanetaryView: No planet data provided');
    return null;
  }

  if (!planet.surfaceFeatures || planet.surfaceFeatures.length === 0) {
    console.warn(`PlanetaryView: Planet ${planet.name} has no surface features`);
    return (
      <group>
        <mesh ref={planetRef}>
          <sphereGeometry args={[planetRadius, 64, 64]} />
          <meshStandardMaterial 
            map={texture}
            color="#ffffff"
            roughness={0.8}
          />
        </mesh>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="red" />
        </mesh>
      </group>
    );
  }

  console.log(`PlanetaryView: Rendering ${planet.name} with ${planet.surfaceFeatures.length} features`);
  planet.surfaceFeatures.forEach((feature, i) => {
    console.log(`Feature ${i}: ${feature.name} at [${feature.position[0]}, ${feature.position[1]}] type: ${feature.type}`);
  });

  // Handle background clicks to deselect features
  const handleBackgroundClick = (event: any) => {
    // Only deselect if clicking the planet surface, not features
    if (event.object === planetRef.current && selectedFeature) {
      onFeatureClick(null);
    }
  };

  return (
    <group>
      {/* Main planet */}
      <mesh
        ref={planetRef}
        onClick={handleBackgroundClick}
      >
        <sphereGeometry args={[planetRadius, 64, 32]} />
        {texture ? (
          <meshStandardMaterial 
            map={texture}
            color={planet.type === 'verdant_world' ? '#ffffff' : undefined}
          />
        ) : (
          <meshStandardMaterial color="#666666" />
        )}
      </mesh>

      {/* Atmospheric glow for gas planets */}
      {(planet.type === 'gas_giant' || planet.type === 'frost_giant') && (
        <mesh>
          <sphereGeometry args={[planetRadius * 1.05, 32, 16]} />
          <meshBasicMaterial 
            color={planet.type === 'gas_giant' ? '#ffa500' : '#87ceeb'} 
            transparent 
            opacity={0.1} 
          />
        </mesh>
      )}

      {/* Surface features with city lighting */}
      {planet.surfaceFeatures?.map((feature: SurfaceFeature) => (
        <SurfaceFeatureMesh
          key={feature.id}
          feature={feature}
          planetRadius={planetRadius}
          isSelected={selectedFeature?.id === feature.id}
          onClick={onFeatureClick}
        />
      ))}

      {/* Enhanced lighting setup for planetary view */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[planetRadius * 2, planetRadius, planetRadius * 2]} 
        intensity={0.8} 
        castShadow
      />
      
      {/* Secondary lighting for better surface visibility */}
      <directionalLight 
        position={[-planetRadius, -planetRadius, planetRadius]} 
        intensity={0.3} 
        color="#6495ed"
      />
    </group>
  );
}

export default PlanetaryView;