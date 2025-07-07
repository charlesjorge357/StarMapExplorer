// SurfaceFeatureMarker.tsx

import { useMemo } from 'react'
import { MeshProps } from '@react-three/fiber'
import * as THREE from 'three'
import { SurfaceFeature } from 'shared/schema'

// 1) Omit the default onClick so we can define our own
interface Props extends Omit<MeshProps, 'onClick'> {
  feature: SurfaceFeature
  planetRadius: number
  onFeatureClick: (feature: SurfaceFeature) => void
}

export function SurfaceFeatureMarker({
  feature,
  planetRadius,
  onFeatureClick,
  ...meshProps
}: Props) {
  // Convert lat/lon → 3D position and calculate orientation
  const { position, rotation } = useMemo(() => {
    const [lat, lon] = feature.position
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    const x = -planetRadius * Math.sin(phi) * Math.cos(theta)
    const y =  planetRadius * Math.cos(phi)
    const z =  planetRadius * Math.sin(phi) * Math.sin(theta)
    
    // Surface position, directly on the planet surface
    const surfacePos = new THREE.Vector3(x, y, z)
    
    // Calculate rotation to orient model toward planet center
    // The surface normal points away from planet center
    const surfaceNormal = surfacePos.clone().normalize()
    
    // Create a rotation that aligns the model's "up" direction with the surface normal
    // This makes the bottom of the model face the planet center
    const up = new THREE.Vector3(0, 1, 0)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, surfaceNormal)
    const euler = new THREE.Euler().setFromQuaternion(quaternion)
    
    return {
      position: surfacePos,
      rotation: euler
    }
  }, [feature.position, planetRadius])

  const markerSize = planetRadius * 0.02

  // Different models for different feature types
  const renderFeatureModel = () => {
    switch (feature.type) {
      case 'city':
        return (
          <group>
            {/* City skyline - multiple buildings */}
            <mesh position={[0, markerSize * 0.5, 0]}>
              <boxGeometry args={[markerSize * 1.2, markerSize, markerSize * 1.2]} />
              <meshStandardMaterial color="#666666" />
            </mesh>
            <mesh position={[markerSize * 0.3, markerSize * 0.8, markerSize * 0.3]}>
              <boxGeometry args={[markerSize * 0.6, markerSize * 1.6, markerSize * 0.6]} />
              <meshStandardMaterial color="#888888" />
            </mesh>
            <mesh position={[-markerSize * 0.3, markerSize * 0.6, -markerSize * 0.2]}>
              <boxGeometry args={[markerSize * 0.4, markerSize * 1.2, markerSize * 0.4]} />
              <meshStandardMaterial color="#777777" />
            </mesh>
            {/* City lights */}
            <pointLight
              position={[0, markerSize * 0.5, 0]}
              color="#ffff88"
              intensity={0.5}
              distance={markerSize * 3}
            />
          </group>
        );

      case 'fort':
        return (
          <group>
            {/* Fort structure - castle-like */}
            <mesh position={[0, markerSize * 0.4, 0]}>
              <boxGeometry args={[markerSize * 1.5, markerSize * 0.8, markerSize * 1.5]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            {/* Corner towers */}
            <mesh position={[markerSize * 0.6, markerSize * 0.8, markerSize * 0.6]}>
              <cylinderGeometry args={[markerSize * 0.2, markerSize * 0.2, markerSize * 1.6, 8]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            <mesh position={[-markerSize * 0.6, markerSize * 0.8, markerSize * 0.6]}>
              <cylinderGeometry args={[markerSize * 0.2, markerSize * 0.2, markerSize * 1.6, 8]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            <mesh position={[markerSize * 0.6, markerSize * 0.8, -markerSize * 0.6]}>
              <cylinderGeometry args={[markerSize * 0.2, markerSize * 0.2, markerSize * 1.6, 8]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            <mesh position={[-markerSize * 0.6, markerSize * 0.8, -markerSize * 0.6]}>
              <cylinderGeometry args={[markerSize * 0.2, markerSize * 0.2, markerSize * 1.6, 8]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
          </group>
        );

      case 'landmark':
        return (
          <group>
            {/* Landmark - crystal/monument structure */}
            <mesh position={[0, markerSize * 0.8, 0]}>
              <coneGeometry args={[markerSize * 0.6, markerSize * 1.6, 6]} />
              <meshStandardMaterial 
                color="#4169E1" 
                emissive="#001155"
                emissiveIntensity={0.3}
                transparent
                opacity={0.8}
              />
            </mesh>
            {/* Base */}
            <mesh position={[0, markerSize * 0.1, 0]}>
              <cylinderGeometry args={[markerSize * 0.8, markerSize * 0.8, markerSize * 0.2, 8]} />
              <meshStandardMaterial color="#696969" />
            </mesh>
            {/* Landmark glow */}
            <pointLight
              position={[0, markerSize * 0.8, 0]}
              color="#4169E1"
              intensity={0.3}
              distance={markerSize * 4}
            />
          </group>
        );

      default:
        return (
          <mesh>
            <sphereGeometry args={[markerSize, 8, 8]} />
            <meshStandardMaterial color="gold" />
          </mesh>
        );
    }
  };

  return (
    <group
      {...meshProps}
      position={position}
      rotation={rotation}
      onClick={() => onFeatureClick(feature)}
      userData={{ feature: feature, featureId: feature.id }}
    >
      {renderFeatureModel()}
    </group>
  )
}
