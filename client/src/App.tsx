import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useState, useRef, useMemo } from "react";
import { KeyboardControls, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { CameraController } from "./components/3d/CameraController";
import { SystemView } from "./components/3d/SystemView";
import { PlanetaryView } from "./components/3d/PlanetaryView";
import { StarSkybox } from "./components/3d/StarSkybox";
import { StarfieldSkybox } from "./components/3d/StarfieldSkybox";
import { ObjectPanel } from "./components/ui/ObjectPanel";
import { NebulaDetails } from "./components/ui/NebulaDetails";
import { StarGenerator } from "./lib/universe/StarGenerator";
import { SystemGenerator } from "./lib/universe/SystemGenerator";
import { WarpLaneGenerator } from "./lib/universe/WarpLaneGenerator";
import { NebulaMesh } from "./components/3d/NebulaMesh";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import * as THREE from "three";
import { NebulaScreenTint } from './components/3d/NebulaScreenTint';
import { useAudio } from './lib/stores/useAudio';
import { MusicController } from './components/3d/musicController';

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

// Component for rendering warp lanes
function WarpLanes({ warpLanes, stars }: { warpLanes: any[]; stars: SimpleStar[] }) {
  // Create a lookup map for stars
  const starMap = useMemo(() => {
    const map = new Map<string, SimpleStar>();
    if (stars && Array.isArray(stars)) {
      stars.forEach(star => {
        if (star && star.id) {
          map.set(star.id, star);
        }
      });
    }
    return map;
  }, [stars]);

  // Safety check for warpLanes and stars
  if (!warpLanes || !Array.isArray(warpLanes) || warpLanes.length === 0) {
    return null;
  }
  
  if (!stars || !Array.isArray(stars) || stars.length === 0) {
    return null;
  }

  return (
    <group>
      {warpLanes.map((lane) => {
        // Safety checks for lane object
        if (!lane || !lane.id || !lane.path || !Array.isArray(lane.path)) {
          return null;
        }

        const pathStars = lane.path
          .map((starId: string) => starMap.get(starId))
          .filter(Boolean);
        
        if (pathStars.length < 2) return null;

        // Create cylinders connecting each star in the path
        const segments = [];
        for (let i = 0; i < pathStars.length - 1; i++) {
          const start = pathStars[i];
          const end = pathStars[i + 1];
          
          if (start && end && start.position && end.position) {
            try {
              const startPos = new THREE.Vector3(...start.position);
              const endPos = new THREE.Vector3(...end.position);
              const midPoint = startPos.clone().lerp(endPos, 0.5);
              const distance = startPos.distanceTo(endPos);
              
              // Debug logging for first few segments
              if (i === 0 && segments.length < 3) {
                console.log(`Warp lane segment ${lane.id}-${i}:`, {
                  start: start.position,
                  end: end.position,
                  midPoint: [midPoint.x, midPoint.y, midPoint.z],
                  distance: distance
                });
              }
              
              // Calculate rotation to align cylinder with the line between stars
              const direction = endPos.clone().sub(startPos).normalize();
              const quaternion = new THREE.Quaternion();
              quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

              segments.push(
                <mesh 
                  key={`${lane.id}-segment-${i}`} 
                  position={[midPoint.x, midPoint.y, midPoint.z]}
                  quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}
                  raycast={() => null}
                  frustumCulled={false}
                >
                  <cylinderGeometry args={[0.5, 0.5, distance, 8]} />
                  <meshStandardMaterial 
                    color={lane.color || '#00FFFF'} 
                    transparent 
                    opacity={lane.opacity || 0.3}
                    emissive={lane.color || '#00FFFF'}
                    emissiveIntensity={0.2}
                    metalness={0}
                    roughness={0.5}
                    depthTest={false}
                    depthWrite={false}
                    side={2}
                  />
                </mesh>
              );
            } catch (error) {
              console.error('Error creating warp lane segment:', error);
            }
          }
        }

        return (
          <group key={lane.id}>
            {segments}
          </group>
        );
      })}
    </group>
  );
}

