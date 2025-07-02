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

    const distance = Math.max(planetRadius * 25, 15);

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

    // One-time positioning with offset
    const time = Date.now() * 0.0001;
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

  // Reset camera to center star
  const resetToStar = () => {
    if (!camera) return;

    // Stop orbital tracking
    isOrbitalTrackingRef.current = false;
    orbitalTargetRef.current = null;

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
      if (event.key === 'Escape' && isOrbitalTrackingRef.current) {
        console.log('Escape pressed - stopping orbital tracking');
        isOrbitalTrackingRef.current = false;
        orbitalTargetRef.current = null;
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);

  // Clear orbital tracking when leaving system view
  useEffect(() => {
    if (currentScope !== 'system' && isOrbitalTrackingRef.current) {
      console.log('Clearing orbital tracking - left system view');
      isOrbitalTrackingRef.current = false;
      orbitalTargetRef.current = null;
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
    (window as any).resetToStar = resetToStar;
    (window as any).setCameraLookingAtStar = setCameraLookingAtStar;
    return () => {
      delete (window as any).homeToPlanet;
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

  // Set camera position based on scope
  useEffect(() => {
    if (currentScope === 'system') {
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
  }, [camera, currentScope]);

  // Handle keyboard movement
  useFrame((state, delta) => {
    if (isTransitioning) {
      // During transitions, smoothly interpolate to target position
      camera.position.lerp(position, delta * 2);
      camera.lookAt(target);
      return;
    }

    // Handle orbital tracking - copy planet's movement data directly to camera
    if (isOrbitalTrackingRef.current && orbitalTargetRef.current) {
      const planetData = orbitalTargetRef.current;
      const time = Date.now() * 0.0001;
      const planetIndex = planetData.index || 0;
      const angle = time * planetData.orbitSpeed + planetIndex * (Math.PI * 2 / 8);

      // Calculate exact planet position (identical to SystemView calculation)
      const planetPos = new Vector3(
        Math.cos(angle) * planetData.orbitRadius * 2,
        0,
        Math.sin(angle) * planetData.orbitRadius * 2
      );

      // Position camera at fixed distance from planet, not star
      const cameraDistance = Math.max(planetData.radius * 8, 5);
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

      // Skip movement controls when in orbital tracking
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