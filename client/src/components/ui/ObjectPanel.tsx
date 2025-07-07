import React from 'react';
import { useUniverse } from '../../lib/stores/useUniverse';
import { Button } from './button';

export function ObjectPanel() {
  const { 
    currentScope,
    selectedStar, 
    selectedPlanet, 
    selectedSystem,
    setScope
  } = useUniverse();

  // Don't show panel if nothing is selected
  if (!selectedStar && !selectedPlanet) {
    return null;
  }

  const handleJumpToSystem = () => {
    if (selectedStar) {
      setScope('system');
    }
  };

  const handleJumpToPlanet = () => {
    if (selectedPlanet) {
      setScope('planetary');
    }
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      width: '320px',
      pointerEvents: 'auto',
      zIndex: 20,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
        {currentScope === 'galactic' && (selectedStar?.name || '---')}
        {currentScope === 'system' && (selectedPlanet?.name || '---')}
        {currentScope === 'planetary' && (selectedPlanet?.name || '---')}
      </div>
      
      {/* Star Information */}
      {selectedStar && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
            Star Information
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <div>Class: {selectedStar?.spectralClass || '---'}</div>
            <div>Mass: {selectedStar?.mass ? selectedStar.mass.toFixed(2) + ' solar masses' : '---'}</div>
            <div>Temperature: {selectedStar?.temperature ? Math.round(selectedStar.temperature) + 'K' : '---'}</div>
            <div>Age: {selectedStar?.age ? selectedStar.age.toFixed(1) + ' billion years' : '---'}</div>
            <div>Planets: {selectedStar?.planetCount ?? '---'}</div>
          </div>
          
          {currentScope === 'galactic' && (
            <Button
              onClick={handleJumpToSystem}
              size="sm"
              style={{ marginTop: '8px', width: '100%' }}
            >
              Jump to System
            </Button>
          )}
        </div>
      )}
      
      {/* Planet Information */}
      {selectedPlanet && (
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
            Planet Information
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <div>Type: {selectedPlanet?.type?.replace('_', ' ') || '---'}</div>
            <div>Radius: {selectedPlanet?.radius ? selectedPlanet.radius.toFixed(2) + ' Earth radii' : '---'}</div>
            <div>Mass: {selectedPlanet?.mass ? selectedPlanet.mass.toFixed(2) + ' Earth masses' : '---'}</div>
            <div>Temperature: {selectedPlanet?.temperature ? Math.round(selectedPlanet.temperature) + 'K' : '---'}</div>
            <div>Moons: {selectedPlanet?.moons?.length ?? '---'}</div>
            {selectedPlanet?.atmosphere?.length > 0 && (
              <div>Atmosphere: {selectedPlanet?.atmosphere?.join(', ') || '---'}</div>
            )}
          </div>
          
          {currentScope === 'system' && (
            <Button
              onClick={handleJumpToPlanet}
              size="sm"
              style={{ marginTop: '8px', width: '100%' }}
            >
              Jump to Surface
            </Button>
          )}
        </div>
      )}
      
      {/* System Information */}
      {selectedSystem && currentScope === 'system' && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
            System Overview
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <div>Planets: {selectedSystem?.planets?.length ?? '---'}</div>
            <div>Asteroid Belts: {selectedSystem?.asteroidBelts?.length ?? '---'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
