import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetaryViewProps {
  planet: any;
  selectedFeature: any;
  onFeatureClick: (feature: any) => void;
  selectedFeatureType?: 'city' | 'fort' | 'landmark' | null;
  onFeatureTypeChange?: (type: 'city' | 'fort' | 'landmark' | null) => void;
}

function sphericalToCartesian(radius: number, lat: number, lon: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

// UI Component to be rendered outside Canvas
export function PlanetaryViewUI({ 
  planet, 
  selectedFeature, 
  onFeatureClick, 
  selectedFeatureType, 
  setSelectedFeatureType 
}: {
  planet: any;
  selectedFeature: any;
  onFeatureClick: (feature: any) => void;
  selectedFeatureType: 'city' | 'fort' | 'landmark' | null;
  setSelectedFeatureType: (type: 'city' | 'fort' | 'landmark' | null) => void;
}) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #444',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
        {planet.name} Surface
      </h3>
      
      {/* Feature type selection buttons */}
      <div style={{ marginBottom: '15px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.8 }}>
          Place Features:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button
            onClick={() => setSelectedFeatureType(selectedFeatureType === 'city' ? null : 'city')}
            style={{
              padding: '8px 12px',
              background: selectedFeatureType === 'city' ? '#4CAF50' : '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🏙️ City {selectedFeatureType === 'city' ? '(Active)' : ''}
          </button>
          <button
            onClick={() => setSelectedFeatureType(selectedFeatureType === 'fort' ? null : 'fort')}
            style={{
              padding: '8px 12px',
              background: selectedFeatureType === 'fort' ? '#4CAF50' : '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🏰 Fort {selectedFeatureType === 'fort' ? '(Active)' : ''}
          </button>
          <button
            onClick={() => setSelectedFeatureType(selectedFeatureType === 'landmark' ? null : 'landmark')}
            style={{
              padding: '8px 12px',
              background: selectedFeatureType === 'landmark' ? '#4CAF50' : '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🗿 Landmark {selectedFeatureType === 'landmark' ? '(Active)' : ''}
          </button>
        </div>
      </div>

      {/* Existing surface features list */}
      {planet.surfaceFeatures && planet.surfaceFeatures.length > 0 && (
        <div>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.8 }}>
            Surface Features ({planet.surfaceFeatures.length}):
          </p>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {planet.surfaceFeatures.map((feature: any, index: number) => (
              <div key={index} style={{
                fontSize: '11px',
                padding: '4px 8px',
                margin: '2px 0',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
              onClick={() => onFeatureClick(feature)}
              >
                {feature.type === 'city' ? '🏙️' : feature.type === 'fort' ? '🏰' : '🗿'} {feature.name}
                {feature.population && ` (Pop: ${feature.population.toLocaleString()})`}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedFeatureType && (
        <p style={{ margin: '10px 0 0 0', fontSize: '11px', opacity: 0.7 }}>
          Click on planet surface to place {selectedFeatureType}
        </p>
      )}
    </div>
  );
}

export function PlanetaryView({ planet, selectedFeature, onFeatureClick, selectedFeatureType = null, onFeatureTypeChange }: PlanetaryViewProps) {
  console.log('PlanetaryView: Rendering Google Earth-like view for', planet?.name);
  console.log('Planet computed properties:', {
    computedColor: planet?.computedColor,
    computedGlow: planet?.computedGlow,
    computedEmissiveIntensity: planet?.computedEmissiveIntensity
  });

  // Use local state if no external state management provided
  const [localSelectedFeatureType, setLocalSelectedFeatureType] = React.useState<'city' | 'fort' | 'landmark' | null>(null);
  const currentSelectedFeatureType = selectedFeatureType !== undefined ? selectedFeatureType : localSelectedFeatureType;
  const setSelectedFeatureType = onFeatureTypeChange || setLocalSelectedFeatureType;

  // Handle feature placement on planet surface
  const handleFeaturePlaced = (feature: any) => {
    console.log('Feature placed:', feature);
    // Add the new feature to the planet's surface features array
    if (planet && planet.surfaceFeatures) {
      planet.surfaceFeatures.push(feature);
    }
    // Clear selection after placement
    setSelectedFeatureType(null);
  };
  
  const { camera, gl } = useThree();
  const planetRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const planetRadius = planet?.radius ? planet.radius * 15 : 10;

  // Texture loading with error handling
  const getPlanetTextureForMaterial = (planetType: string, textureIndex: number) => {
    const texturePaths: Record<string, string[]> = {
      gas_giant: ['/textures/jupiter.jpg'],
      frost_giant: ['/textures/neptune.jpg', '/textures/uranus.jpg'],
      arid_world: ['/textures/mars.jpg', '/textures/venus_surface.jpg'],
      verdant_world: ['/textures/terrestrial1.jpg', '/textures/terrestrial2.jpg', '/textures/terrestrial3.png'],
      acidic_world: ['/textures/venus_atmosphere.jpg', '/textures/venus_surface.jpg'],
      nuclear_world: ['/textures/ceres.jpg', '/textures/eris.jpg'],
      ocean_world: ['/textures/ocean.jpg'],
      dead_world: ['/textures/moon.jpg', '/textures/mercury.jpg', '/textures/eris.jpg']
    };
    
    const paths = texturePaths[planetType] || texturePaths['dead_world'];
    return paths[textureIndex % paths.length];
  };

  // Load planet texture
  let texture;
  try {
    const texturePath = getPlanetTextureForMaterial(planet.type, planet.textureIndex || 0);
    texture = useTexture(texturePath);
  } catch (error) {
    console.warn('Failed to load planet texture:', error);
    texture = null;
  }

  // Mouse interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Handle surface clicks for feature placement
  const handleSurfaceClick = (event: any) => {
    if (!currentSelectedFeatureType) return;
    
    event.stopPropagation();
    
    // Get click position and convert to latitude/longitude
    const intersectionPoint = event.intersections?.[0]?.point || event.point;
    if (intersectionPoint) {
      // Convert 3D point to spherical coordinates
      const normalizedPoint = intersectionPoint.clone().normalize();
      const lat = Math.asin(normalizedPoint.y) * (180 / Math.PI);
      const lon = Math.atan2(normalizedPoint.z, normalizedPoint.x) * (180 / Math.PI);
      
      // Generate feature names based on type
      const featureNames = {
        city: ['New Harbor', 'Colonial Base', 'Port Aurora', 'Central City', 'Trade Hub'],
        fort: ['Defense Station', 'Bastion Prime', 'Citadel One', 'Stronghold Beta', 'Outpost Gamma'],
        landmark: ['Mystic Falls', 'Crystal Peaks', 'Titan Ridge', 'Ancient Ruins', 'Monument Valley']
      };
      
      const names = featureNames[currentSelectedFeatureType];
      const randomName = names[Math.floor(Math.random() * names.length)];
      
      // Create new feature
      const newFeature = {
        id: `feature-${Date.now()}`,
        type: currentSelectedFeatureType,
        name: randomName,
        position: [lat, lon],
        description: `A ${currentSelectedFeatureType} on ${planet.name}`,
        ...(currentSelectedFeatureType === 'city' && {
          population: Math.floor(Math.random() * 2000000) + 50000,
          size: Math.random() < 0.3 ? 'large' : Math.random() < 0.6 ? 'medium' : 'small',
          technology: Math.random() < 0.2 ? 'advanced' : Math.random() < 0.6 ? 'industrial' : 'primitive'
        }),
        ...(currentSelectedFeatureType === 'fort' && {
          size: Math.random() < 0.4 ? 'large' : Math.random() < 0.7 ? 'medium' : 'small',
          technology: Math.random() < 0.3 ? 'advanced' : Math.random() < 0.7 ? 'industrial' : 'primitive'
        }),
        ...(currentSelectedFeatureType === 'landmark' && {
          size: Math.random() < 0.3 ? 'large' : Math.random() < 0.6 ? 'medium' : 'small'
        })
      };
      
      handleFeaturePlaced(newFeature);
    }
  };

  // Mouse interaction handlers
  const handleMouseDown = (event: MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = event.clientX - lastMousePos.x;
    const deltaY = event.clientY - lastMousePos.y;
    
    setRotation(prev => ({
      x: prev.x + deltaY * 0.01,
      y: prev.y + deltaX * 0.01
    }));
    
    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    setZoom(prev => Math.max(0.5, Math.min(3, prev + event.deltaY * -0.001)));
  };

  // Set up mouse event listeners
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, lastMousePos]);

  // Apply rotation and zoom to planet group
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = rotation.x;
      groupRef.current.rotation.y = rotation.y;
      groupRef.current.scale.setScalar(zoom);
    }
  });

  return (
    <group ref={groupRef}>
        {/* Planet sphere with high detail */}
        <mesh ref={planetRef} onClick={handleSurfaceClick}>
          <sphereGeometry args={[planetRadius, 128, 64]} />
          <meshStandardMaterial 
            color={
              // Use computed values from SystemView if available, otherwise fallback
              planet.computedColor || (texture ? '#ffffff' : '#666666')
            }
            emissive={
              // Use computed glow from SystemView if available, otherwise fallback
              planet.computedGlow || '#000000'
            }
            emissiveIntensity={
              planet.computedEmissiveIntensity !== undefined ? planet.computedEmissiveIntensity : (texture ? 0.1 : 0.2)
            }
            map={texture}
            roughness={planet.type === 'gas_giant' || planet.type === 'frost_giant' ? 0.1 : 0.8}
            metalness={planet.type === 'nuclear_world' ? 0.7 : 0.1}
            transparent={false}
            opacity={1.0}
          />
        </mesh>

        {/* Surface features as small lights */}
        {planet.surfaceFeatures && planet.surfaceFeatures.map((feature: any, index: number) => {
          const [x, y, z] = sphericalToCartesian(planetRadius * 1.01, feature.position[0], feature.position[1]);
          
          // Get light color based on feature type and technology
          const getFeatureColor = () => {
            if (feature.type === 'city') {
              switch (feature.technology) {
                case 'advanced': return '#00ffff';
                case 'industrial': return '#ffff00';
                case 'primitive': return '#ff8800';
                default: return '#ffffff';
              }
            } else if (feature.type === 'fort') {
              return '#ff0000';
            } else {
              return '#00ff00';
            }
          };

          const intensity = feature.type === 'city' 
            ? Math.min(feature.population / 1000000, 1) * 2
            : feature.size === 'large' ? 1.5 : feature.size === 'medium' ? 1.0 : 0.5;

          return (
            <group key={index}>
              <mesh position={[x, y, z]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshBasicMaterial 
                  color={getFeatureColor()} 
                  emissive={getFeatureColor()}
                  emissiveIntensity={0.5}
                />
              </mesh>
              <pointLight 
                position={[x, y, z]} 
                color={getFeatureColor()} 
                intensity={intensity}
                distance={planetRadius * 0.3}
              />
            </group>
          );
        })}

        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[planetRadius * 2, planetRadius * 2, planetRadius * 2]}
          intensity={0.7}
          castShadow
        />
      </group>
    </>
  );
}