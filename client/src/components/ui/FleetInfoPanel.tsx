import React from 'react';

interface FleetInfoPanelProps {
  fleet: any;
  onClose: () => void;
}

export function FleetInfoPanel({ fleet, onClose }: FleetInfoPanelProps) {
  if (!fleet) return null;

  const factionColor = fleet?.faction?.color || '#888888';

  const getShipTypeDisplay = (type: string) => {
    switch (type) {
      case 'fighter_wing': return 'Fighter Wing';
      case 'bomber_wing': return 'Bomber Wing';
      case 'cruiser': return 'Cruiser';
      case 'destroyer': return 'Destroyer';
      case 'carrier': return 'Carrier';
      case 'dreadnought': return 'Dreadnought';
      case 'battleship': return 'Battleship';
      case 'super_carrier': return 'Super Carrier';
      default: return type;
    }
  };

  const orbitRadius = fleet?.position ? Math.sqrt(
    fleet.position[0] * fleet.position[0] + fleet.position[2] * fleet.position[2]
  ) : 0;
  
  // Convert to AU (divide by 6 to match game scaling)
  const orbitRadiusAU = orbitRadius / 6;

  return (
    <div className="w-full bg-transparent border-2 rounded-lg p-4 text-white font-mono text-sm"
         style={{ borderColor: factionColor }}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold" style={{ color: factionColor }}>
          Fleet Information
        </h3>
        <button 
          onClick={onClose}
          className="text-white hover:text-red-400 transition-colors text-xl leading-none"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Fleet ID:</span>
          <span className="ml-2">{fleet?.id || 'Unknown'}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Faction:</span>
          <span className="ml-2" style={{ color: factionColor }}>
            {fleet?.faction?.name || 'Unknown'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">Ships:</span>
          <span className="ml-2">{fleet?.size || 0}</span>
        </div>
        
        <div className="border-t border-gray-600 pt-2 mt-3">
          <div className="text-cyan-400 text-xs font-bold mb-1">FLEET COMMANDS:</div>
          <div className="text-xs text-gray-300 leading-relaxed">
            • Click anywhere in the system to order fleet movement
            • Fleet will move to the clicked position in space
            • Green ring shows movement target location
          </div>
        </div>
        
        <div>
          <span className="text-gray-400">Orbit Radius:</span>
          <span className="ml-2">{orbitRadiusAU.toFixed(2)} AU</span>
        </div>
        
        <div>
          <span className="text-gray-400">Position:</span>
          <span className="ml-2">
            [{fleet?.position?.[0]?.toFixed(1) || '0'}, {fleet?.position?.[2]?.toFixed(1) || '0'}]
          </span>
        </div>
        
        {fleet?.composition && fleet.composition.length > 0 && (
          <div>
            <span className="text-gray-400">Ship Composition:</span>
            <div className="ml-2 mt-1 space-y-1">
              {fleet.composition.map((ship: any, index: number) => (
                <div key={ship?.id || index} className="text-cyan-300">
                  • {getShipTypeDisplay(ship?.type || 'unknown')} - {ship?.name || 'Unnamed Ship'}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {fleet?.faction?.technology && (
          <div>
            <span className="text-gray-400">Technology Level:</span>
            <span className="ml-2">{fleet.faction.technology}</span>
          </div>
        )}
      </div>
    </div>
  );
}