import React from 'react';
import { useUniverse } from '../../lib/stores/useUniverse';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Separator } from './separator';

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
      zIndex: 20
    }}>
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: '18px' }}>
            {currentScope === 'galactic' && selectedStar && selectedStar.name}
            {currentScope === 'system' && selectedPlanet && selectedPlanet.name}
            {currentScope === 'planetary' && selectedPlanet && selectedPlanet.name}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Star Information */}
          {selectedStar && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Star Information
              </h4>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                <div>Class: {selectedStar.spectralClass}</div>
                <div>Mass: {selectedStar.mass.toFixed(2)} solar masses</div>
                <div>Temperature: {Math.round(selectedStar.temperature)}K</div>
                <div>Age: {selectedStar.age.toFixed(1)} billion years</div>
                <div>Planets: {selectedStar.planetCount}</div>
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
              <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Planet Information
              </h4>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                <div>Type: {selectedPlanet.type.replace('_', ' ')}</div>
                <div>Radius: {selectedPlanet.radius.toFixed(2)} Earth radii</div>
                <div>Mass: {selectedPlanet.mass.toFixed(2)} Earth masses</div>
                <div>Temperature: {Math.round(selectedPlanet.temperature)}K</div>
                <div>Moons: {selectedPlanet.moons.length}</div>
                {selectedPlanet.atmosphere.length > 0 && (
                  <div>Atmosphere: {selectedPlanet.atmosphere.join(', ')}</div>
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
            <div style={{ marginTop: '16px' }}>
              <Separator style={{ margin: '16px 0 8px 0' }} />
              <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                System Overview
              </h4>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                <div>Planets: {selectedSystem.planets.length}</div>
                <div>Asteroid Belts: {selectedSystem.asteroidBelts.length}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
