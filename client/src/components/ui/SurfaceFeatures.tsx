// SurfaceFeature.tsx
import { useMemo } from 'react'
import { MeshProps } from '@react-three/fiber'
import * as THREE from 'three'
import { SurfaceFeature } from '../shared/schema'

interface Props extends MeshProps {
  feature: SurfaceFeature
  planetRadius: number
  onClick: (f: SurfaceFeature) => void
}

export function SurfaceFeatureMarker({ feature, planetRadius, onClick, ...props }: Props) {
  // 1) Convert lat/lon → 3D point on sphere of radius=<planetRadius>
  const position = useMemo(() => {
    const [lat, lon] = feature.position
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    const x = -planetRadius * Math.sin(phi) * Math.cos(theta)
    const y =  planetRadius * Math.cos(phi)
    const z =  planetRadius * Math.sin(phi) * Math.sin(theta)
    return new THREE.Vector3(x, y, z)
  }, [feature.position, planetRadius])

  // 2) Size each marker relative to planet
  const markerSize = planetRadius * 0.02

  return (
    <mesh
      {...props}
      position={position}
      onClick={() => onClick(feature)}
      // make sure your scene has a Raycaster & pointer handling
    >
      <sphereGeometry args={[markerSize, 8, 8]} />
      <meshStandardMaterial color="gold" />
    </mesh>
  )
}
