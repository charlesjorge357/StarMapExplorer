import React from 'react';
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useUniverse } from "../../lib/stores/useUniverse";
import { GalacticView } from "../3d/GalacticView";
import { SystemView } from "../3d/SystemView";
import { PlanetaryView } from "../3d/PlanetaryView";
import { CameraController } from "../3d/CameraController";
import { Lights } from "../3d/Lights";

const controls = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
  { name: "up", keys: ["KeyQ"] },
  { name: "down", keys: ["KeyE"] },
  { name: "boost", keys: ["ShiftLeft", "ShiftRight"] },
];

export function MinimalApp() {
  const { currentScope } = useUniverse();

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <KeyboardControls map={controls}>
        <Canvas
          shadows
          camera={{
            position: [0, 0, 10],
            fov: 75,
            near: 0.1,
            far: 100000
          }}
        >
          <color attach="background" args={["#000011"]} />
          <Lights />
          
          <Suspense fallback={null}>
            <CameraController />
            {currentScope === 'galactic' && <GalacticView />}
            {currentScope === 'system' && <SystemView />}
            {currentScope === 'planetary' && <PlanetaryView />}
          </Suspense>
        </Canvas>
        
        {/* Simple status overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: 'white',
          background: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          pointerEvents: 'none'
        }}>
          Current Scope: {currentScope}
        </div>
      </KeyboardControls>
    </div>
  );
}