import React, { useState } from 'react';
import { useUniverse } from '../../lib/stores/useUniverse';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { PlanetType } from '../../lib/universe/types';

export function AdminPanel() {
  const { 
    mode,
    selectedStar, 
    selectedPlanet,
    updateStar,
    updatePlanet
  } = useUniverse();
  
  const [isVisible, setIsVisible] = useState(false);
  const [editMode, setEditMode] = useState<'star' | 'planet' | null>(null);

  // Only show in lore mode
  if (mode !== 'lore') {
    return null;
  }

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'absolute',
          top: '60px',
          right: '20px',
          pointerEvents: 'auto',
          zIndex: 20
        }}
        variant="outline"
        size="sm"
      >
        Admin Panel
      </Button>
    );
  }

  const handleStarUpdate = (field: string, value: any) => {
    if (selectedStar) {
      updateStar(selectedStar.id, { [field]: value });
    }
  };

  const handlePlanetUpdate = (field: string, value: any) => {
    if (selectedPlanet) {
      updatePlanet(selectedPlanet.id, { [field]: value });
    }
  };

  const planetTypes: PlanetType[] = [
    'gas_giant', 'frost_giant', 'arid_world', 'verdant_world',
    'acidic_world', 'nuclear_world', 'ocean_world', 'dead_world'
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '60px',
      right: '20px',
      width: '350px',
      maxHeight: '70vh',
      overflow: 'auto',
      pointerEvents: 'auto',
      zIndex: 20
    }}>
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <CardTitle style={{ fontSize: '16px' }}>Admin Panel</CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <Button
              variant={editMode === 'star' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('star')}
              disabled={!selectedStar}
            >
              Edit Star
            </Button>
            <Button
              variant={editMode === 'planet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('planet')}
              disabled={!selectedPlanet}
            >
              Edit Planet
            </Button>
          </div>

          {/* Star Editor */}
          {editMode === 'star' && selectedStar && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <Label htmlFor="star-name">Name</Label>
                <Input
                  id="star-name"
                  value={selectedStar.name}
                  onChange={(e) => handleStarUpdate('name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="star-class">Spectral Class</Label>
                <Select
                  value={selectedStar.spectralClass}
                  onValueChange={(value) => handleStarUpdate('spectralClass', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['O', 'B', 'A', 'F', 'G', 'K', 'M'].map(cls => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="star-mass">Mass (solar masses)</Label>
                <Input
                  id="star-mass"
                  type="number"
                  step="0.1"
                  value={selectedStar.mass}
                  onChange={(e) => handleStarUpdate('mass', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="star-temp">Temperature (K)</Label>
                <Input
                  id="star-temp"
                  type="number"
                  value={selectedStar.temperature}
                  onChange={(e) => handleStarUpdate('temperature', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="star-planets">Planet Count</Label>
                <Input
                  id="star-planets"
                  type="number"
                  min="0"
                  max="20"
                  value={selectedStar.planetCount}
                  onChange={(e) => handleStarUpdate('planetCount', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Planet Editor */}
          {editMode === 'planet' && selectedPlanet && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <Label htmlFor="planet-name">Name</Label>
                <Input
                  id="planet-name"
                  value={selectedPlanet.name}
                  onChange={(e) => handlePlanetUpdate('name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="planet-type">Type</Label>
                <Select
                  value={selectedPlanet.type}
                  onValueChange={(value) => handlePlanetUpdate('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {planetTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="planet-radius">Radius (Earth radii)</Label>
                <Input
                  id="planet-radius"
                  type="number"
                  step="0.1"
                  value={selectedPlanet.radius}
                  onChange={(e) => handlePlanetUpdate('radius', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="planet-mass">Mass (Earth masses)</Label>
                <Input
                  id="planet-mass"
                  type="number"
                  step="0.1"
                  value={selectedPlanet.mass}
                  onChange={(e) => handlePlanetUpdate('mass', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="planet-temp">Temperature (K)</Label>
                <Input
                  id="planet-temp"
                  type="number"
                  value={selectedPlanet.temperature}
                  onChange={(e) => handlePlanetUpdate('temperature', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          {!editMode && (
            <p style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
              Select an object and choose an edit mode to begin editing.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
