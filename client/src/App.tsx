import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useState, useRef } from "react";
import { KeyboardControls, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { CameraController } from "./components/3d/CameraController";
import { SystemView } from "./components/3d/SystemView";
import { StarSkybox } from "./components/3d/StarSkybox";
import { StarfieldSkybox } from "./components/3d/StarfieldSkybox";
import { ObjectPanel } from "./components/ui/ObjectPanel";
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
  luminosity?: number;
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
  // Load star surface texture
  const starBumpMap = useTexture('/textures/star_surface.jpg');

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
        const visualRadius = Math.max(0.2, star.radius * 1.0); 
        const hitboxRadius = Math.max(2.0, star.radius * 2.0);

        return (
          <group key={star.id}>
            {/* Invisible larger hitbox for easier selection */}
            <mesh 
              position={star.position}
              onClick={(e) => {
                console.log(`Selected star: ${star.name}`);
                setSelectedStar(star);
              }}
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
                emissiveIntensity={Math.max(0.6, star.radius * 0.4)}
                // Star surface texture - fully opaque
                map={starBumpMap}
                transparent={false}
                opacity={1.0}
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
  const [selectedPlanet, setSelectedPlanet] = useState<any>(null);
  // Navigation mode removed - all interactions now use direct mouse controls
  const [currentView, setCurrentView] = useState<'galactic' | 'system'>('galactic');
  const [currentSystem, setCurrentSystem] = useState<any>(null);
  const [savedCameraPosition, setSavedCameraPosition] = useState<[number, number, number] | null>(null);
  const [stars, setStars] = useState<SimpleStar[]>([]);
  const [systemCache, setSystemCache] = useState<Map<string, any>>(new Map());
  const [, forceUpdate] = useState({});


  // Generate stars when app loads and clear system cache
  useEffect(() => {
    console.log("Generating stars...");
    const generatedStars = StarGenerator.generateStars(12345, 2000);
    setStars(generatedStars);
    setSystemCache(new Map()); // Clear system cache when regenerating galaxy
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

  // Function to generate planets for a star (moved from SystemView)
  const generatePlanetsForStar = (star: SimpleStar) => {
    const planets = [];

    // Fewer planets for larger stars (they're more disruptive to planet formation)
    let maxPlanets = 8;
    if (star.radius > 2) maxPlanets = 4;
    if (star.radius > 5) maxPlanets = 2;

    const planetCount = Math.floor(Math.random() * maxPlanets) + 1;

    const planetTypes: PlanetType[] = [
      'gas_giant', 'frost_giant', 'arid_world', 'verdant_world',
      'acidic_world', 'nuclear_world', 'ocean_world', 'dead_world'
    ];

    for (let i = 0; i < planetCount; i++) {
      const type = planetTypes[Math.floor(Math.random() * planetTypes.length)];

      // Base orbital spacing increases with star size
      const baseSpacing = 16 + star.radius * 8;

      let orbitRadius: number;
      if (i === 0) {
        orbitRadius = baseSpacing;
      } else {
        const previousRadius: number = planets[i - 1].orbitRadius;
        const spacing = 2.0 + Math.random() * 1.0; // 2x–3x farther
        orbitRadius = previousRadius * spacing;
      }

      // Earth radii scaling (realistic)
      let radius: number;
      switch (type) {
        case 'gas_giant':
          radius = 8 + Math.random() * 4; // 8–12 R⊕
          break;
        case 'frost_giant':
          radius = 4 + Math.random() * 3; // 4–7 R⊕
          break;
        case 'verdant_world':
        case 'acidic_world':
        case 'ocean_world':
        case 'arid_world':
          radius = 0.8 + Math.random() * 1.5; // 0.8–2.3 R⊕
          break;
        case 'nuclear_world':
        case 'dead_world':
          radius = 0.3 + Math.random() * 0.7; // 0.3–1.0 R⊕
          break;
        default:
          radius = 1.0;
      }

      // Mass = radius³ × density factor (gas giants less dense)
      const densityFactor = type === 'gas_giant' || type === 'frost_giant' ? 0.3 : 1.0;
      const mass = Math.pow(radius, 3) * densityFactor;

      // Simplified temperature model
      const temperature = 200 + Math.random() * 600;

      planets.push({
        id: `planet-${star.id}-${i}`,
        name: `${star.name} ${String.fromCharCode(945 + i)}`,
        type,
        radius,
        mass,
        orbitRadius,
        orbitSpeed: 0.05 + Math.random() * 0.15,
        rotationSpeed: 0.01 + Math.random() * 0.05,
        temperature,
        atmosphere: generateAtmosphere(type),
        position: [orbitRadius, 0, 0] as [number, number, number]
      });
    }

    return planets;
  };


  const generateAtmosphere = (planetType: string): string[] => {
    const atmospheres = {
      gas_giant: ['Hydrogen', 'Helium', 'Methane'],
      frost_giant: ['Nitrogen', 'Methane', 'Argon'],
      arid_world: ['Carbon Dioxide', 'Nitrogen'],
      verdant_world: ['Nitrogen', 'Oxygen', 'Argon'],
      acidic_world: ['Sulfuric Acid', 'Carbon Dioxide'],
      nuclear_world: ['Radioactive Gases', 'Xenon'],
      ocean_world: ['Nitrogen', 'Oxygen', 'Water Vapor'],
      dead_world: []
    };
    return atmospheres[planetType as keyof typeof atmospheres] || [];
  };

  // Get star color for UI display
  const getStarDisplayColor = (spectralClass: string): string => {
    const firstChar = spectralClass.charAt(0).toUpperCase();
    switch (firstChar) {
      case 'O': return '#9bb0ff'; // Blue
      case 'B': return '#aabfff'; // Blue-white
      case 'A': return '#cad7ff'; // White
      case 'F': return '#f8f7ff'; // Yellow-white
      case 'G': return '#fff4ea'; // Yellow (Sun-like)
      case 'K': return '#ffd2a1'; // Orange
      case 'M': return '#ffad51'; // Red
      default: return '#ffffff';
    }
  };

  // Function to get planet color for UI consistency
  const getPlanetColor = (type: string): string => {
    const colors = {
      gas_giant: '#FF7043',
      frost_giant: '#81C784', 
      arid_world: '#D4A574',
      verdant_world: '#4CAF50',
      acidic_world: '#FFC107',
      nuclear_world: '#F44336',
      ocean_world: '#2196F3',
      dead_world: '#616161'
    };
    return colors[type as keyof typeof colors] || '#888888';
  };

  // Navigation mode removed - all interactions use mouse mode

  // Handle Enter key to navigate to system view
  useEffect(() => {
    const handleSystemNavigation = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && selectedStar && currentView === 'galactic') {
        console.log(`Navigating to ${selectedStar.name} system...`);

        // Check if system already exists in cache
        let system = systemCache.get(selectedStar.id);
        if (!system) {
          // Generate new system and cache it
          system = {
            starId: selectedStar.id,
            star: selectedStar,
            planets: generatePlanetsForStar(selectedStar)
          };
          setSystemCache(prev => new Map(prev.set(selectedStar.id, system)));
          console.log(`Generated new system for ${selectedStar.name}`);
        } else {
          console.log(`Using cached system for ${selectedStar.name}`);
        }

        setCurrentView('system');
        setCurrentSystem(system);
        setSelectedStar(null);
        
        // Ensure star info is available immediately in system view
        setTimeout(() => {
          if (system.star) {
            (window as any).systemStarSelected = system.star;
            console.log('Star info set from system navigation:', system.star.name);
          }
        }, 100);
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (currentView === 'galactic' && selectedStar) {
          console.log(`Unselected star: ${selectedStar.name}`);
          setSelectedStar(null);
        } else if (currentView === 'system') {
          if (selectedPlanet) {
            console.log(`Unselected planet: ${selectedPlanet.name}`);
            setSelectedPlanet(null);
          } else if ((window as any).systemStarSelected) {
            console.log('Unselected central star');
            (window as any).systemStarSelected = false;
          }
        }
      }

      if (event.key === 'Backspace' && currentView === 'system') {
        console.log('Returning to galactic view...');
        setCurrentView('galactic');
        setCurrentSystem(null);
        setSelectedPlanet(null);
        (window as any).systemStarSelected = false; // Clear star selection
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
  }, [selectedStar, currentView, systemCache]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <KeyboardControls map={controls}>
        <Canvas camera={{ position: [0, 0, 5], far: 500000, near: 0.1 }}>
          <color attach="background" args={["#000000"]} />
          <ambientLight intensity={0.1} />
          <directionalLight position={[10, 10, 5]} intensity={0.3} />
          {!showSelector && (
            <>
              {/* <StarSkybox count={currentView === 'galactic' ? 500 : 300} radius={200} /> */}
              <CameraController 
                savedPosition={currentView === 'galactic' ? savedCameraPosition : null}
                onPositionSave={currentView === 'galactic' ? setSavedCameraPosition : null}
              />
              {currentView === 'galactic' && (
                <StarField 
                  selectedStar={selectedStar}
                  setSelectedStar={setSelectedStar}
                  stars={stars}
                />
              )}
              {currentView === 'system' && currentSystem && (
                <>
                  <StarfieldSkybox stars={stars} scale={0.05} />
                  <SystemView 
                    system={currentSystem} 
                    selectedPlanet={selectedPlanet}
                    onPlanetClick={setSelectedPlanet}

                  />
                </>
              )}

              {/* Post-processing effects for bloom */}
              <EffectComposer>
                <Bloom 
                  intensity={currentView === 'system' ? 0.8 : 0.6}
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
          📍 {currentView === 'galactic' ? `Galactic View • ${stars.length} Stars` : `System View • ${currentSystem?.starId || 'Unknown'}`} • Left-click objects, Right-click+drag camera
          {currentView === 'system' && (
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
              Press Backspace to return to galactic view
            </div>
          )}
        </div>
      )}

      {/* Crosshair removed - mouse mode only */}
      {false && (
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

      {/* Information panels */}
      {!showSelector && (
        <>
          {/* Galactic view - star information */}
          {selectedStar && currentView === 'galactic' && (
            <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg min-w-72 backdrop-blur border border-gray-600">
              <h3 className="text-lg font-bold" style={{ color: getStarDisplayColor(selectedStar.spectralClass) }}>
                {selectedStar.name}
              </h3>
              <p className="text-sm text-gray-300 mb-2">Spectral Class {selectedStar.spectralClass}</p>
              <div className="space-y-1 text-sm">
                <p><span style={{ color: getStarDisplayColor(selectedStar.spectralClass) }}>Mass:</span> {selectedStar.mass?.toFixed(2)} M☉</p>
                <p><span style={{ color: getStarDisplayColor(selectedStar.spectralClass) }}>Radius:</span> {selectedStar.radius.toFixed(2)} R☉</p>
                <p><span style={{ color: getStarDisplayColor(selectedStar.spectralClass) }}>Temperature:</span> {selectedStar.temperature?.toFixed(0)} K</p>
                <p><span style={{ color: getStarDisplayColor(selectedStar.spectralClass) }}>Luminosity:</span> {(selectedStar as any).luminosity?.toFixed(2) || 'Unknown'} L☉</p>
                <p><span style={{ color: getStarDisplayColor(selectedStar.spectralClass) }}>Age:</span> {(selectedStar as any).age?.toFixed(1) || 'Unknown'} Gy</p>
                <p><span style={{ color: getStarDisplayColor(selectedStar.spectralClass) }}>Distance:</span> {Math.sqrt(
                  selectedStar.position[0]**2 + 
                  selectedStar.position[1]**2 + 
                  selectedStar.position[2]**2
                ).toFixed(1)} ly</p>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                <p>Press Enter to explore system</p>
                <p>Click Again to deselect</p>
              </div>
            </div>
          )}

          {/* System view - star information (always shown) */}
          {currentView === 'system' && currentSystem?.star && (
            <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg min-w-72 backdrop-blur border border-gray-600">
              <h3 className="text-lg font-bold" style={{ color: getStarDisplayColor(currentSystem.star.spectralClass) }}>
                {currentSystem.star.name}
              </h3>
              <p className="text-sm text-gray-300 mb-2">Central Star - Spectral Class {currentSystem.star.spectralClass}</p>
              <div className="space-y-1 text-sm">
                <p><span style={{ color: getStarDisplayColor(currentSystem.star.spectralClass) }}>Mass:</span> {currentSystem.star.mass?.toFixed(2)} M☉</p>
                <p><span style={{ color: getStarDisplayColor(currentSystem.star.spectralClass) }}>Radius:</span> {currentSystem.star.radius?.toFixed(2)} R☉</p>
                <p><span style={{ color: getStarDisplayColor(currentSystem.star.spectralClass) }}>Temperature:</span> {currentSystem.star.temperature?.toFixed(0)} K</p>
                <p><span style={{ color: getStarDisplayColor(currentSystem.star.spectralClass) }}>Planets:</span> {currentSystem?.planets?.length || 0}</p>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                <p>Star information always visible in system view</p>
              </div>
            </div>
          )}

          {/* System view - planet information */}
          {currentView === 'system' && selectedPlanet && (
            <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg min-w-72 backdrop-blur border border-gray-600" style={{ marginTop: (window as any).systemStarSelected ? '280px' : '0px' }}>
              <h3 className="text-lg font-bold" style={{ color: getPlanetColor(selectedPlanet.type) }}>{selectedPlanet.name}</h3>
              <p className="text-sm text-gray-300 mb-2 capitalize">{selectedPlanet.type.replace('_', ' ')}</p>
              <div className="space-y-1 text-sm">
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Radius:</span> {selectedPlanet.radius.toFixed(2)} R⊕</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Mass:</span> {selectedPlanet.mass.toFixed(2)} M⊕</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Orbit:</span> {selectedPlanet.orbitRadius.toFixed(2)} AU</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Temperature:</span> {selectedPlanet.temperature.toFixed(0)} K</p>
                {selectedPlanet.atmosphere.length > 0 && (
                  <div>
                    <p style={{ color: getPlanetColor(selectedPlanet.type) }}>Atmosphere:</p>
                    <p className="text-xs text-gray-400">{selectedPlanet.atmosphere.join(', ')}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                <p>Press Escape to deselect</p>
              </div>
            </div>
          )}
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
          <h1>The Rogue Stars</h1>
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
            Start Sandbox
          </button>
        </div>
      )}
    </div>
  );
}

export default App;