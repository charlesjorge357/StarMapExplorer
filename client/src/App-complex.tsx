import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useUniverse } from "./lib/stores/useUniverse";
import { useCamera } from "./lib/stores/useCamera";
import "@fontsource/inter";

// Import core 3D components only
import { GalacticView } from "./components/3d/GalacticView";
import { SystemView } from "./components/3d/SystemView";
import { PlanetaryView } from "./components/3d/PlanetaryView";
import { CameraController } from "./components/3d/CameraController";
import { Lights } from "./components/3d/Lights";
import { ModeSelector } from "./components/ui/ModeSelector";

// Define control keys
const controls = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
  { name: "up", keys: ["KeyQ"] },
  { name: "down", keys: ["KeyE"] },
  { name: "boost", keys: ["ShiftLeft", "ShiftRight"] },
];

function App() {
  const { currentScope, initialize, universeData, isLoading } = useUniverse();
  const { isTransitioning } = useCamera();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show mode selector if no universe data is loaded
  const showModeSelector = !universeData && !isLoading;

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
          gl={{
            antialias: true,
            powerPreference: "high-performance"
          }}
        >
          <color attach="background" args={["#000011"]} />
          
          <Lights />
          
          <Suspense fallback={null}>
            <CameraController />
            
            {universeData && currentScope === 'galactic' && <GalacticView />}
            {universeData && currentScope === 'system' && <SystemView />}
            {universeData && currentScope === 'planetary' && <PlanetaryView />}
          </Suspense>
        </Canvas>

        {/* Mode Selector */}
        {showModeSelector && <ModeSelector />}

        {/* Status overlay - only show when universe is loaded */}
        {universeData && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            color: 'white',
            background: 'rgba(0,0,0,0.7)',
            padding: '10px',
            borderRadius: '5px',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            3D Universe Mapper - Current Scope: {currentScope || 'loading'}
          </div>
        )}
        
        {isTransitioning && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '24px',
            pointerEvents: 'none',
            zIndex: 20
          }}>
            Transitioning...
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '18px',
            pointerEvents: 'none',
            zIndex: 30,
            background: 'rgba(0,0,0,0.8)',
            padding: '20px',
            borderRadius: '8px'
          }}>
            Generating universe...
          </div>
        )}
      </KeyboardControls>
    </div>
  );
}

export default App;