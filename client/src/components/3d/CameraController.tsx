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

  // Camera homing functionality with frame-synced positioning
  const homeToPlanet = (planetPosition: Vector3, planetRadius: number, planetData?: any) => {
    if (!camera) return;
    
    const distance = Math.max(planetRadius * 25, 15);
    
    // Create a continuous tracking function that updates with the frame
    const trackingFunction = () => {
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
      
      // Use the same timing as SystemView planet animation
      const time = Date.now() * 0.0001; // Changed to Date.now() to match SystemView
      const angle = time * planetData.orbitSpeed;
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
    };
    
    // Execute immediately
    trackingFunction();
    
    console.log(`Camera homed to planet ${planetData?.name || 'Unknown'} with synchronized timing`);
  };

  // Expose camera homing to window for external access
  useEffect(() => {
    (window as any).homeToPlanet = homeToPlanet;
    return () => {
      delete (window as any).homeToPlanet;
    };
  }, [camera]);

  // Mouse-only camera control with right-click drag
  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseMove = (event: MouseEvent) => {
      // Only rotate camera during right-click drag
      if (!isRightClickDragRef.current || isTransitioning) return;

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
      if (event.button === 2) { // Right click
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
      // Maintain camera orientation but position it at fixed distance from star
      const currentDistance = camera.position.length();
      const targetDistance = 50; // Fixed distance from star
      
      if (currentDistance < 5) {
        // If too close or at origin, set default position
        camera.position.set(0, 20, 200);
        camera.lookAt(0, 0, 0);
      } else {
        // Maintain current direction but set proper distance
        const direction = camera.position.clone().normalize();
        camera.position.copy(direction.multiplyScalar(targetDistance));
        camera.lookAt(0, 0, 0);
      }
      
      // Set extended camera range for system view
      camera.near = 0.1;
      camera.far = 500000;
      camera.updateProjectionMatrix();
      console.log('Set system view camera position:', camera.position);
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
    
    if (isMoving) {
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