function StarField({ 
  selectedStar, 
  setSelectedStar,
  selectedNebula,
  setSelectedNebula,
  stars,
  nebulas,
  warpLanes
}: { 
  selectedStar: SimpleStar | null; 
  setSelectedStar: (star: SimpleStar | null) => void;
  selectedNebula: any;
  setSelectedNebula: (nebula: any) => void;
  stars: SimpleStar[];
  nebulas: any[];
  warpLanes: any[];
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

  const onNebulaClick = (nebula: any) => {
    if (selectedNebula?.id === nebula.id) {
      // Deselect if clicking the same nebula
      console.log(`Deselected nebula: ${nebula.name}`);
      setSelectedNebula(null);
    } else {
      // Select new nebula
      console.log(`Nebula selected: ${nebula.name}`);
      setSelectedNebula(nebula);
    }
  };

  const handleBackgroundClick = () => {
    // Unselect when clicking empty space
    if (selectedStar || selectedNebula) {
      setSelectedNebula(null);
      setSelectedStar(null);
      console.log('Cleared selection');
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
                depthTest = {false}
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
                  depthTest={false}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Nebulas */}
      {nebulas.map((nebula) => (
        <NebulaMesh
          key={nebula.id}
          nebula={nebula}
          isSelected={selectedNebula?.id === nebula.id}
          onNebulaClick={onNebulaClick}
        />
      ))}



      {/* Warp lanes - rendered above nebulas */}
      {warpLanes && warpLanes.length > 0 && (
        <group renderOrder={1}>
          <WarpLanes warpLanes={warpLanes} stars={stars} />
        </group>
      )}

      {/* Camera-facing selection ring */}
      {selectedStar && <SelectionRing star={selectedStar} />}
    </group>
  );
}



function App() {
  const [showSelector, setShowSelector] = useState(true);
  const [selectedStar, setSelectedStar] = useState<SimpleStar | null>(null);
  const [selectedNebula, setSelectedNebula] = useState<any>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  // Navigation mode removed - all interactions now use direct mouse controls
  const [currentView, setCurrentView] = useState<'galactic' | 'system' | 'planetary'>('galactic');
  const [currentSystem, setCurrentSystem] = useState<any>(null);
  const [lastVisitedStar, setLastVisitedStar] = useState<SimpleStar | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const [stars, setStars] = useState<SimpleStar[]>([]);
  const [warpLanes, setWarpLanes] = useState<any[]>([]);
  const [systemCache, setSystemCache] = useState<Map<string, any>>(new Map());
  const [, forceUpdate] = useState({});

  // Generate nebulas once
  const nebulas = useMemo(() => StarGenerator.generateNebulas(20), []);

  // Generate stars and warp lanes when app loads and clear system cache
  useEffect(() => {
    console.log("Generating stars...");
    const dynamicSeed = Math.floor(Math.random() * 1000000); // Generate dynamic seed each time
    const generatedStars = StarGenerator.generateStars(dynamicSeed, 4000);
    setStars(generatedStars);
    setSystemCache(new Map()); // Clear system cache when regenerating galaxy
    console.log(`Generated ${generatedStars.length} stars`);
    
    // Generate warp lanes after stars are created (async to prevent blocking)
    if (generatedStars.length > 0) {
      setTimeout(() => {
        try {
          const galaxyRadius = 10000; // Match the star generation radius
          const generatedWarpLanes = WarpLaneGenerator.generateWarpLanes(generatedStars, galaxyRadius, 15); // Tripled from 8 to 24
          setWarpLanes(generatedWarpLanes);
          console.log(`Generated ${generatedWarpLanes.length} warp lanes`);
        } catch (error) {
          console.error("Error generating warp lanes:", error);
          setWarpLanes([]); // Fallback to no warp lanes
        }
      }, 100);
    }
    
    console.log("System cache cleared - new systems will include rings");
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





  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [audio]);

  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = () => {
    setShowSelector(false);
    setHasStarted(true);

    // Load multiple music tracks
    const musicTracks = [
      new Audio('/audio/galactic-theme.mp3'),
      new Audio('/audio/galacticview2_roguestars.mp3'),
      new Audio('/audio/vapor3.mp3'),
      new Audio('/audio/marcoost.mp3'),
      new Audio('/audio/coma3.mp3'),
      new Audio('/audio/coma2.mp3'),
      new Audio('/audio/coma1.mp3'),
    ];

    const trackNames = [
        'Galactic Theme',
        'Rogue Stars',
        'Vapor 3',
        'Marco OST',
        'Coma 3',
        'Coma 2',
        'Coma 1',
    ];

    // Configure all tracks (disable individual looping for automatic progression)
    musicTracks.forEach((track, index) => {
      track.loop = false; // Disable looping to allow track progression
      track.volume = 0.3;
      
      // Add event listener for automatic track progression
      track.addEventListener('ended', () => {
        console.log(`Track ${index + 1} (${track.src}) ended, attempting to play next track...`);
        const audioStore = useAudio.getState();
        console.log(`Current track index: ${audioStore.currentTrackIndex}, Total tracks: ${audioStore.musicTracks.length}`);
        audioStore.playNextTrack();
      });
    });

    // Start with random track
    const randomIndex = Math.floor(Math.random() * musicTracks.length);
    const startingTrack = musicTracks[randomIndex];
    startingTrack.play().catch(error => {
      console.log('Audio autoplay prevented by browser:', error);
    });

    // Store in audio system and unmute since user initiated music
    const audioStore = useAudio.getState();
    audioStore.setMusicTracks(musicTracks);
    audioStore.setBackgroundMusic(startingTrack);
    audioStore.setCurrentTrackIndex(randomIndex); // Set the starting track index
    audioStore.setStartingTrackIndex(randomIndex); // Remember which track we started with for alternating pattern
    
    // Unmute the audio system since user clicked to start music
    /*if (audioStore.isMuted) {
      audioStore.toggleMute();
      console.log("Audio system unmuted for music playback");
    }*/
    
    setAudio(startingTrack);
    
    console.log(`Started background music with ${musicTracks.length} tracks - starting with track ${randomIndex + 1} - will auto-progress`);
  };

  

  // Use SystemGenerator for consistent planet generation
  const generateSystemForStar = (star: SimpleStar) => {
    const seed = parseInt(star.id.slice(-3), 36) || Math.floor(Math.random() * 1000);
    console.log(`Generating system for ${star.name} with seed ${seed}`);
    const system = SystemGenerator.generateSystem(star, seed);
    console.log('SystemGenerator returned:', system);
    return system;
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
      gas_giant: '#FF7043',        // Orange
      frost_giant: '#81C784',      // Light green (sky blue)
      arid_world: '#D4A574',       // Goldenrod
      barren_world: '#8B7355',     // Dark khaki
      dusty_world: '#D2B48C',      // Tan
      grassland_world: '#9ACD32',  // Yellow green
      jungle_world: '#228B22',     // Forest green
      marshy_world: '#556B2F',     // Dark olive green
      martian_world: '#CD5C5C',    // Indian red
      methane_world: '#DDA0DD',    // Plum
      sandy_world: '#F4A460',      // Sandy brown
      snowy_world: '#F0F8FF',      // Alice blue
      tundra_world: '#708090',     // Slate gray
      nuclear_world: '#F44336',    // Orange red
      ocean_world: '#2196F3'       // Deep blue
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
          system = generateSystemForStar(selectedStar);
          console.log('Generated system:', system);
          setSystemCache(prev => new Map(prev.set(selectedStar.id, system)));
          console.log(`Generated new system for ${selectedStar.name}`);
        } else {
          console.log(`Using cached system for ${selectedStar.name}`);
        }

        setCurrentView('system');
        setCurrentSystem(system);
        setLastVisitedStar(selectedStar); // Remember the star we're visiting
        setSelectedStar(null);

        // Ensure star info is available immediately in system view and set default camera
        setTimeout(() => {
          if (system.star) {
            (window as any).systemStarSelected = system.star;
            console.log('Star info set from system navigation:', system.star.name);
          }
          // Set default camera position for system view
          if ((window as any).resetToStar) {
            (window as any).resetToStar();
          }
        }, 100);
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();

        // Stop orbital tracking and reset camera to center star
        if ((window as any).homeToPlanet) {
          (window as any).homeToPlanet(new Vector3(0, 0, 0), 1, null, false);
        }

        // Note: Camera positioning for planetary view is handled by the view transition itself

        if (currentView === 'galactic' && (selectedStar || selectedNebula)) {
          if (selectedStar) {
            console.log(`Unselected star: ${selectedStar.name}`);
            setSelectedStar(null);
          }
          if (selectedNebula) {
            console.log(`Unselected nebula: ${selectedNebula.name}`);
            setSelectedNebula(null);
          }
        } else if (currentView === 'system' && selectedPlanet) {
          // Only unselect planets in system view, not the central star
          console.log(`Unselected planet: ${selectedPlanet.name}`);
          setSelectedPlanet(null);
        } else if (currentView === 'planetary' && selectedFeature) {
          // Unselect surface features in planetary view
          console.log(`Unselected feature: ${selectedFeature.name}`);
          setSelectedFeature(null);
        }
      }

      if (event.key === 'Backspace') {
        if (currentView === 'planetary') {
          console.log('Returning to system view, keeping planet selected:', selectedPlanet?.name);
          setCurrentView('system');
          setSelectedFeature(null);

          // Re-enable galactic and system view keyboard controls
          (window as any).disableGalacticSystemControls = false;

          // Re-establish orbital tracking for the selected planet since it continued rotating
          if (selectedPlanet && (window as any).homeToPlanet) {
            setTimeout(() => {
              // Find the planet's index for orbital tracking
              const planetIndex = currentSystem?.planets?.findIndex((p: any) => p.id === selectedPlanet.id) || 0;
              const planetDataWithIndex = { ...selectedPlanet, index: planetIndex };

              // Re-establish orbital lock to track current position
              (window as any).homeToPlanet(new Vector3(0, 0, 0), Math.max(selectedPlanet.radius * 0.6, 1), planetDataWithIndex, true);
              console.log(`Re-established orbital tracking for ${selectedPlanet.name} after returning from planetary view`);
            }, 100);
          }
        } else if (currentView === 'system') {
          console.log('Returning to galactic view...');

          // Stop orbital tracking when leaving system view
          if ((window as any).homeToPlanet) {
            (window as any).homeToPlanet(new Vector3(0, 0, 0), 1, null, false);
          }

          setCurrentView('galactic');
          setCurrentSystem(null);
          setSelectedPlanet(null);
          (window as any).systemStarSelected = false;

          // Position camera with offset from last visited star and select it
          setTimeout(() => {
            if (lastVisitedStar && (window as any).setCameraLookingAtStar) {
              console.log(`Positioning camera to look at ${lastVisitedStar.name}`);
              (window as any).setCameraLookingAtStar(lastVisitedStar);
              setSelectedStar(lastVisitedStar); // Keep the star selected
            }
          }, 100); // Small delay to ensure view change is processed
        }
      }

      // Handle F key for planetary exploration
      if (event.key === 'f' || event.key === 'F') {
        console.log(`F key detected - currentView: ${currentView}, selectedPlanet: ${selectedPlanet?.name}, features: ${selectedPlanet?.surfaceFeatures?.length}`);


        if (currentView === 'system' && selectedPlanet) {
          event.preventDefault();

          console.log(`Planet data for F key:`, {
            name: selectedPlanet.name,
            type: selectedPlanet.type,
            surfaceFeatures: selectedPlanet.surfaceFeatures,
            featureCount: selectedPlanet.surfaceFeatures?.length
          });


          // Allow planetary view for all terrestrial planets (non-gas giants)
          if (selectedPlanet.type !== 'gas_giant' && selectedPlanet.type !== 'frost_giant') {
            console.log(`Entering planetary view for ${selectedPlanet.name} (${selectedPlanet.type}) with ${selectedPlanet.surfaceFeatures?.length || 0} features`);
            setCurrentView('planetary');

            // Stop any orbital tracking when entering planetary view
            if ((window as any).homeToPlanet) {
              (window as any).homeToPlanet(selectedPlanet.position, 1, null, false);
            }

            // Disable galactic and system view keyboard controls
            (window as any).disableGalacticSystemControls = true;
          } else {
            console.log(`${selectedPlanet.name} is a ${selectedPlanet.type} - no surface to explore`);
          }
        }
      }

      // Handle Enter key for orbital tracking
      if (event.key === 'Enter') {
        if (currentView === 'system' && selectedPlanet && !isSearching) {
          event.preventDefault();

          // Enable orbital tracking for selected planet
          if ((window as any).homeToPlanet) {
            const planetIndex = currentSystem?.planets?.findIndex((p: any) => p.id === selectedPlanet.id) || 0;
            const planetDataWithIndex = { ...selectedPlanet, index: planetIndex };
            (window as any).homeToPlanet(selectedPlanet.position, Math.max(selectedPlanet.radius * 0.6, 1), planetDataWithIndex, true);
            console.log(`Starting orbital tracking for ${selectedPlanet.name}`);
          }
        }
      }
    };

    document.addEventListener('keydown', handleSystemNavigation);
    return () => document.removeEventListener('keydown', handleSystemNavigation);
  }, [selectedStar, currentView, systemCache, selectedPlanet, isSearching, currentSystem]);

  // Planet search function for system view
  const searchPlanet = (planetName: string) => {
    if (currentView === 'system' && currentSystem?.planets) {
      const planet = currentSystem.planets.find((p: any) => 
        p.name.toLowerCase().includes(planetName.toLowerCase())
      );

      if (planet) {
        setSelectedPlanet(planet);
        console.log(`Found and selected planet: ${planet.name}`);
        return planet;
      }
    }
    return null;
  };


  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Planet Search UI for System View */}
      {currentView === 'system' && (
        <>
          <button
            onClick={() => setIsSearching(!isSearching)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              background: isSearching ? '#4CAF50' : 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: '1px solid #666',
              borderRadius: '6px',
              padding: '10px 15px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isSearching ? 'Close Selector' : 'Select Planet'}
          </button>

          {isSearching && (
            <div style={{
              position: 'fixed',
              top: '70px',
              right: '20px',
              zIndex: 1000,
              background: 'rgba(0, 0, 0, 0.9)',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #333',
              minWidth: '300px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{ marginBottom: '15px', color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                Select Planet
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentSystem?.planets?.map((planet: any) => {
                  const planetIndex = currentSystem.planets.findIndex((p: any) => p.id === planet.id);
                  return (
                    <button
                      key={planet.id}
                      onClick={() => {
                        setSelectedPlanet(planet);
                        setIsSearching(false);

                        // Auto-start orbital tracking for selected planet
                        setTimeout(() => {
                          if ((window as any).homeToPlanet) {
                            const planetDataWithIndex = { ...planet, index: planetIndex };
                            (window as any).homeToPlanet(new Vector3(0, 0, 0), Math.max(planet.radius * 0.6, 1), planetDataWithIndex, true);
                          }
                        }, 100);
                      }}
                      style={{
                        background: selectedPlanet?.id === planet.id ? '#4CAF50' : '#333',
                        color: 'white',
                        border: selectedPlanet?.id === planet.id ? '2px solid #66BB6A' : '1px solid #555',
                        borderRadius: '6px',
                        padding: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        fontSize: '13px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPlanet?.id !== planet.id) {
                          e.currentTarget.style.background = '#444';
                          e.currentTarget.style.borderColor = '#777';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPlanet?.id !== planet.id) {
                          e.currentTarget.style.background = '#333';
                          e.currentTarget.style.borderColor = '#555';
                        }
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{planet.name}</div>
                      <div style={{ fontSize: '11px', color: '#ccc', lineHeight: '1.3' }}>
                        {planet.type.replace('_', ' ').charAt(0).toUpperCase() + planet.type.replace('_', ' ').slice(1)} • 
                        R: {planet.radius.toFixed(1)} • 
                        Orbit: {planet.orbitRadius.toFixed(1)}
                      </div>
                    </button>
                  );
                }) || (
                  <div style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
                    No planets available
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsSearching(false)}
                style={{
                  marginTop: '15px',
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  color: '#aaa',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = '#777';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#aaa';
                  e.currentTarget.style.borderColor = '#555';
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
      {hasStarted === true && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <MusicController />
        </div>
      )}
      <KeyboardControls map={controls}>
        <Canvas camera={{ position: [0, 0, 5], far: 500000, near: 0.1 }}>
          <color attach="background" args={["#000000"]} />
          <ambientLight intensity={0.1} />
          <directionalLight position={[10, 10, 5]} intensity={0.3} />
          {!showSelector && (
            <>
              {/* <StarSkybox count={currentView === 'galactic' ? 500 : 300} radius={200} /> */}
              <CameraController />
              {currentView === 'galactic' && (
                <>
                  <StarField 
                    selectedStar={selectedStar}
                    setSelectedStar={setSelectedStar}
                    selectedNebula={selectedNebula}
                    setSelectedNebula={setSelectedNebula}
                    stars={stars}
                    nebulas={nebulas}
                    warpLanes={warpLanes}
                  />
                  <NebulaScreenTint nebulas={nebulas} />
                </>
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
              {currentView === 'planetary' && selectedPlanet && (
                <>
                  {console.log('Rendering PlanetaryView with:', { 
                    selectedPlanet: selectedPlanet.name, 
                    surfaceFeatures: selectedPlanet.surfaceFeatures?.length,
                    features: selectedPlanet.surfaceFeatures
                  })}
                  <PlanetaryView 
                    planet={selectedPlanet}
                    selectedFeature={selectedFeature}
                    onFeatureClick={setSelectedFeature}
                    system={currentSystem}
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
          📍 {currentView === 'galactic' ? `Galactic View • ${stars.length} Stars` : 
               currentView === 'system' ? `System View • ${currentSystem?.star?.name || lastVisitedStar?.name || 'Unknown'}` :
               `Planetary View • ${selectedPlanet?.name || 'Unknown'}`} • Left-click objects, Right-click+drag camera
          {currentView === 'system' && (
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
              {selectedPlanet 
                ? `Selected: ${selectedPlanet.name} • F: explore surface (${selectedPlanet.surfaceFeatures?.length || 0} features) • Enter: orbital track • Escape: look at star • Backspace: galactic view`
                : 'Press Backspace to return to galactic view'
              }
            </div>
          )}

          {currentView === 'planetary' && (
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
              {selectedFeature 
                ? `Selected: ${selectedFeature.name} (${selectedFeature.type}) • Enter: deselect • Backspace: system view`
                : 'Click surface features to inspect, and hit Enter to lock • Backspace: return to system view'
              }
            </div>
          )}
          {currentView === 'planetary' && (
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
              {selectedFeature 
                ? `Selected: ${selectedFeature.name} (${selectedFeature.type}) • Click background: deselect • Backspace: system view`
                : `${selectedPlanet?.surfaceFeatures?.length || 0} surface features • Backspace: system view`
              }
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

          {/* Galactic view - nebula information */}
          {selectedNebula && currentView === 'galactic' && (
            <NebulaDetails nebula={selectedNebula} />
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
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Orbit:</span> {selectedPlanet.displayOrbit.toFixed(2)} AU</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Temperature:</span> {selectedPlanet.temperature.toFixed(0)} K</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Moons:</span> {selectedPlanet.moons?.length || 0}</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Faction:</span>{' '}{selectedPlanet.faction.name || "Uninhabited"}</p>
                {selectedPlanet.atmosphere.length >0 && (
                  <div>
                    <p style={{ color: getPlanetColor(selectedPlanet.type) }}>Atmosphere:</p>
                    <p className="text-xs text-gray-400">{selectedPlanet.atmosphere.join(', ')}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                <p>Press Enter to focus camera • Escape to deselect</p>
              </div>
            </div>
          )}


          {/* Planetary view - planet information (persistent from system view) */}
          {currentView === 'planetary' && selectedPlanet && (
            <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg min-w-72 backdrop-blur border border-gray-600">
              <h3 className="text-lg font-bold" style={{ color: getPlanetColor(selectedPlanet.type) }}>{selectedPlanet.name}</h3>
              <p className="text-sm text-gray-300 mb-2 capitalize">{selectedPlanet.type.replace('_', ' ')}</p>
              <div className="space-y-1 text-sm">
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Radius:</span> {selectedPlanet.radius.toFixed(2)} R⊕</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Mass:</span> {selectedPlanet.mass.toFixed(2)} M⊕</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Orbit:</span> {selectedPlanet.displayOrbit.toFixed(2)} AU</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Temperature:</span> {selectedPlanet.temperature.toFixed(0)} K</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Moons:</span> {selectedPlanet.moons?.length || 0}</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Surface Features:</span> {selectedPlanet.surfaceFeatures?.length || 0}</p>
                <p><span style={{ color: getPlanetColor(selectedPlanet.type) }}>Faction:</span>{' '}{selectedPlanet.faction.name || "Uninhabited"}</p>
                {selectedPlanet.atmosphere.length >0 && (
                  <div>
                    <p style={{ color: getPlanetColor(selectedPlanet.type) }}>Atmosphere:</p>
                    <p className="text-xs text-gray-400">{selectedPlanet.atmosphere.join(', ')}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                <p>Backspace to return to system view</p>
              </div>
            </div>
          )}

          {/* Planetary view - surface feature information */}
          {currentView === 'planetary' && selectedFeature && (
            <div className="absolute right-4 bg-black/90 text-white p-4 rounded-lg min-w-72 backdrop-blur border border-gray-600" style={{ top: selectedPlanet ? '320px' : '4px' }}>
              <h3 className="text-lg font-bold" style={{ color: getPlanetColor(selectedPlanet?.type || 'arid_world') }}>{selectedFeature.name}</h3>
              <p className="text-sm text-gray-300 mb-2 capitalize">{selectedFeature.type.replace('_', ' ')}</p>
              <div className="space-y-1 text-sm">
                {selectedFeature.population && (
                  <p><span style={{ color: getPlanetColor(selectedPlanet?.type || 'arid_world') }}>Population:</span> {selectedFeature.population.toLocaleString()}</p>
                )}
                {selectedFeature.size && (
                  <p><span style={{ color: getPlanetColor(selectedPlanet?.type || 'arid_world') }}>Size:</span> {selectedFeature.size}</p>
                )}
                {selectedFeature.technology && (
                  <p><span style={{ color: getPlanetColor(selectedPlanet?.type || 'arid_world') }}>Technology:</span> {selectedFeature.technology}</p>
                )}
                {selectedFeature.affiliation && (
                  <p><span style={{ color: getPlanetColor(selectedPlanet?.type || 'arid_world') }}>Affiliation:</span> {selectedFeature.affiliation}</p>
                )}
                <p><span style={{ color: getPlanetColor(selectedPlanet?.type || 'arid_world') }}>Location:</span> {selectedFeature.position[0].toFixed(1)}°, {selectedFeature.position[1].toFixed(1)}°</p>
                {selectedFeature.description && (
                  <div className="mt-2">
                    <p style={{ color: getPlanetColor(selectedPlanet?.type || 'arid_world') }}>Description:</p>
                    <p className="text-xs text-gray-400">{selectedFeature.description}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                <p>Escape to deselect</p>
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