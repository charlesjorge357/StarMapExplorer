import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useState, useRef } from "react";
import { KeyboardControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { CameraController } from "./components/3d/CameraController";
import { SystemView } from "./components/3d/SystemView";
import { StarSkybox } from "./components/3d/StarSkybox";
import { StarfieldSkybox } from "./components/3d/StarfieldSkybox";
import { StarGenerator } from "./lib/universe/StarGenerator";
import { SystemGenerator } from "./lib/universe/SystemGenerator";
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

  useFrame((state) => {
    if (ringRef.current) {
      // Make ring face camera
      ringRef.current.lookAt(camera.position);
      
      // Gentle pulsing animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      ringRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={ringRef} position={star.position}>
      <ringGeometry args={[star.radius * 2.5 * 1.5, star.radius * 2.5 * 2, 16]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
    </mesh>
  );
}

function StarField({ 
  selectedStar, 
  setSelectedStar,
  stars
}: { 
  selectedStar: SimpleStar | null; 
  setSelectedStar: (star: SimpleStar | null) => void;
  stars: SimpleStar[];
}) {

  const handleStarClick = (star: SimpleStar, event: any) => {
    event.stopPropagation();
    if (selectedStar?.id === star.id) {
      // Unselect if clicking the same star
      console.log("Unselected star:", star.name || star.id);
      setSelectedStar(null);
    } else {
      // Select new star
      console.log("Selected star:", star.name || star.id);
      setSelectedStar(star);
    }
  };

  const handleBackgroundClick = () => {
    // Unselect when clicking empty space
    if (selectedStar) {
      console.log("Unselected star by clicking background");
      setSelectedStar(null);
    }
  };

  return (
    <group onClick={handleBackgroundClick}>
      {stars.map((star) => {
        const isSelected = selectedStar?.id === star.id;
        // Scale visual size by stellar radius, smaller minimum to show true variation
        const visualRadius = Math.max(0.3, star.radius * 0.4); 
        const hitboxRadius = Math.max(2.5, star.radius * 0.5);
        
        return (
          <group key={star.id}>
            {/* Invisible larger hitbox for easier selection */}
            <mesh 
              position={star.position}
              onClick={(e) => handleStarClick(star, e)}
              visible={false}
            >
              <sphereGeometry args={[hitboxRadius, 8, 8]} />
            </mesh>
            
            {/* Visual star with gentle pulsing and emissive glow scaled by radius */}
            <mesh position={star.position}>
              <sphereGeometry args={[visualRadius, 8, 8]} />
              <meshStandardMaterial 
                color={StarGenerator.getStarColor(star.spectralClass)}
                emissive={StarGenerator.getStarColor(star.spectralClass)}
                emissiveIntensity={Math.max(0.8, star.radius * 0.6)}
              />
            </mesh>
            
            {/* Selection overlay */}
            {isSelected && (
              <mesh position={star.position}>
                <sphereGeometry args={[visualRadius + 0.2, 8, 8]} />
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
  const [selectedStar, setSelectedStar] = useState<SimpleStar | null>(null);
  const [mouseMode, setMouseMode] = useState(true);
  const [currentView, setCurrentView] = useState<'galactic' | 'system'>('galactic');
  const [currentSystem, setCurrentSystem] = useState<any>(null);
  const [savedCameraPosition, setSavedCameraPosition] = useState<[number, number, number] | null>(null);
  const [stars, setStars] = useState<SimpleStar[]>([]);

  // Generate stars when app loads
  useEffect(() => {
    console.log("Generating stars...");
    const generatedStars = StarGenerator.generateStars(12345, 2000);
    setStars(generatedStars);
    console.log(`Generated ${generatedStars.length} stars`);
  }, []);

  const handleStart = () => {
    setShowSelector(false);
  };

  // Handle Tab key to toggle mouse mode (avoids Chrome escape conflicts)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        
        // Exit pointer lock if active
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        setMouseMode(prev => !prev);
      }
    };

    // Detect when pointer lock is lost (escape key pressed)
    const handlePointerLockChange = () => {
      if (!document.pointerLockElement) {
        // Pointer lock was lost, switch to mouse mode
        setMouseMode(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  // Handle Enter key to navigate to system view
  useEffect(() => {
    const handleSystemNavigation = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && selectedStar && currentView === 'galactic') {
        console.log(`Navigating to ${selectedStar.name} system...`);
        // Position will be automatically saved by camera controller
        const system = SystemGenerator.generateSystem(selectedStar, 12345);
        setCurrentSystem(system);
        setCurrentView('system');
        setSelectedStar(null); // Clear selection when transitioning
        
        // Camera positioning will be handled by CameraController
      }
      
      if (event.key === 'Backspace' && currentView === 'system') {
        console.log('Returning to galactic view...');
        setCurrentView('galactic');
        setCurrentSystem(null);
        // Camera position will be restored by the camera controller
      }
    };

    document.addEventListener('keydown', handleSystemNavigation);
    return () => document.removeEventListener('keydown', handleSystemNavigation);
  }, [selectedStar, currentView]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <KeyboardControls map={controls}>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <color attach="background" args={["#000000"]} />
          <ambientLight intensity={0.1} />
          <directionalLight position={[10, 10, 5]} intensity={0.3} />
          {!showSelector && (
            <>
              {/* <StarSkybox count={currentView === 'galactic' ? 500 : 300} radius={200} /> */}
              <CameraController 
                mouseMode={mouseMode}
                savedPosition={currentView === 'galactic' ? savedCameraPosition : null}
                onPositionSave={currentView === 'galactic' ? setSavedCameraPosition : null}
              />
              {currentView === 'galactic' && (
                <StarField selectedStar={selectedStar} setSelectedStar={setSelectedStar} stars={stars} />
              )}
              {currentView === 'system' && currentSystem && (
                <>
                  <StarfieldSkybox stars={stars} scale={0.05} />
                  <SystemView system={currentSystem} />
                </>
              )}
              
              {/* Post-processing effects for bloom */}
              <EffectComposer>
                <Bloom 
                  intensity={currentView === 'system' ? 2.0 : 1.5}
                  luminanceThreshold={0.15}
                  luminanceSmoothing={0.8}
                  height={400}
                />
              </EffectComposer>
            </>
          )}
        </Canvas>
      </KeyboardControls>

      {/* Current Scope Indicator */}
      {!showSelector && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          pointerEvents: 'none',
          zIndex: 10,
          fontSize: '14px',
          fontWeight: '500'
        }}>
          📍 {currentView === 'galactic' ? `Galactic View • ${stars.length} Stars` : `System View • ${currentSystem?.starId || 'Unknown'}`} {mouseMode ? '• Mouse Mode (TAB for Navigation)' : '• Navigation Mode (TAB for Mouse)'}
          {currentView === 'system' && (
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
              Press Backspace to return to galactic view
            </div>
          )}
        </div>
      )}

      {/* Center Crosshair */}
      {!showSelector && !mouseMode && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 5
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            {/* Inner dot */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '4px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '50%'
            }} />
          </div>
        </div>
      )}

      {/* Star Information Panel */}
      {!showSelector && selectedStar && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '280px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            {selectedStar.name || selectedStar.id}
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <div>Class: {selectedStar.spectralClass}</div>
            <div>Position: [{selectedStar.position[0].toFixed(1)}, {selectedStar.position[1].toFixed(1)}, {selectedStar.position[2].toFixed(1)}]</div>
            <div>Radius: {selectedStar.radius.toFixed(2)} solar radii</div>
          </div>
          <div style={{ 
            marginTop: '12px', 
            fontSize: '10px', 
            color: '#888',
            textAlign: 'center'
          }}>
            Click star again to unselect • Click empty space to unselect
          </div>
        </div>
      )}

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