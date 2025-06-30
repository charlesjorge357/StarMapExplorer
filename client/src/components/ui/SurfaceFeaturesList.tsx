// client/src/components/SurfaceFeaturesList.tsx

import React from 'react';
import { SurfaceFeature } from 'shared/schema';

interface SurfaceFeaturesListProps {
  features: SurfaceFeature[];
}

const SurfaceFeaturesList: React.FC<SurfaceFeaturesListProps> = ({ features }) => {
  return (
    <div style={{ fontSize: '14px', marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
      <h3>Surface Features</h3>
      <ul>
        {features.length > 0 ? (
          features.map((feature) => (
            <li key={feature.id}>
              <strong>{feature.name}</strong> - Type: {feature.type} - Position: [{feature.position[0]}, {feature.position[1]}]
            </li>
          ))
        ) : (
          <li>No surface features available.</li>
        )}
      </ul>
    </div>
  );
};

export default SurfaceFeaturesList;