import React from 'react';
import { useUniverse } from '../../lib/stores/useUniverse';
import { Button } from './button';
import { Separator } from './separator';

export function NavigationBar() {
  const { 
    mode, 
    setMode, 
    breadcrumb, 
    jumpToScope, 
    saveUniverse, 
    generateSandbox,
    isLoading 
  } = useUniverse();

  const handleFileLoad = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      useUniverse.getState().loadUniverse(file);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      pointerEvents: 'auto',
      zIndex: 20,
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      {/* Logo/Title */}
      <h1 style={{ 
        color: 'white', 
        fontSize: '20px', 
        fontWeight: 'bold',
        margin: 0
      }}>
        3D Universe Mapper
      </h1>
      
      <Separator orientation="vertical" style={{ height: '24px' }} />
      
      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          variant={mode === 'sandbox' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('sandbox')}
          disabled={isLoading}
        >
          Sandbox
        </Button>
        <Button
          variant={mode === 'lore' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('lore')}
          disabled={isLoading}
        >
          Lore
        </Button>
      </div>
      
      <Separator orientation="vertical" style={{ height: '24px' }} />
      
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {breadcrumb.map((crumb, index) => (
          <React.Fragment key={index}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => jumpToScope(crumb.scope, crumb.id)}
              style={{ color: 'white' }}
            >
              {crumb.name}
            </Button>
            {index < breadcrumb.length - 1 && (
              <span style={{ color: '#666' }}>→</span>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
        {/* Sandbox Controls */}
        {mode === 'sandbox' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateSandbox()}
              disabled={isLoading}
            >
              New Galaxy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={saveUniverse}
              disabled={isLoading}
            >
              Save
            </Button>
            <div style={{ position: 'relative' }}>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.addEventListener('change', handleFileLoad);
                  input.click();
                }}
              >
                Load
              </Button>
            </div>
          </>
        )}
        
        {/* Controls Help */}
        <Button
          variant="ghost"
          size="sm"
          style={{ color: '#888' }}
        >
          WASD + Mouse to move • Click to select
        </Button>
      </div>
    </div>
  );
}
