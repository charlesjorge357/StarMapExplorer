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
  // Convert lat/lon → 3D position
  const position = useMemo(() => {
    const [lat, lon] = feature.position
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    const x = -planetRadius * Math.sin(phi) * Math.cos(theta)
    const y =  planetRadius * Math.cos(phi)
    const z =  planetRadius * Math.sin(phi) * Math.sin(theta)
    // push it just above the surface
    return new THREE.Vector3(x, y, z).multiplyScalar((planetRadius + 0.01) / planetRadius)
  }, [feature.position, planetRadius])

  const markerSize = planetRadius * 0.02

  return (
    <mesh
      {...meshProps}
      position={position}
      // call our prop instead of the MeshProps onClick
      onClick={() => onFeatureClick(feature)}
    >
      <sphereGeometry args={[markerSize, 8, 8]} />
      <meshStandardMaterial color="gold" />
    </mesh>
  )
}
