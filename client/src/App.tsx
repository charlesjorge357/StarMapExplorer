import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useUniverse } from "./lib/stores/useUniverse";
import { useCamera } from "./lib/stores/useCamera";
import "@fontsource/inter";

// Import components
import { UniverseMapper } from "./components/ui/UniverseMapper";
import { NavigationBar } from "./components/ui/NavigationBar";
import { ObjectPanel } from "./components/ui/ObjectPanel";
// import { AdminPanel } from "./components/ui/AdminPanel";
import { GalacticView } from "./components/3d/GalacticView";
import { SystemView } from "./components/3d/SystemView";
import { PlanetaryView } from "./components/3d/PlanetaryView";
import { CameraController } from "./components/3d/CameraController";
import { Lights } from "./components/3d/Lights";

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
  const { currentScope, mode, initialize } = useUniverse();
  const { isTransitioning } = useCamera();

  useEffect(() => {
    initialize();
  }, [initialize]);

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
            
            {currentScope === 'galactic' && <GalacticView />}
            {currentScope === 'system' && <SystemView />}
            {currentScope === 'planetary' && <PlanetaryView />}
          </Suspense>
        </Canvas>

        {/* UI Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          <NavigationBar />
          <ObjectPanel />
          {/* Temporarily disable AdminPanel to fix rendering issues */}
          {/* {mode === 'lore' && <AdminPanel />} */}
          
          {isTransitioning && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '24px',
              pointerEvents: 'none'
            }}>
              Transitioning...
            </div>
          )}
        </div>
      </KeyboardControls>
    </div>
  );
}

export default App;
