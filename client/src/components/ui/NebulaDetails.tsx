
import React from 'react';
import { Nebula } from '../../../shared/schema';

interface NebulaDetailsProps {
  nebula: Nebula;
}

export function NebulaDetails({ nebula }: NebulaDetailsProps) {
  return (
    <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg min-w-72 backdrop-blur border border-gray-600" style={{ marginTop: '320px' }}>
      <h3 className="text-lg font-bold" style={{ color: nebula.color }}>
        {nebula.name}
      </h3>
      <p className="text-sm text-gray-300 mb-2 capitalize">{nebula.type} Nebula</p>
      <div className="space-y-1 text-sm">
        <p><span style={{ color: nebula.color }}>Type:</span> {nebula.type.charAt(0).toUpperCase() + nebula.type.slice(1)}</p>
        <p><span style={{ color: nebula.color }}>Radius:</span> {nebula.radius.toFixed(1)} ly</p>
        <p><span style={{ color: nebula.color }}>Composition:</span> {nebula.composition}</p>
        <p><span style={{ color: nebula.color }}>Distance:</span> {Math.sqrt(
          nebula.position[0]**2 + 
          nebula.position[1]**2 + 
          nebula.position[2]**2
        ).toFixed(1)} ly</p>
      </div>
      <div className="mt-3 text-xs text-gray-400">
        <p>Click again to deselect</p>
      </div>
    </div>
  );
}
