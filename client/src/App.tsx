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
  const [, forceUpdate] = useState({});

  // Generate stars when app loads
  useEffect(() => {
    console.log("Generating stars...");
    const generatedStars = StarGenerator.generateStars(12345, 2000);
    setStars(generatedStars);
    console.log(`Generated ${generatedStars.length} stars`);
  }, []);

  // Force re-render when system view state changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentView === 'system' && (window as any).systemViewState) {
        forceUpdate({});
      }
    }, 100);
    return () => clearInterval(interval);
  }, [currentView]);

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
                  intensity={currentView === 'system' ? 2.5 : 1.5}
                  luminanceThreshold={0.1}
                  luminanceSmoothing={0.7}
                  height={500}
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

        {/* Information panel - unified for both views */}
        {!showSelector && (
          <>
            {/* Galactic view - star information */}
            {selectedStar && currentView === 'galactic' && (
              <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg min-w-72 backdrop-blur border border-gray-600">
                <h3 className="text-lg font-bold text-blue-300">{selectedStar.name}</h3>
                <p className="text-sm text-gray-300 mb-2">Spectral Class {selectedStar.spectralClass}</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-blue-200">Mass:</span> {selectedStar.mass?.toFixed(2)} M☉</p>
                  <p><span className="text-blue-200">Radius:</span> {selectedStar.radius.toFixed(2)} R☉</p>
                  <p><span className="text-blue-200">Temperature:</span> {selectedStar.temperature?.toFixed(0)} K</p>
                  <p><span className="text-blue-200">Luminosity:</span> {(selectedStar as any).luminosity?.toFixed(2) || 'N/A'} L☉</p>
                  <p><span className="text-blue-200">Age:</span> {(selectedStar as any).age?.toFixed(1) || 'N/A'} Gy</p>
                  <p><span className="text-blue-200">Distance:</span> {Math.sqrt(
                    selectedStar.position[0]**2 + 
                    selectedStar.position[1]**2 + 
                    selectedStar.position[2]**2
                  ).toFixed(1)} ly</p>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  <p>Press Enter to explore system</p>
                  <p>Press Escape to deselect</p>
                </div>
              </div>
            )}

            {/* System view - star information */}
            {currentView === 'system' && (window as any).systemViewState?.selectedStar && (
              <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg min-w-72 backdrop-blur border border-gray-600">
                <h3 className="text-lg font-bold text-blue-300">{(window as any).systemViewState.star.name}</h3>
                <p className="text-sm text-gray-300 mb-2">Central Star</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-blue-200">Spectral Class:</span> {(window as any).systemViewState.star.spectralClass}</p>
                  <p><span className="text-blue-200">Radius:</span> {(window as any).systemViewState.star.radius.toFixed(2)} R☉</p>
                  <p><span className="text-blue-200">Temperature:</span> {(window as any).systemViewState.star.temperature?.toFixed(0)} K</p>
                  <p><span className="text-blue-200">Mass:</span> {(window as any).systemViewState.star.mass?.toFixed(2)} M☉</p>
                </div>
              </div>
            )}

            {/* System view - planet information */}
            {currentView === 'system' && (window as any).systemViewState?.selectedPlanet && (
              <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg min-w-72 backdrop-blur border border-gray-600">
                <h3 className="text-lg font-bold text-green-300">{(window as any).systemViewState.selectedPlanet.name}</h3>
                <p className="text-sm text-gray-300 mb-2 capitalize">{(window as any).systemViewState.selectedPlanet.type.replace('_', ' ')}</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-green-200">Radius:</span> {(window as any).systemViewState.selectedPlanet.radius.toFixed(2)} R⊕</p>
                  <p><span className="text-green-200">Mass:</span> {(window as any).systemViewState.selectedPlanet.mass.toFixed(2)} M⊕</p>
                  <p><span className="text-green-200">Orbit:</span> {(window as any).systemViewState.selectedPlanet.orbitRadius.toFixed(2)} AU</p>
                  <p><span className="text-green-200">Temperature:</span> {(window as any).systemViewState.selectedPlanet.temperature.toFixed(0)} K</p>
                  {(window as any).systemViewState.selectedPlanet.atmosphere.length > 0 && (
                    <div>
                      <p className="text-green-200">Atmosphere:</p>
                      <p className="text-xs text-gray-400">{(window as any).systemViewState.selectedPlanet.atmosphere.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

      {/* Navigation and UI components - visible in both views */}
      {!showSelector && (
        <>
          <NavigationBar />
          <ObjectPanel />
        </>
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