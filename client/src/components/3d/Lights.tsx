import React from 'react';

export function Lights() {
  return (
    <>
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.2} />
      
      {/* Main directional light (sun-like) */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={250}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Fill light */}
      <directionalLight
        position={[-5, -5, -5]}
        intensity={0.3}
      />
      
      {/* Point light for depth */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.5}
        distance={5000}
      />
    </>
  );
}
