import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { CameraController } from "./components/3d/CameraController";

// Define control keys
const controls = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
  { name: "up", keys: ["KeyQ"] },
  { name: "down", keys: ["KeyE"] },
];

function MinimalUniverse() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="yellow" />
    </mesh>
  );
}

function App() {
  const [showSelector, setShowSelector] = useState(true);

  const handleStart = () => {
    setShowSelector(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <KeyboardControls map={controls}>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          {!showSelector && (
            <>
              <CameraController />
              <MinimalUniverse />
            </>
          )}
        </Canvas>
      </KeyboardControls>

      {showSelector && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'black',
          color: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          zIndex: 100
        }}>
          <h1>3D Universe Mapper</h1>
          <button 
            onClick={handleStart}
            style={{
              background: 'blue',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '20px'
            }}
          >
            Start Sandbox Mode
          </button>
        </div>
      )}
    </div>
  );
}

export default App;