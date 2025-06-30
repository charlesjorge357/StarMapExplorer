import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Nebula } from 'shared/schema';

interface NebulaScreenTintProps {
  nebulas: Nebula[];
}

export function NebulaScreenTint({ nebulas }: NebulaScreenTintProps) {
  const { camera } = useThree();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Create overlay element
  useEffect(() => {
    if (!overlayRef.current) {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '1000';
      overlay.style.transition = 'background-color 0.5s ease';
      overlay.style.backgroundColor = 'transparent';
      overlay.id = 'nebula-tint-overlay';
      document.body.appendChild(overlay);
      overlayRef.current = overlay;
    }
    
    // Cleanup function - always runs when component unmounts
    return () => {
      if (overlayRef.current) {
        document.body.removeChild(overlayRef.current);
        overlayRef.current = null;
      }
      // Also clean up any stray overlays
      const existingOverlay = document.getElementById('nebula-tint-overlay');
      if (existingOverlay) {
        document.body.removeChild(existingOverlay);
      }
    };
  }, []);

  useFrame(() => {
    if (!overlayRef.current) return;

    const cameraPos = camera.position;
    let closestNebula: Nebula | null = null;
    let minDistance = Infinity;
    let tintIntensity = 0;

    // Find closest nebula and check if camera is inside
    for (const nebula of nebulas) {
      const nebulaPos = new THREE.Vector3(...nebula.position);
      const distance = cameraPos.distanceTo(nebulaPos);
      
      // Check if camera is inside the nebula (using scaled radius to match visual size)
      const scaledRadius = nebula.radius * 4.5; // Match the larger nebula mesh scaling
      if (distance < scaledRadius) {
        const penetration = 1 - (distance / scaledRadius);
        const intensity = Math.min(penetration * 0.15, 0.15); // Max 15% opacity
        
        if (intensity > tintIntensity) {
          tintIntensity = intensity;
          closestNebula = nebula;
        }
      }
    }

    // Apply tint effect
    if (closestNebula && tintIntensity > 0) {
      const color = closestNebula.color;
      overlayRef.current.style.backgroundColor = `${color}${Math.floor(tintIntensity * 255).toString(16).padStart(2, '0')}`;
    } else {
      overlayRef.current.style.backgroundColor = 'transparent';
    }
  });

  return null; // This component only manages DOM elements
}
