# 3D Universe Mapper

## Overview

A comprehensive 3D universe mapping application built with React, Three.js, and Express. The application provides an immersive 3D experience for exploring procedurally generated universes across multiple scales - galactic, system, and planetary levels. Users can navigate through space in both sandbox and lore modes, with full CRUD capabilities for universe data.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **3D Engine**: Three.js via @react-three/fiber and @react-three/drei
- **UI Components**: Radix UI primitives with Tailwind CSS
- **State Management**: Zustand for application state (universe, camera, game, audio)
- **Query Management**: TanStack React Query for server state

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Development**: Hot module replacement with Vite middleware

### Build System
- **Frontend**: Vite with React plugin and GLSL shader support
- **Backend**: ESBuild for server bundling
- **Development**: Single dev server with proxy routing

## Key Components

### 3D Rendering System
- **CameraController**: First-person camera with mouse look and keyboard controls
- **Multi-scale Views**: 
  - GalacticView: Star field visualization with procedural generation
  - SystemView: Planetary orbits and celestial body rendering
  - PlanetaryView: Surface exploration with terrain and features
- **Lighting**: Dynamic lighting system with ambient and directional lights
- **Post-processing**: Visual effects and atmosphere rendering

### Universe Generation
- **StarGenerator**: Procedural star creation with realistic stellar classifications
- **SystemGenerator**: Planetary system generation with orbital mechanics
- **PlanetGenerator**: Surface feature and terrain generation
- **Seeded Generation**: Deterministic universe creation for consistency

### Navigation System
- **Multi-scope Navigation**: Seamless transitions between galactic, system, and planetary views
- **Breadcrumb System**: Hierarchical navigation tracking
- **Camera Transitions**: Smooth animated transitions between scales
- **Selection System**: Interactive object selection and inspection

### Admin Interface (Lore Mode)
- **Real-time Editing**: Live modification of universe objects
- **Property Panels**: Detailed editing interfaces for stars and planets
- **Save/Load System**: Universe data persistence and file management

## Data Flow

1. **Universe Initialization**: Application loads or generates universe data based on mode
2. **State Management**: Zustand stores manage universe data, camera state, and UI state
3. **3D Rendering**: React Three Fiber renders the current scope with appropriate objects
4. **User Interaction**: Mouse/keyboard input drives camera movement and object selection
5. **Data Persistence**: Changes in lore mode are automatically saved to the database
6. **Navigation**: Scope transitions trigger camera animations and data loading

## External Dependencies

### Core Libraries
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Three.js helpers and components
- **@react-three/postprocessing**: Visual effects pipeline
- **three**: 3D graphics library

### UI Framework
- **@radix-ui/react-***: Accessible UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management

### Database & API
- **drizzle-orm**: Type-safe SQL ORM
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **@tanstack/react-query**: Server state management

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development
- Single process running both client and server
- Vite dev server with HMR for frontend
- Express server with auto-reload for backend
- PostgreSQL database via Neon

### Production
- Static build via Vite for client assets
- Server bundle via ESBuild for backend
- Express serves both API and static files
- Database connection via environment variables

### Hosting
- Configured for Replit deployment
- Autoscale deployment target
- Environment variable configuration for database

## Changelog
- June 22, 2025: Initial setup
- June 22, 2025: Completed 3D Universe Mapper with WebGL rendering, three-scope navigation (galactic/system/planetary), procedural generation, and WASD+mouse controls. Fixed JavaScript errors and confirmed 3D rendering works properly.
- June 22, 2025: Added mode selection screen to delay 3D generation until user chooses sandbox/lore mode. Simplified UI to prevent runtime errors.
- June 22, 2025: Implemented progressive speed boost system with 200% faster base movement and shift boost that builds from 200% to 8000% over 3 seconds of continuous holding.
- June 22, 2025: Completed core galactic view features: star selection with visual feedback, information panels, camera-relative rings, realistic star scaling (half solar radii), and optimized 100-star LOD configuration for performance.
- June 22, 2025: Enhanced galactic navigation with crosshair targeting, Tab-key mode switching (mouse/navigation), larger selection hitboxes scaling to solar radii, and robust escape-key handling to prevent browser conflicts.
- June 22, 2025: Implemented system view with realistic orbital mechanics, 3D planetary motion, authentic stellar scaling, and procedural planet generation using real astronomical data. Added camera position saving for seamless navigation between galactic and system views.
- June 22, 2025: Scaled up to 2000-star universe generation with expanded spatial distribution (400-unit radius) for immersive galactic exploration without separate skybox - stars serve as both navigable objects and cosmic background.
- June 22, 2025: Added bloom post-processing effects with emissive materials for authentic stellar glow. System view features enhanced bloom intensity and scaled starfield background for visual continuity between navigation scopes.
- June 22, 2025: Implemented comprehensive system view interactivity with clickable planets and stars, information panels showing detailed properties (radius, mass, temperature, atmosphere), visual selection rings, and planet-specific glow effects based on 8 distinct planet types.
- June 22, 2025: Enhanced system view with realistic orbital mechanics - doubled planet spacing, fewer planets for larger stars, authentic size scaling, and persistent system caching. Added bump map preparation to all stellar materials. Fixed star selection UI and unified information panel system across both galactic and system views.
- June 22, 2025: Implemented solar surface texture mapping for all stars using high-resolution 2K solar texture with opacity blending. Surface details like granulation patterns and solar flares now show through star colors for enhanced visual realism across galactic and system views.
- June 22, 2025: Removed dynamic bloom intensity system due to performance impact. Reverted to static bloom intensities (0.8 for system view, 0.6 for galactic view) for consistent performance while maintaining stellar visual quality.
- June 22, 2025: Implemented hybrid scaling approach: linear scaling (radius * multiplier) for galactic view to show true stellar size relationships, and logarithmic scaling (Math.log(radius + 1) * multiplier) for system view to prevent overwhelming star sizes while maintaining visual hierarchy.
- June 22, 2025: Modified star coloring to display red dwarfs (luminosity < 2) as bright red (#ff4444) instead of spectral class colors, making low-luminosity stars easily distinguishable across all views.

## User Preferences

Preferred communication style: Simple, everyday language.