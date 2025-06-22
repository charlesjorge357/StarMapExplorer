import React from 'react';
import { useUniverse } from '../../lib/stores/useUniverse';

export function ModeSelector() {
  const { setMode, isLoading } = useUniverse();

  const handleModeSelect = (mode: 'sandbox' | 'lore') => {
    setMode(mode);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.9)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '12px',
      padding: '40px',
      textAlign: 'center',
      color: 'white',
      zIndex: 100,
      minWidth: '400px'
    }}>
      <h1 style={{ 
        fontSize: '32px', 
        marginBottom: '16px',
        fontWeight: 'bold'
      }}>
        3D Universe Mapper
      </h1>
      
      <p style={{ 
        fontSize: '16px', 
        marginBottom: '32px',
        color: '#ccc',
        lineHeight: '1.5'
      }}>
        Choose your exploration mode to begin your journey through the cosmos
      </p>

      {isLoading ? (
        <div style={{ fontSize: '18px', color: '#fff' }}>
          Generating universe...
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button
            onClick={() => handleModeSelect('sandbox')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '16px 24px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              minWidth: '150px'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🌌 Sandbox Mode
            <div style={{ fontSize: '12px', fontWeight: 'normal', marginTop: '4px' }}>
              Procedural generation
            </div>
          </button>

          <button
            onClick={() => handleModeSelect('lore')}
            disabled={true}
            style={{
              background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '16px 24px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'not-allowed',
              opacity: 0.5,
              minWidth: '150px'
            }}
            title="Lore mode temporarily disabled"
          >
            📚 Lore Mode
            <div style={{ fontSize: '12px', fontWeight: 'normal', marginTop: '4px' }}>
              Pre-built universe (Disabled)
            </div>
          </button>
        </div>
      )}

      <div style={{ 
        marginTop: '24px', 
        fontSize: '14px', 
        color: '#888',
        lineHeight: '1.4'
      }}>
        Use WASD keys to move and mouse to look around once started
      </div>
    </div>
  );
}