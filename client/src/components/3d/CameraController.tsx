import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { useCamera } from '../../lib/stores/useCamera';
import { useUniverse } from '../../lib/stores/useUniverse';

const MOVEMENT_SPEED = 0.5;
const BOOST_MULTIPLIER = 3;
const MOUSE_SENSITIVITY = 0.002;

export function CameraController() {
  const { camera, gl } = useThree();
  const { position, target, isTransitioning, setPosition, setTarget } = useCamera();
  const { currentScope } = useUniverse();
  
  const [sub, get] = useKeyboardControls();
  const isLockedRef = useRef(false);
  const velocityRef = useRef(new Vector3());
  const targetVelocityRef = useRef(new Vector3());

  // Handle pointer lock
  useEffect(() => {
    const canvas = gl.domElement;
    
    const handleClick = () => {
      if (!isLockedRef.current) {
        canvas.requestPointerLock();
      }
    };

    const handlePointerLockChange = () => {
      isLockedRef.current = document.pointerLockElement === canvas;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isLockedRef.current || isTransitioning) return;

      const { movementX, movementY } = event;
      
      // Update camera rotation based on mouse movement
      camera.rotation.y -= movementX * MOUSE_SENSITIVITY;
      camera.rotation.x -= movementY * MOUSE_SENSITIVITY;
      
      // Clamp vertical rotation
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    };

    canvas.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera, gl.domElement, isTransitioning]);

  // Handle keyboard movement
  useFrame((state, delta) => {
    if (isTransitioning) {
      // During transitions, smoothly interpolate to target position
      camera.position.lerp(position, delta * 2);
      camera.lookAt(target);
      return;
    }

    const controls = get();
    const speed = controls.boost ? MOVEMENT_SPEED * BOOST_MULTIPLIER : MOVEMENT_SPEED;
    
    // Calculate movement based on camera orientation
    const forward = new Vector3(0, 0, -1);
    const right = new Vector3(1, 0, 0);
    const up = new Vector3(0, 1, 0);
    
    forward.applyQuaternion(camera.quaternion);
    right.applyQuaternion(camera.quaternion);
    up.applyQuaternion(camera.quaternion);

    // Reset target velocity
    targetVelocityRef.current.set(0, 0, 0);

    // Apply movement inputs
    if (controls.forward) {
      targetVelocityRef.current.add(forward.multiplyScalar(speed));
    }
    if (controls.backward) {
      targetVelocityRef.current.add(forward.multiplyScalar(-speed));
    }
    if (controls.leftward) {
      targetVelocityRef.current.add(right.multiplyScalar(-speed));
    }
    if (controls.rightward) {
      targetVelocityRef.current.add(right.multiplyScalar(speed));
    }
    if (controls.up) {
      targetVelocityRef.current.add(up.multiplyScalar(speed));
    }
    if (controls.down) {
      targetVelocityRef.current.add(up.multiplyScalar(-speed));
    }

    // Smooth velocity interpolation
    velocityRef.current.lerp(targetVelocityRef.current, delta * 10);
    
    // Apply velocity to camera position
    camera.position.add(velocityRef.current.clone().multiplyScalar(delta));
    
    // Update store with current position
    setPosition(camera.position.clone());
    
    // Log controls for debugging
    const activeControls = Object.entries(controls)
      .filter(([_, active]) => active)
      .map(([key, _]) => key);
    
    if (activeControls.length > 0) {
      console.log("Active controls:", activeControls);
    }
  });

  return null;
}
