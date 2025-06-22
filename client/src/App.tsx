import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useState, useRef } from "react";
import { KeyboardControls } from "@react-three/drei";
import { CameraController } from "./components/3d/CameraController";
import { StarGenerator } from "./lib/universe/StarGenerator";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";

// Simple star type to avoid import issues
interface SimpleStar {
  id: string;
  name?: string;
  position: [number, number, number];
  radius: number;
  spectralClass: string;
  mass?: number;
  temperature?: number;
}

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

function SelectionRing({ star }: { star: SimpleStar }) {
  const { camera } = useThree();
  const ringRef = useRef<any>();

  useFrame(() => {
    if (ringRef.current) {
      // Make ring face camera
      ringRef.current.lookAt(camera.position);
    }
  });

  return (
    <mesh ref={ringRef} position={star.position}>
      <ringGeometry args={[1.5, 2, 16]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
    </mesh>
  );
}

function StarField() {
  const [stars, setStars] = useState<SimpleStar[]>([]);
  const [selectedStar, setSelectedStar] = useState<SimpleStar | null>(null);

  useEffect(() => {
    console.log("Generating stars...");
    const generatedStars = StarGenerator.generateStars(12345, 50);
    setStars(generatedStars);
    console.log(`Generated ${generatedStars.length} stars`);
  }, []);

  const handleStarClick = (star: SimpleStar) => {
    console.log("Selected star:", star.name || star.id);
    setSelectedStar(star);
  };

  return (
    <group>
      {stars.map((star) => {
        const isSelected = selectedStar?.id === star.id;
        return (
          <group key={star.id}>
            <mesh 
              position={star.position}
              onClick={(e) => {
                e.stopPropagation();
                handleStarClick(star);
              }}
            >
              <sphereGeometry args={[Math.max(star.radius * 0.3, 0.5), 8, 8]} />
              <meshStandardMaterial 
                color={StarGenerator.getStarColor(star.spectralClass)}
                emissive={StarGenerator.getStarColor(star.spectralClass)}
                emissiveIntensity={0.3}
              />
            </mesh>
            
            {/* Selection overlay */}
            {isSelected && (
              <mesh position={star.position}>
                <sphereGeometry args={[Math.max(star.radius * 0.3, 0.5) + 0.1, 8, 8]} />
                <meshBasicMaterial 
                  color="#ffffff"
                  transparent
                  opacity={0.3}
                  depthWrite={false}
                />
              </mesh>
            )}
          </group>
        );
      })}
      
      {/* Camera-facing selection ring */}
      {selectedStar && <SelectionRing star={selectedStar} />}
    </group>
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
          <color attach="background" args={["#000000"]} />
          <ambientLight intensity={0.1} />
          <directionalLight position={[10, 10, 5]} intensity={0.3} />
          {!showSelector && (
            <>
              <CameraController />
              <StarField />
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