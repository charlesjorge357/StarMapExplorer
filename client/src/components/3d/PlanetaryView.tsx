import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetaryViewProps {
  planet: any;
  selectedFeature: any;
  onFeatureClick: (feature: any) => void;
}

function sphericalToCartesian(radius: number, lat: number, lon: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

export function PlanetaryView({ planet, selectedFeatureType, onFeaturePlaced }: PlanetaryViewProps) {
  const [isHeld, setIsHeld] = useState(false);
  const { camera, gl } = useThree();
  const planetRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const planetRadius = planet?.radius ? planet.radius * 15 : 10;

  const handlePlanetClick = (event: THREE.Event) => {
    if (!selectedFeatureType || !planetRef.current) return;

    const point = event.point;
    const local = new THREE.Vector3();
    planetRef.current.worldToLocal(local.copy(point));

    const lat = 90 - (Math.acos(local.y / planetRadius) * 180 / Math.PI);
    const lon = Math.atan2(local.z, local.x) * 180 / Math.PI;

    const newFeature = {
      type: selectedFeatureType,
      lat,
      lon,
      name: `${selectedFeatureType} ${planet.features?.length + 1 || 1}`
    };

    onFeaturePlaced(newFeature);
  };

  const getTextureForPlanet = (planetType: string, textureIndex: number = 0) => {
    const texturePaths: Record<string, string[]> = {
      'gas_giant': ['/textures/jupiter.jpg'],
      'frost_giant': ['/textures/uranus.jpg', '/textures/neptune.jpg'],
      'arid_world': ['/textures/mars.jpg', '/textures/venus_surface.jpg'],
      'verdant_world': ['/textures/terrestrial1.jpg', '/textures/terrestrial2.jpg', '/textures/terrestrial3.png'],
      'acidic_world': ['/textures/venus_atmosphere.jpg'],
      'nuclear_world': ['/textures/ceres.jpg'],
      'ocean_world': ['/textures/ocean.jpg'],
      'dead_world': ['/textures/mercury.jpg', '/textures/moon.jpg', '/textures/eris.jpg']
    };
    const paths = texturePaths[planetType] || texturePaths['dead_world'];
    return paths[textureIndex % paths.length];
  };

  let texture;
  try {
    const texturePath = getTextureForPlanet(planet.type, planet.textureIndex || 0);
    texture = useTexture(texturePath);
  } catch (error) {
    console.error(`Failed to load texture for ${planet?.type}:`, error);
    texture = null;
  }

  const mouseState = useRef({
    isDown: false,
    lastX: 0,
    lastY: 0,
    rotationX: 0,
    rotationY: 0
  });

  useEffect(() => {
    if (camera && planet) {
      const distance = planetRadius * 1.8;
      camera.position.set(0, 0, distance);
      camera.lookAt(0, 0, 0);
      camera.updateMatrix();
      camera.updateMatrixWorld(true);
      mouseState.current.rotationX = 0;
      mouseState.current.rotationY = 0;
    }
  }, [camera, planet, planetRadius]);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = (event: MouseEvent) => {
      mouseState.current.isDown = true;
      mouseState.current.lastX = event.clientX;
      mouseState.current.lastY = event.clientY;
      canvas.style.cursor = 'grabbing';
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseState.current.isDown || !groupRef.current) return;

      const deltaX = event.clientX - mouseState.current.lastX;
      const deltaY = event.clientY - mouseState.current.lastY;

      mouseState.current.rotationY += deltaX * 0.005;
      mouseState.current.rotationX += deltaY * 0.005;
      mouseState.current.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseState.current.rotationX));

      groupRef.current.rotation.y = mouseState.current.rotationY;
      groupRef.current.rotation.x = mouseState.current.rotationX;

      mouseState.current.lastX = event.clientX;
      mouseState.current.lastY = event.clientY;
    };

    const handleMouseUp = () => {
      mouseState.current.isDown = false;
      canvas.style.cursor = 'grab';
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      const direction = event.deltaY > 0 ? 1 : -1;
      const currentDistance = camera.position.length();
      const minDistance = planetRadius * 1.2;
      const maxDistance = planetRadius * 5;

      const newDistance = Math.max(minDistance, Math.min(maxDistance, currentDistance + direction * zoomSpeed * planetRadius));
      camera.position.normalize().multiplyScalar(newDistance);
      camera.updateMatrix();
      camera.updateMatrixWorld(true);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.style.cursor = 'grab';

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.style.cursor = 'auto';
    };
  }, [gl, camera, planetRadius]);

  useFrame(() => {
    if (planetRef.current && !isHeld) {
      planetRef.current.rotation.y += 0.001;
    }
  });

  if (!planet) return null;

  return (
    <group ref={groupRef}>
      <mesh
        ref={planetRef}
        onClick={handlePlanetClick}
        onPointerDown={() => setIsHeld(true)}
        onPointerUp={() => setIsHeld(false)}
        onPointerLeave={() => setIsHeld(false)}
      >
        <sphereGeometry args={[planetRadius, 128, 64]} />
        <meshStandardMaterial
          color={planet.computedColor || (texture ? '#ffffff' : '#666666')}
          emissive={planet.computedGlow || '#000000'}
          emissiveIntensity={
            planet.computedEmissiveIntensity !== undefined
              ? planet.computedEmissiveIntensity
              : texture
              ? 0.1
              : 0.2
          }
          map={texture}
          roughness={planet.type === 'gas_giant' || planet.type === 'frost_giant' ? 0.1 : 0.8}
          metalness={planet.type === 'nuclear_world' ? 0.7 : 0.1}
        />
        {planet.features?.map((feature: any, index: number) => {
          const position = sphericalToCartesian(planetRadius + 0.5, feature.lat, feature.lon);
          return (
            <mesh key={index} position={position}>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshStandardMaterial
                color={
                  feature.type === 'city'
                    ? 'blue'
                    : feature.type === 'fort'
                    ? 'red'
                    : 'green'
                }
              />
            </mesh>
          );
        })}
      </mesh>

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
