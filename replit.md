# 3D Universe Mapper

## Overview

A comprehensive 3D universe mapping application built with React, Three.js, and Express. The application provides an immersive 3D experience for exploring procedurally generated universes across multiple scales - galactic, system, and planetary levels. Users can navigate through space in both sandbox and lore modes, with full CRUD capabilities for universe data.

## User Preferences

Preferred communication style: Simple, everyday language.

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

### Key Features
- **Multi-scope Navigation**: Seamless transitions between galactic, system, and planetary views with hierarchical navigation.
- **Procedural Generation**: Deterministic generation of stars, planetary systems, and planetary features, including asteroid belts and moons.
- **3D Rendering**: Dynamic lighting, post-processing effects (bloom), and realistic celestial body rendering with comprehensive texture mapping for various planet types.
- **Interactive Elements**: Selectable stars, planets, and surface features with detailed information panels.
- **Lore Mode (Admin Interface)**: Real-time editing and persistence of universe data.
- **Space Features**: Detailed 3D models for space stations, mining stations, orbital defenses, ship graveyards, and research stations.
- **Unit Management**: Army movement and control on planetary surfaces, and fleet movement with orbital mechanics in system view.
- **Warp Lane Network**: Dijkstra's algorithm-based pathfinding for galactic warp lanes.
- **Audio System**: Background music with automatic track progression.

### Data Flow
Universe data is initialized or generated, managed by Zustand, rendered by React Three Fiber, and persisted to the database in lore mode.

### Deployment Strategy
- **Development**: Single process running client and server with Vite HMR and Express auto-reload.
- **Production**: Static client build, bundled backend, served by Express, with database connection via environment variables.
- **Hosting**: Configured for Replit deployment with autoscale.

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