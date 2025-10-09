import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { useCamera } from '../../lib/stores/useCamera';
import { useUniverse } from '../../lib/stores/useUniverse';

const MOVEMENT_SPEED = 8.0; // Much faster base speed
const BOOST_MULTIPLIER_MIN = 3; // Starting boost
const BOOST_MULTIPLIER_MAX = 150; // 15000% max boost
const BOOST_BUILDUP_TIME = 3; // Seconds to reach max boost
const MOUSE_SENSITIVITY = 0.002;

export function CameraController() {
  const { camera, gl } = useThree();
  const { position, target, isTransitioning, setPosition, setTarget } = useCamera();
  const { currentScope } = useUniverse();

  const [sub, get] = useKeyboardControls();
  const isLockedRef = useRef(false);
  const isRightClickDragRef = useRef(false);
  const velocityRef = useRef(new Vector3());
  const targetVelocityRef = useRef(new Vector3());
  const boostStartTimeRef = useRef<number | null>(null);
  const lastBoostStateRef = useRef(false);
  const lastPositionRef = useRef(new Vector3());
  const isOrbitalTrackingRef = useRef(false);
  const orbitalTargetRef = useRef<any>(null);
  const isSpaceFeatureTrackingRef = useRef(false);
  const spaceFeatureTargetRef = useRef<any>(null);
  const spaceFeatureDistanceRef = useRef<number>(5);

  // Camera homing functionality with orbital tracking option
  const homeToPlanet = (planetPosition: Vector3, planetRadius: number, planetData?: any, enableOrbitalTracking = false) => {
    if (!camera) return;

    if (enableOrbitalTracking && planetData) {
      // Enable continuous orbital tracking
      isOrbitalTrackingRef.current = true;
      orbitalTargetRef.current = planetData;
      console.log(`Starting orbital tracking for ${planetData.name}`);
      return;
    }

    // Disable orbital tracking only - reset rotation but keep position
    if (enableOrbitalTracking === false && !planetData) {
      isOrbitalTrackingRef.current = false;
      orbitalTargetRef.current = null;

      // Reset camera rotation to look at star (0,0,0) but keep current position
      camera.rotation.set(0, 0, 0);
      camera.rotation.order = 'YXZ';
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0); // Look at the central star
      camera.updateMatrix();
      camera.updateMatrixWorld(true);

      console.log('Stopped orbital tracking - reset rotation to look at star');
      return;
    }

    // Disable orbital tracking
    isOrbitalTrackingRef.current = false;
    orbitalTargetRef.current = null;

    // Scale camera distance based on orbital radius - farther planets get farther camera
    const orbitScaling = planetData?.orbitRadius ? Math.max(planetData.orbitRadius * 0.15, 1) : 1;
    const distance = Math.max(planetRadius * 25 * orbitScaling, 15);

    if (!planetData) {
      // Simple positioning for non-orbiting objects
      const direction = new Vector3(1, 0.4, 1).normalize();
      const targetPosition = new Vector3().addVectors(planetPosition, direction.multiplyScalar(distance));
      camera.position.copy(targetPosition);
      camera.rotation.set(0, 0, 0);
      camera.rotation.order = 'YXZ';
      camera.up.set(0, 1, 0);
      camera.lookAt(planetPosition);
      camera.updateMatrix();
      camera.updateMatrixWorld(true);
      return;
    }

    // One-time positioning with offset - use frozen time if available
    const currentSystem = (window as any).currentSystem;
    const simulationTime = currentSystem?.frozenTime || Date.now();
    const time = simulationTime * 0.0001;
    const planetIndex = planetData.index || 0;
    const angle = time * planetData.orbitSpeed + planetIndex * (Math.PI * 2 / 8);
    const currentPlanetPos = new Vector3(
      Math.cos(angle) * planetData.orbitRadius * 2,
      0,
      Math.sin(angle) * planetData.orbitRadius * 2
    );

    const orbitalRadius = Math.sqrt(currentPlanetPos.x * currentPlanetPos.x + currentPlanetPos.z * currentPlanetPos.z);

    let direction: Vector3;
    if (orbitalRadius > 0.1) {
      const radialDirection = new Vector3(currentPlanetPos.x, 0, currentPlanetPos.z).normalize();
      direction = radialDirection.clone().multiplyScalar(1.2).add(new Vector3(0, 0.6, 0)).normalize();
    } else {
      direction = new Vector3(1, 0.4, 1).normalize();
    }

    const targetPosition = new Vector3().addVectors(currentPlanetPos, direction.multiplyScalar(distance));

    camera.position.copy(targetPosition);
    camera.rotation.set(0, 0, 0);
    camera.rotation.order = 'YXZ';
    camera.up.set(0, 1, 0);
    camera.lookAt(currentPlanetPos);
    camera.updateMatrix();
    camera.updateMatrixWorld(true);

    console.log(`Camera positioned at planet ${planetData?.name || 'Unknown'} with index offset ${planetData?.index || 0}`);
  };

  // Space feature orbital tracking function
  const homeToSpaceFeature = (spaceFeature: any, trackingDistance = 5, enableOrbitalTracking = false) => {
    if (!camera) return;

    if (enableOrbitalTracking && spaceFeature) {
      // Validate space feature has required orbital parameters
      if (!spaceFeature.orbitRadius || spaceFeature.orbitRadius < 5) {
        console.warn(`Space feature ${spaceFeature.name} has invalid orbitRadius (${spaceFeature.orbitRadius}). Minimum is 5.`);
        return;
      }
      
      if (!spaceFeature.orbitSpeed) {
        console.warn(`Space feature ${spaceFeature.name} has no orbitSpeed. Using default 0.01.`);
        spaceFeature.orbitSpeed = 0.01;
      }

      // Enable continuous orbital tracking for space feature
      isSpaceFeatureTrackingRef.current = true;
      spaceFeatureTargetRef.current = spaceFeature;
      spaceFeatureDistanceRef.current = Math.max(trackingDistance, 3); // Minimum tracking distance
      console.log(`Starting space feature orbital tracking for ${spaceFeature.name} at radius ${spaceFeature.orbitRadius} with distance ${spaceFeatureDistanceRef.current}`);
      return;
    }

    // Disable orbital tracking only - reset rotation but keep position
    if (enableOrbitalTracking === false && !spaceFeature) {
      isSpaceFeatureTrackingRef.current = false;
      spaceFeatureTargetRef.current = null;

      // Reset camera rotation to look at star (0,0,0) but keep current position
      camera.rotation.set(0, 0, 0);
      camera.rotation.order = 'YXZ';
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0); // Look at the central star
      camera.updateMatrix();
      camera.updateMatrixWorld(true);

      console.log('Stopped space feature orbital tracking - reset rotation to look at star');
      return;
    }

    // Disable orbital tracking
    isSpaceFeatureTrackingRef.current = false;
    spaceFeatureTargetRef.current = null;

    console.log(`Space feature tracking disabled for ${spaceFeature?.name || 'Unknown'}`);
  };

  // Reset camera to center star
  const resetToStar = () => {
    if (!camera) return;

    // Don't reset camera if we're in planetary view or controls are disabled
    if (currentScope === 'planetary' || (window as any).disableGalacticSystemControls) {
      console.log('Skipping camera reset - in planetary view or controls disabled');
      return;
    }

    // Stop orbital tracking
    velocityRef.current.set(0, 0, 0);
    targetVelocityRef.current.set(0, 0, 0);
    isOrbitalTrackingRef.current = false;
    orbitalTargetRef.current = null;
    isSpaceFeatureTrackingRef.current = false;
    spaceFeatureTargetRef.current = null;

    // Position camera at a good viewing distance from star
    camera.position.set(0, 20, 200);
    camera.lookAt(0, 0, 0);
    camera.updateMatrix();
    camera.updateMatrixWorld(true);

    console.log('Camera reset to center star position');
  };

  // Handle escape key to break orbital tracking and clear on scope changes
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (isOrbitalTrackingRef.current || isSpaceFeatureTrackingRef.current)) {
        console.log('Escape pressed - stopping orbital tracking');
        isOrbitalTrackingRef.current = false;
        orbitalTargetRef.current = null;
        isSpaceFeatureTrackingRef.current = false;
        spaceFeatureTargetRef.current = null;
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);

  // Clear orbital tracking when leaving system view
  useEffect(() => {
    if (currentScope !== 'system' && (isOrbitalTrackingRef.current || isSpaceFeatureTrackingRef.current)) {
      console.log('Clearing orbital tracking - left system view');
      isOrbitalTrackingRef.current = false;
      orbitalTargetRef.current = null;
      isSpaceFeatureTrackingRef.current = false;
      spaceFeatureTargetRef.current = null;
    }
  }, [currentScope]);

  // Set camera to look at specific star with offset
  const setCameraLookingAtStar = (star: any) => {
    if (!camera) return;

    // Calculate offset position - place camera at distance with slight offset
    const starPos = new Vector3(star.position[0], star.position[1], star.position[2]);
    const distance = 50; // Closer distance from star
    const offsetDirection = new Vector3(1, 0.5, 1).normalize(); // Slight upward and side offset

    const cameraPosition = starPos.clone().add(offsetDirection.multiplyScalar(distance));

    // Set camera position and look at the star
    camera.position.copy(cameraPosition);
    camera.lookAt(starPos);
    camera.updateMatrix();
    camera.updateMatrixWorld(true);

    console.log(`Camera positioned at ${cameraPosition.toArray().map(n => n.toFixed(1))} looking at ${star.name}`);
  };

  // Expose camera functions to window for external access
  useEffect(() => {
    (window as any).homeToPlanet = homeToPlanet;
    (window as any).homeToSpaceFeature = homeToSpaceFeature;
    (window as any).resetToStar = resetToStar;
    (window as any).setCameraLookingAtStar = setCameraLookingAtStar;
    return () => {
      delete (window as any).homeToPlanet;
      delete (window as any).homeToSpaceFeature;
      delete (window as any).resetToStar;
      delete (window as any).setCameraLookingAtStar;
    };
  }, [camera]);

  // Mouse-only camera control with right-click drag
  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseMove = (event: MouseEvent) => {
      // Only rotate camera during right-click drag
      if (!isRightClickDragRef.current || isTransitioning || (window as any).disableGalacticSystemControls)
        return;
        

      const { movementX, movementY } = event;

      // Update camera rotation based on mouse movement
      camera.rotation.y -= movementX * MOUSE_SENSITIVITY;
      camera.rotation.x -= movementY * MOUSE_SENSITIVITY;

      // Clamp vertical rotation to prevent gimbal lock
      camera.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, camera.rotation.x));

      // Ensure rotation order is correct
      camera.rotation.order = 'YXZ';
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 2 && !(window as any).disableGalacticSystemControls) { // Right click
        event.preventDefault();
        isRightClickDragRef.current = true;
        document.body.style.cursor = 'grabbing';
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 2) { // Right click release
        isRightClickDragRef.current = false;
        document.body.style.cursor = 'auto';
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault(); // Always prevent context menu
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp); // Global mouse up to catch releases outside canvas

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [camera, gl.domElement, isTransitioning]);


  const previousScopeRef = useRef<string>(currentScope);
  // Set camera position based on scope
  useEffect(() => {
    if (currentScope === 'system' && previousScopeRef.current === 'galactic') {
      // Set extended camera range for system view
      camera.near = 0.1;
      camera.far = 500000;
      camera.updateProjectionMatrix();

      // Only set initial position if camera is too close to origin
      const currentDistance = camera.position.length();
      if (currentDistance < 5) {
        camera.position.set(0, 20, 200);
        camera.lookAt(0, 0, 0);
        console.log('Set system view camera position:', camera.position);
      }
    }
    previousScopeRef.current = currentScope;
  }, [camera, currentScope]);

  // Handle keyboard movement
  useFrame((state, delta) => {
    // CRITICAL: Check if another component has taken camera control
    if ((window as any).disableGalacticSystemControls) {
      // Completely skip all camera updates when disabled
      return;
    }

    if (isTransitioning) {
      // During transitions, smooth the camera positioning
      const progress = useCamera.getState().getTransitionProgress();
      const { fromPosition, toPosition, fromTarget, toTarget } = useCamera.getState();

      // Interpolate position and target smoothly
      const currentPos = fromPosition.clone().lerp(toPosition, progress);
      const currentTarget = fromTarget.clone().lerp(toTarget, progress);

      camera.position.copy(currentPos);
      camera.lookAt(currentTarget);
      camera.updateMatrix();
      camera.updateMatrixWorld(true);
      return; // Ensure no further updates if transitioning
    }

    // Handle orbital tracking - copy planet's movement data directly to camera
    // Disable orbital tracking in planetary view to prevent camera conflicts
    if (isOrbitalTrackingRef.current && orbitalTargetRef.current && currentScope !== 'planetary') {
      const planetData = orbitalTargetRef.current;
      const currentSystem = (window as any).currentSystem;
      const simulationTime = currentSystem?.frozenTime || Date.now();
      const time = simulationTime * 0.0001;
      const planetIndex = planetData.index || 0;
      const angle = time * planetData.orbitSpeed + planetIndex * (Math.PI * 2 / 8);

      // Calculate exact planet position (identical to SystemView calculation)
      const planetPos = new Vector3(
        Math.cos(angle) * planetData.orbitRadius * 2,
        0,
        Math.sin(angle) * planetData.orbitRadius * 2
      );

      // Scale camera distance based on orbital radius - farther planets get farther camera
      const orbitScaling = Math.max(planetData.orbitRadius * 0.15, 1);
      const cameraDistance = Math.max(planetData.radius * 8 * orbitScaling, 5);
      const cameraOffsetAngle = angle + Math.PI * 0.3;

      // Calculate direction from planet to camera
      const cameraDirection = new Vector3(
        Math.cos(cameraOffsetAngle),
        0.4, // Elevated angle
        Math.sin(cameraOffsetAngle)
      ).normalize();

      // Position camera relative to planet position
      const cameraPos = planetPos.clone().add(cameraDirection.multiplyScalar(cameraDistance));

      // Direct position copy - no interpolation for instant sync
      camera.position.copy(cameraPos);
      camera.lookAt(planetPos);
      camera.updateMatrix();
      camera.updateMatrixWorld(true);
      
      // Debug rapid camera updates
      if (Math.random() < 0.01) { // 1% chance to log
        console.log('Orbital tracking camera update:', {
          position: cameraPos.toArray().map(n => n.toFixed(2)),
          planetPos: planetPos.toArray().map(n => n.toFixed(2))
        });
      }

      // Skip movement controls when in orbital tracking
      return;
    }

    // Handle space feature orbital tracking
    if (isSpaceFeatureTrackingRef.current && spaceFeatureTargetRef.current && currentScope !== 'planetary') {
      const spaceFeature = spaceFeatureTargetRef.current;
      const currentSystem = (window as any).currentSystem;
      const simulationTime = currentSystem?.frozenTime || Date.now();
      const time = simulationTime * 0.0001;
      let featurePosition = new Vector3(0, 0, 0);
      let positionCalculated = false;

      // Calculate space feature's real-time position based on orbital parameters
      // Debug logging only for troubleshooting
      if (Math.random() < 0.01) {
        console.log(`Calculating position for space feature ${spaceFeature.name}:`, {
          orbitTarget: spaceFeature.orbitTarget,
          orbitTargetId: spaceFeature.orbitTargetId,
          orbitRadius: spaceFeature.orbitRadius,
          orbitSpeed: spaceFeature.orbitSpeed
        });
      }

      if (spaceFeature.orbitTarget === 'planet' && spaceFeature.orbitTargetId) {
        // Space feature orbiting a planet - need to get current system data
        const systemRef = (window as any).currentSystemRef?.current || (window as any).currentSystem;
        if (systemRef && systemRef.planets) {
          const targetPlanet = systemRef.planets.find((p: any) => p.id === spaceFeature.orbitTargetId);
          
          if (targetPlanet && targetPlanet.orbitRadius && targetPlanet.orbitSpeed) {
            const planetSimTime = systemRef?.frozenTime || Date.now();
            const planetTime = planetSimTime * 0.0001;
            const planetIndex = systemRef.planets.findIndex((p: any) => p.id === targetPlanet.id);
            const planetAngle = planetTime * targetPlanet.orbitSpeed + planetIndex * (Math.PI * 2 / 8);
            
            // Calculate planet's current position
            const planetPos = new Vector3(
              Math.cos(planetAngle) * targetPlanet.orbitRadius * 2,
              0,
              Math.sin(planetAngle) * targetPlanet.orbitRadius * 2
            );

            // Calculate feature's orbit around the planet
            const featureAngle = time * (spaceFeature.orbitSpeed || 0.1) + (spaceFeature.orbitOffset || 0);
            const orbitRadius = spaceFeature.orbitRadius || 10;
            const orbitX = Math.cos(featureAngle) * orbitRadius;
            const orbitZ = Math.sin(featureAngle) * orbitRadius;

            featurePosition.set(
              planetPos.x + orbitX,
              planetPos.y,
              planetPos.z + orbitZ
            );
            positionCalculated = true;
          }
        }
      } else if (spaceFeature.orbitTarget === 'asteroid_belt') {
        // Space feature orbiting in an asteroid belt - independent orbit at belt radius
        const angle = time * (spaceFeature.orbitSpeed || 0.02) + (spaceFeature.orbitOffset || 0);
        const radius = spaceFeature.orbitRadius || 50;
        
        featurePosition.set(
          Math.cos(angle) * radius * 2,
          0,
          Math.sin(angle) * radius * 2
        );
        positionCalculated = true;
      } else if (spaceFeature.orbitTarget === 'independent' || spaceFeature.orbitTarget === 'star') {
        // Independent orbit around system center (star)
        const angle = time * (spaceFeature.orbitSpeed || 0.01) + (spaceFeature.orbitOffset || 0);
        const radius = spaceFeature.orbitRadius || 50;
        
        featurePosition.set(
          Math.cos(angle) * radius * 2,
          0,
          Math.sin(angle) * radius * 2
        );
        positionCalculated = true;
      } else {
        console.log(`Unknown orbit target: ${spaceFeature.orbitTarget}`);
      }

      // If position calculation failed, use fallback position or disable tracking
      if (!positionCalculated || featurePosition.length() < 5) {
        console.warn(`Space feature orbital tracking failed:`, {
          featureName: spaceFeature.name,
          positionCalculated,
          featurePosition: featurePosition.toArray(),
          distance: featurePosition.length(),
          orbitTarget: spaceFeature.orbitTarget,
          orbitTargetId: spaceFeature.orbitTargetId,
          orbitRadius: spaceFeature.orbitRadius,
          orbitSpeed: spaceFeature.orbitSpeed,
          orbitOffset: spaceFeature.orbitOffset,
          currentSystem: !!(window as any).currentSystemRef?.current,
          systemPlanets: (window as any).currentSystemRef?.current?.planets?.length || 0
        });
        isSpaceFeatureTrackingRef.current = false;
        spaceFeatureTargetRef.current = null;
        return;
      }

      // Position camera at tracking distance from space feature
      const trackingDistance = spaceFeatureDistanceRef.current;
      const cameraOffsetAngle = time * 0.5; // Slow camera orbit around feature
      
      const cameraDirection = new Vector3(
        Math.cos(cameraOffsetAngle),
        0.3, // Elevated angle
        Math.sin(cameraOffsetAngle)
      ).normalize();

      const cameraPos = featurePosition.clone().add(cameraDirection.multiplyScalar(trackingDistance));

      // Direct position copy for smooth tracking
      camera.position.copy(cameraPos);
      camera.lookAt(featurePosition);
      camera.updateMatrix();
      camera.updateMatrixWorld(true);
      
      // Debug logging
      if (Math.random() < 0.01) { // 1% chance to log
        console.log('Space feature orbital tracking update:', {
          featureName: spaceFeature.name,
          featurePos: featurePosition.toArray().map((n: number) => n.toFixed(2)),
          cameraPos: cameraPos.toArray().map((n: number) => n.toFixed(2))
        });
      }

      // Skip movement controls when in space feature tracking
      return;
    }

    const controls = get();

    // Progressive boost system
    let speedMultiplier = 1;
    if (controls.boost) {
      if (!lastBoostStateRef.current) {
        // Just started boosting
        boostStartTimeRef.current = Date.now();
      }

      if (boostStartTimeRef.current) {
        const boostDuration = (Date.now() - boostStartTimeRef.current) / 1000;
        const progress = Math.min(boostDuration / BOOST_BUILDUP_TIME, 1);
        speedMultiplier = BOOST_MULTIPLIER_MIN + (BOOST_MULTIPLIER_MAX - BOOST_MULTIPLIER_MIN) * progress;
      }
    } else {
      // Reset boost timer when not boosting
      boostStartTimeRef.current = null;
    }

    lastBoostStateRef.current = controls.boost;
    const speed = MOVEMENT_SPEED * speedMultiplier;

    // Calculate movement based on camera orientation
    const forward = new Vector3(0, 0, -1);
    const right = new Vector3(1, 0, 0);
    const worldUp = new Vector3(0, 1, 0); // Keep Y movement world-relative

    // Apply camera rotation only to forward/back and left/right
    forward.applyQuaternion(camera.quaternion);
    right.applyQuaternion(camera.quaternion);

    // Check if any movement keys are pressed
    const isMoving = controls.forward || controls.backward || controls.leftward || 
                    controls.rightward || controls.up || controls.down;

    // Get active controls for logging and position saving
    const activeControls = Object.entries(controls)
      .filter(([_, active]) => active)
      .map(([key, _]) => key);

    if (isMoving && !(window as any).disableGalacticSystemControls) {
      // Debug camera movement conflicts
      if (Math.random() < 0.005) { // 0.5% chance to log
        console.log('CameraController movement update:', {
          scope: currentScope,
          position: camera.position.toArray().map(n => n.toFixed(2)),
          isOrbitalTracking: isOrbitalTrackingRef.current,
          activeControls
        });
      }
      // Reset target velocity and apply movement inputs
      targetVelocityRef.current.set(0, 0, 0);

      if (controls.forward) {
        const forwardVec = forward.clone().multiplyScalar(speed);
        targetVelocityRef.current.add(forwardVec);
      }
      if (controls.backward) {
        const backwardVec = forward.clone().multiplyScalar(-speed);
        targetVelocityRef.current.add(backwardVec);
      }
      if (controls.leftward) {
        const leftVec = right.clone().multiplyScalar(-speed);
        targetVelocityRef.current.add(leftVec);
      }
      if (controls.rightward) {
        const rightVec = right.clone().multiplyScalar(speed);
        targetVelocityRef.current.add(rightVec);
      }
      if (controls.up) {
        const upVec = worldUp.clone().multiplyScalar(speed);
        targetVelocityRef.current.add(upVec);
      }
      if (controls.down) {
        const downVec = worldUp.clone().multiplyScalar(-speed);
        targetVelocityRef.current.add(downVec);
      }

      // Smooth velocity interpolation when moving
      velocityRef.current.lerp(targetVelocityRef.current, 0.2);
    } else {
      // Smooth deceleration when stopping
      velocityRef.current.multiplyScalar(0.88);

      // Complete stop for very small velocities
      if (velocityRef.current.length() < 0.01) {
        velocityRef.current.set(0, 0, 0);
      }
    }

    // Apply velocity to camera position
    if (velocityRef.current.length() > 0.001) {
      camera.position.add(velocityRef.current.clone().multiplyScalar(delta));
    }

    // Only update store position when it actually changes significantly
    if (camera.position.distanceTo(lastPositionRef.current) > 0.1) {
      setPosition(camera.position.clone());
      lastPositionRef.current.copy(camera.position);
    }

    // Removed camera position saving functionality
  });

  return null;
}