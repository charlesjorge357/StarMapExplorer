
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Nebula } from 'shared/schema';

interface NebulaScreenTintProps {
  nebulas: Nebula[];
}

export function NebulaScreenTint({ nebulas }: NebulaScreenTintProps) {
  const { camera } = useThree();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const componentIdRef = useRef<string>(`nebula-tint-${Math.random().toString(36).substr(2, 9)}`);

  // Create overlay element with unique ID
  useEffect(() => {
    // Clean up any existing overlays first
    const existingOverlays = document.querySelectorAll('[id^="nebula-tint-"]');
    existingOverlays.forEach(overlay => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });

    // Create new overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '1000';
    overlay.style.transition = 'background-color 0.3s ease';
    overlay.style.backgroundColor = 'transparent';
    overlay.id = componentIdRef.current;
    document.body.appendChild(overlay);
    overlayRef.current = overlay;
    
    // Cleanup function
    return () => {
      if (overlayRef.current && overlayRef.current.parentNode) {
        overlayRef.current.parentNode.removeChild(overlayRef.current);
        overlayRef.current = null;
      }
      // Also clean up by ID as backup
      const overlayById = document.getElementById(componentIdRef.current);
      if (overlayById && overlayById.parentNode) {
        overlayById.parentNode.removeChild(overlayById);
      }
    };
  }, []); // Empty dependency array - only run once

  useFrame(() => {
    if (!overlayRef.current) return;

    const cameraPos = camera.position;
    let closestNebula: Nebula | null = null;
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
      const alpha = Math.floor(tintIntensity * 255).toString(16).padStart(2, '0');
      const backgroundColor = `${color}${alpha}`;
      overlayRef.current.style.backgroundColor = backgroundColor;
    } else {
      overlayRef.current.style.backgroundColor = 'transparent';
    }
  });

  return null; // This component only manages DOM elements
}
