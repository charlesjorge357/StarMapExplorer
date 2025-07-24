import React from 'react';

interface ArmyInfoPanelProps {
  army: any;
  onClose: () => void;
}

export function ArmyInfoPanel({ army, onClose }: ArmyInfoPanelProps) {
  if (!army) return null;

  const getFactionColor = (factionName: string) => {
    if (!factionName || factionName === 'Contested Zone') return '#888888';
    // Generate consistent color based on faction name
    let hash = 0;
    for (let i = 0; i < factionName.length; i++) {
      hash = factionName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const factionColor = getFactionColor(army?.faction?.name || 'Unknown');

  const getTotalUnits = () => {
    if (!army?.composition) return 0;
    return army.composition.reduce((total: number, division: any) => total + (division?.size || 0), 0);
  };

  return (
    <div className="fixed top-4 left-4 w-80 bg-black/90 border-2 rounded-lg p-4 text-white font-mono text-sm z-50"
         style={{ borderColor: factionColor }}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold" style={{ color: factionColor }}>
          Army Information
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
          <span className="text-gray-400">Army ID:</span>
          <span className="ml-2">{army?.id || 'Unknown'}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Faction:</span>
          <span className="ml-2" style={{ color: factionColor }}>
            {army?.faction?.name || 'Unknown'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">Divisions:</span>
          <span className="ml-2">{army?.composition?.length || 0}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Total Units:</span>
          <span className="ml-2">{getTotalUnits().toLocaleString()}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Position:</span>
          <span className="ml-2">
            [{army?.position?.[0]?.toFixed(2) || '0'}, {army?.position?.[1]?.toFixed(2) || '0'}]
          </span>
        </div>
        
        {army?.composition && army.composition.length > 0 && (
          <div>
            <span className="text-gray-400">Division Composition:</span>
            <div className="ml-2 mt-1 space-y-1 max-h-32 overflow-y-auto">
              {army.composition.map((division: any, index: number) => (
                <div key={division?.id || index} className="text-green-300">
                  • Division {index + 1}: {division?.size?.toLocaleString() || 0} units
                </div>
              ))}
            </div>
          </div>
        )}
        
        {army?.faction?.technology && (
          <div>
            <span className="text-gray-400">Technology Level:</span>
            <span className="ml-2">{army.faction.technology}</span>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-3">
          Click on planet surface to move army
        </div>
      </div>
    </div>
  );
}