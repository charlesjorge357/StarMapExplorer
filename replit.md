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
- June 22, 2025: Reverted to traditional spectral class coloring for all stars, removing the red dwarf override system. All stars now display their authentic spectral colors (O-blue, B-blue-white, A-white, F-yellow-white, G-yellow, K-orange, M-red-orange) based on temperature and classification.
- June 22, 2025: Implemented frost giant planet specifications with authentic Uranus/Neptune textures, light blue coloring, and smaller sizes than gas giants (2.5-4.0 vs 3.5-11.2 Earth radii). Added comprehensive texture mapping framework for all planet types.
- June 22, 2025: Fixed planet scaling inconsistency - changed visual scaling from radius * 20 to radius * 10 to properly represent Earth radii measurements while maintaining good visibility. Planets now display accurate relative sizes based on their actual radius values.
- June 22, 2025: Implemented frost giant planet specifications with authentic Uranus/Neptune textures, light blue coloring, and smaller sizes than gas giants. Added comprehensive texture mapping framework for all planet types.
- June 22, 2025: Doubled star size (radius multiplier from 8 to 16) and doubled orbital spacing (from 15x to 30x) in system view for better visibility and scale representation.
- June 22, 2025: Fixed star clicking in system view by replacing group onClick with invisible background plane, and improved camera positioning to maintain viewing direction when entering system view while ensuring proper distance from star.
- June 22, 2025: Simplified system view by making stars non-interactive and displaying star information permanently. Removed click handlers and selection rings from central star to eliminate errors while maintaining full star data visibility.
- June 22, 2025: Restricted all object interactions to mouse mode only. Planet clicking, star selection, and background deselection now require Tab key to enter mouse mode, preventing conflicts with navigation mode's pointer lock system.
- June 23, 2025: Removed navigation mode entirely and simplified to mouse-only interactions. Left-click selects objects, right-click+drag controls camera rotation, WASD controls movement. No mode switching required.
- June 23, 2025: Enhanced planet texture system with comprehensive texture mapping for gas giants (Jupiter), ice giants (Uranus/Neptune), acidic worlds (Venus), and nuclear worlds. Added atmospheric glow effects for gas planets and improved surface detail with higher polygon counts. Prepared planetary surface exploration framework with city lighting system featuring technology-based light colors, size-based light clusters, and population-driven intensity.
- June 23, 2025: Integrated comprehensive 2K resolution planetary textures including Jupiter (gas giants), Mars/Venus surface (arid worlds), Mercury/Moon/Eris (dead worlds), Venus atmosphere/acidic world (acidic worlds), Ceres/nuclear world (nuclear worlds), and Uranus/Neptune (frost giants). Enhanced material properties with proper texture-based coloring and atmospheric glow effects for gaseous planets.
- June 23, 2025: Fixed planet texture consistency by implementing deterministic texture selection based on planet ID hash instead of random selection. Planets now maintain consistent textures across selections, essential for globe-scale visualization and navigation consistency. Restored full star opacity across all views (galactic, system) by removing transparency settings.
- June 23, 2025: Implemented proper texture persistence system with textureIndex field stored in planet data during generation. Textures are randomly selected once during planet creation based on system seed, then permanently stored and consistently loaded across all visits to the system.
- June 23, 2025: Fixed frost giant texture loading by replacing low-quality ice giant textures with high-resolution 2K versions showing atmospheric details. Added ocean world texture support with beautiful water surface patterns for ocean planets.
- June 23, 2025: Added comprehensive verdant world textures with three high-quality Earth-like options showing continents, oceans, cloud formations, and diverse terrestrial landscapes. Verdant planets now display authentic habitable world appearances with realistic geography and atmospheric effects.
- June 23, 2025: Fixed texture selection algorithm to ensure proper variety between planets of the same type in a system. Enhanced seed generation to include planet type hash and multiplied planet index for better distribution, preventing multiple planets from getting identical textures.
- June 23, 2025: Implemented per-planet-type opacity control for optimal visual clarity. Verdant and terrestrial worlds are fully opaque to showcase surface details, while gas giants have slight transparency for atmospheric effects. Ensures each planet type displays with appropriate visual fidelity.
- June 23, 2025: Fixed material color tinting system - verdant worlds use pure white base color to show true texture colors without tinting, while other planet types maintain colored base for atmospheric effects. No planets are transparent, only color tinting is controlled.
- June 23, 2025: Completely removed all color tinting and emissive effects from verdant worlds with textures. Verdant planets now display pure texture colors with no white tint, green glow, or any color modifications - showing authentic Earth-like blues, greens, and browns.
- June 23, 2025: Implemented comprehensive color variation system in SystemView using seeded HSL generation. Replaced static planet colors with dynamic variation based on planet IDs, matching SystemGenerator's sophisticated color system. Added debug logging to investigate missing planet IDs issue.
- June 23, 2025: Reduced planet visual scaling from 0.8x to 0.6x radius to prevent gas giants from appearing larger than smaller stars. Implemented dynamic starfield scaling based on maximum orbital radius to ensure background stars extend beyond planetary orbits for proper visual depth.
- June 24, 2025: Added asteroid belt generation to SystemGenerator with 1-4 belts per system spawning in orbital gaps. Implemented exponential asteroid density scaling based on belt radius with grey coloring and varied asteroid sizes. Fixed system generation conflicts by consolidating planet generation into single SystemGenerator method.
- June 24, 2025: Implemented comprehensive planetary view system with surface exploration capabilities. Features include: clickable surface features (cities, forts, landmarks), proper texture mapping based on planet type, atmospheric effects for applicable worlds, city lighting systems based on population and technology level, and seamless navigation between galactic/system/planetary views. Enhanced navigation with Enter key transitions and Backspace hierarchical navigation.
- June 24, 2025: Added game music system with background audio that loops after clicking "Start Sandbox". Music is set to 30% volume and includes proper cleanup on component unmount. Prepared framework for scope-dependent music switching in future updates.
- June 24, 2025: Enhanced galactic view camera system to remember last visited star. When returning from system view to galactic view via Backspace, camera now spawns with offset position looking at the previously explored star for better spatial continuity.
- June 24, 2025: Fixed orbital zone generation that was creating exponentially distant orbits for small stars with many planets. Replaced multiplicative spacing (2-3x previous orbit) with additive spacing and maximum orbit caps to ensure realistic planetary system scales.
- June 24, 2025: Implemented orbiting moons around planets in system view. Moons now orbit their parent planets with realistic motion, scaled sizing, and proper orbital mechanics. Enhanced moon generation with faster orbital speeds for better visibility in the 3D visualization.
- June 24, 2025: Refined moon orbital system with tighter orbits, synchronized timing with planetary motion, 50% smaller moon sizes, and applied planetary offset pattern to prevent moon alignment. Moons now properly follow their planets without speed mismatches.
- June 24, 2025: Rebuilt PlanetaryView component from scratch as Google Earth-like globe view. Features mouse drag rotation, scroll wheel zoom, high-detail planet rendering with proper textures, and atmospheric effects. Simplified to focus on globe navigation without surface features for now.
- June 24, 2025: Fixed planetary view accessibility by ensuring all terrestrial planets have surface features (1-6 based on type) and allowing F key exploration for all non-gas giant planets. Gas giants and frost giants remain non-explorable as they have no solid surface.
- June 24, 2025: Enhanced planetary view texture consistency by ensuring full opacity (1.0) for all planet materials and reducing atmospheric glow to minimal levels (0.03 opacity) to preserve authentic texture colors in Google Earth-like globe view.
- June 24, 2025: Synchronized planetary view material properties with system view, including seeded color variation, emissive effects for nuclear worlds (red tinting), proper metalness values, and consistent texture handling. Nuclear worlds now display the same red glow in both system and planetary views.
- June 24, 2025: Fixed planet orbital overlap issues in SystemGenerator by improving orbital zone calculation. Increased base spacing, implemented progressive spacing that grows with planet index, and removed dependency on not-yet-created planet data. Planets now maintain proper orbital separation without collisions.
- June 30, 2025: Resolved surface feature generation conflict by removing duplicate surface feature code from SystemGenerator and delegating to PlanetGenerator's well-written generateSurfaceFeatures method. This eliminates conflicts and ensures consistent surface feature generation across the application.
- June 30, 2025: Completed comprehensive planet type overhaul with 150+ new texture assets. Replaced old planet types (verdant_world, acidic_world, dead_world) with 11 new types: arid_world, barren_world, dusty_world, grassland_world, jungle_world, marshy_world, martian_world, methane_world, sandy_world, snowy_world, tundra_world. Gas giants and frost giants now use new gaseous textures (20 variations). Ocean and nuclear worlds preserved. Updated all hardcoded references across SystemGenerator, SystemView, and PlanetaryView components. Added comprehensive texture mapping with 5 texture variations per terrestrial planet type and 20 for gaseous worlds.
- July 2, 2025: Implemented lazy texture loading system with caching to prevent main thread blocking when entering star systems. Only loads planet textures when actually needed and caches them for reuse. Fixed PlanetaryView texture loading compatibility with new planet types and added robust error handling to prevent crashes from missing planet data.
- July 2, 2025: Updated all getPlanetColor functions across the application to support the new planet types (11 terrestrial types plus gas_giant, frost_giant, nuclear_world, ocean_world). Updated UI color schemes in App.tsx, SystemView.tsx, LazyPlanetMesh.tsx, and PlanetGenerator.ts. Replaced deprecated planet types (verdant_world, acidic_world, dead_world) with comprehensive color mappings for all new planet types.
- July 2, 2025: Implemented planetary ring system with 40% chance for gas/frost giants and 30% chance for terrestrial planets larger than Earth. Added PlanetRing interface with radius, density, color, and composition properties. Created dynamic ring generation based on planet type (ice rings for frost giants, rock/dust for terrestrial planets). Rings are rendered directly within PlanetMesh components for proper orbital synchronization and feature realistic visual properties including transparency, rotation, and composition-based coloring.
- July 3, 2025: Fixed planet brightness inconsistency between system view and planetary view by matching lighting intensities and material properties. Reduced PlanetaryView lighting from ambient 0.3 + directional 0.7 to ambient 0.05 + directional 0.15 to match global lighting levels. Added atmospheric glow effects for gas giants in planetary view for complete visual consistency.
- July 3, 2025: Implemented surface feature information UI system with planet-colored styling matching other scopes. Added comprehensive feature data including population, size, technology level, and affiliation. Features now display detailed information panels when clicked, showing name, type, population (for cities), size, technology level, political affiliation, and location coordinates. Enhanced SurfaceFeature interface with affiliation field and updated generation to include realistic organizational affiliations.
- July 3, 2025: Added persistent planet information panel in planetary view matching star information behavior from galactic-to-system transitions. Planet data now persists when transitioning from system view to planetary view with proper panel stacking (planet info at top, feature info below when both visible).
- July 3, 2025: Implemented orbital moons and cosmic neighbors for planetary view. Added realistic moon orbital mechanics with varied colors, sizes, and orbital distances around planets. Created cosmic neighbors system showing parent star with corona effect, other planets in the system as distant objects, and background starfield of 150+ distant stars. Moons feature proper orbital inclination and rotation with visual variety through different colors and glow effects.
- July 7, 2025: Fixed ring angle consistency between system and planetary views by implementing exact same deterministic rotation calculation based on ring ID hash. Planetary view rings now match SystemView angles perfectly using identical mathematical formulas.
- July 7, 2025: Implemented proper dynamic planet type seeding with orbital zone randomization. Each planet gets unique seeding based on session timestamp + orbital position, ensuring planets at the same distance have different types between sessions while maintaining distance-appropriate classifications (hot inner zone, mid zone, cold outer zone). Stars remain deterministic for consistent galactic layout.
- July 7, 2025: Added stellar temperature-based zone scaling to planet type determination. Orbital zones now scale with stellar temperature using square root factor (hotter stars have habitable zones farther out, cooler stars closer in). Uses Solar temperature (5778K) as baseline for realistic habitable zone positioning based on stellar luminosity.

## User Preferences

Preferred communication style: Simple, everyday language.