import { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';

export function FPSMonitor() {
  const [fps, setFps] = useState(60);
  const [frameCount, setFrameCount] = useState(0);
  const [lastTime, setLastTime] = useState(performance.now());

  useFrame(() => {
    const currentTime = performance.now();
    setFrameCount(prev => prev + 1);

    if (currentTime >= lastTime + 1000) {
      setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
      setFrameCount(0);
      setLastTime(currentTime);
    }
  });

  const fpsColor = fps >= 50 ? '#4CAF50' : fps >= 30 ? '#FF9800' : '#F44336';

  return null;
}

export function FPSDisplay({ fps }: { fps: number }) {
  const fpsColor = fps >= 50 ? '#4CAF50' : fps >= 30 ? '#FF9800' : '#F44336';
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: fpsColor,
      padding: '8px 12px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '14px',
      fontWeight: 'bold',
      zIndex: 9999,
      border: `1px solid ${fpsColor}`,
    }}>
      FPS: {fps}
    </div>
  );
}

export function useFPS() {
  const [fps, setFps] = useState(60);
  const [frameCount, setFrameCount] = useState(0);
  const [lastTime, setLastTime] = useState(performance.now());

  useEffect(() => {
    let animationFrameId: number;

    const updateFPS = () => {
      const currentTime = performance.now();
      setFrameCount(prev => prev + 1);

      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        setFrameCount(0);
        setLastTime(currentTime);
      }

      animationFrameId = requestAnimationFrame(updateFPS);
    };

    animationFrameId = requestAnimationFrame(updateFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [frameCount, lastTime]);

  return fps;
}
