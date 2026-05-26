# StarMapExplorer — Claude Context

## What This Project Is

A dual-mode space strategy/lore tool built in React + Three.js:

- **Sandbox mode** — a GM (game master) authors a universe: generates stars, names factions, positions fleets, sets orbits, creates lore.
- **Lore mode** — players explore the GM's universe in real-time, view-only. Planned: shared server with WebSocket sync so players see GM changes live.

Currently only Sandbox mode is fully implemented. Lore mode infrastructure (API routes, storage) exists but WebSocket real-time sync is not yet built.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18.3, TypeScript, Vite |
| 3D rendering | Three.js 0.170, React Three Fiber 8.18, React Three Drei |
| State | Zustand 5.0 with `subscribeWithSelector` middleware |
| Post-processing | @react-three/postprocessing (Bloom) |
| Backend | Express, tsx (dev), esbuild (prod) |
| DB | Drizzle ORM + PostgreSQL (for lore universe persistence) |
| Shared types | `shared/schema.ts` — imported via `@shared/schema` alias |

**Single-port setup:** Vite runs as Express middleware on port 5000. Both API (`/api/*`) and the React app are served from the same process. Start with `npm run dev`.

---

## Critical Platform Notes

- **Windows only** — `reusePort: true` in `server.listen()` is Linux-only and crashes on Windows. It has already been removed.
- **No Replit plugins** — `@replit/vite-plugin-runtime-error-modal` was removed from `vite.config.ts` and `package.json`. Do not add it back.
- **`server/vite.ts`** has a pre-existing TypeScript error (`allowedHosts: boolean` type mismatch). This does not affect runtime since `tsx` uses esbuild, not `tsc`.

---

## Import Paths

Always use the Vite alias for shared types:
```ts
import { Planet, Faction, Fleets } from '@shared/schema';
```
Never use relative paths like `../../shared/schema` or `shared/schema` — these break.

The `@` alias resolves to `client/src/`:
```ts
import { useGameView } from '@/lib/stores/useGameView';
```

---

## State Architecture

There are four Zustand stores. Do not add state to the wrong store.

### `useGameView` — view navigation and selections (`client/src/lib/stores/useGameView.ts`)

The primary store for everything that changes as the user navigates. **This is where all navigation logic lives.**

Key fields:
- `currentView: 'galactic' | 'system' | 'planetary'`
- `currentSystem: any | null` — the currently entered star system object
- `frozenTime: number | null` — `Date.now()` snapshot taken when entering planetary view; non-null means orbital simulation is paused
- `controlsDisabled: boolean` — when true, CameraController skips all frame updates (used during planetary view)
- `lastVisitedStar` — the star we came from, restored as selection when exiting system view
- `selectedStar/Nebula/Planet/Feature/SpaceFeature/Fleet/Army` — current UI selections
- `cameraActions` — registry of camera functions populated by CameraController on mount
- `systemCache: Map<string, any>` — avoids regenerating systems on re-entry

Navigation actions (use these, never set `currentView` directly):
- `enterSystem(star, system)` — atomic transition to system view
- `exitSystem()` — atomic transition back to galactic
- `enterPlanetary()` — snapshots fleet positions, sets `frozenTime`, disables controls
- `exitPlanetary()` — restores fleet positions atomically BEFORE setting `currentView='system'` (this is the planet lock-on timing fix)

Camera action registry:
```ts
useGameView.getState().registerCameraActions({ homeToPlanet, homeToSpaceFeature, ... })
useGameView.getState().cameraActions.homeToPlanet?.(...)
```

### `useUniverse` — persistent universe data (`client/src/lib/stores/useUniverse.tsx`)

Stores the saved universe data blob and fleet/army position backups. Used for:
- `updateFleetPosition(systemId, fleetId, position)` — saves fleet position before entering planetary view
- `updateArmyPosition(planetId, armyId, position)` — saves army position
- `universeData.systems[]` — backup array of fleet positions per system

Do not store UI state here. This store is for data that needs to survive view transitions.

### `useCamera` — camera transition animation (`client/src/lib/stores/useCamera.tsx`)

Handles lerp transitions between camera positions. CameraController reads `isTransitioning`, `fromPosition`, `toPosition` from here every frame.

### `useAudio` — music playback (`client/src/lib/stores/useAudio.tsx`)

Track list, current index, mute state. Unrelated to 3D state.

---

## How Views Work

### Galactic View
- Renders `StarField` (star meshes + nebulas + warp lanes) inside the R3F Canvas
- `CameraController` handles WASD/shift movement + right-click drag rotation
- Click a star → `selectedStar` set in store → info panel shown
- Press Enter with a star selected → `enterSystem()` store action

### System View (`SystemView.tsx`)
- Renders planets, asteroid belts, space features, fleet markers
- Planet positions are calculated every frame using `frozenTime ?? Date.now()` — **never** use `currentSystem.frozenTime` directly; use `useGameView.getState().frozenTime`
- Fleet orbital speed is synced to the nearest planet's orbit speed
- `window.systemPlanets` and `window.systemSpaceFeatures` are set by SystemView and read by FleetMarker for orbital speed synchronization — this is a known remaining window usage (data channel, not state bug)

### Planetary View (`PlanetaryView.tsx`)
- Renders a 3D globe with surface feature markers
- Sets `useGameView.getState().setControlsDisabled(true)` on mount, false on unmount
- Camera is controlled entirely by mouse drag (globe rotation), CameraController is completely bypassed when `controlsDisabled` is true

---

## CameraController (`client/src/components/3d/CameraController.tsx`)

Runs inside the R3F Canvas as a null-returning component. Registers its functions into `useGameView` on mount:

```ts
useGameView.getState().registerCameraActions({
  homeToPlanet,    // position camera at planet + optionally start orbital lock
  homeToSpaceFeature, // position camera at space feature + optionally lock
  homeToFeature,   // position camera at surface feature (planetary view)
  resetToStar,     // snap camera to system origin at [0, 20, 200]
  setCameraLookingAtStar, // galactic view — position near a specific star
});
```

**Camera flash fix:** Uses `useGameView.subscribe()` (synchronous Zustand subscription) to pre-position the camera and update the projection matrix BEFORE React re-renders the new scene. This eliminates the one-frame flash on view transitions. Do not replace this with a `useEffect` — effects fire after paint and will cause the flash to return.

Reads `controlsDisabled` imperatively from `useGameView.getState()` every frame — not from a React subscription — so it's always fresh without triggering re-renders.

Orbital tracking: `isOrbitalTrackingRef` and `isSpaceFeatureTrackingRef` are refs (not state). When active, `useFrame` calculates the tracked object's real-time position and moves the camera every frame.

---

## Key Bugs That Were Fixed

### Planet lock-on fires before fleet restoration
**Problem:** Exiting planetary view had two sequential operations: (1) restore fleet positions, (2) re-establish orbital camera lock. The camera lock fired via `setTimeout` but saw un-restored fleet positions.

**Fix:** `exitPlanetary()` in `useGameView` restores fleet positions and sets `currentView='system'` in a **single atomic `set()` call**. CameraController's subscription to `currentView` fires after this render, guaranteeing it sees the already-restored positions.

### Window globals as state (now eliminated)
The original codebase used `window.homeToPlanet`, `window.currentSystem`, `window.disableGalacticSystemControls`, `window.currentSystemRef` etc. as cross-component communication. These have all been replaced by the `useGameView` store. The only remaining window usages are data channels (`window.systemPlanets`, `window.systemSpaceFeatures`, `window.currentPlanetPositions`, `window.systemEntryTime`) which are lower-priority and not state bugs.

---

## Procedural Generation

All generation is deterministic given a seed. Systems are generated on first visit and cached in the store.

- `StarGenerator.ts` — generates stars array from seed + count. `generateNebulas(count)`. `getStarColor(spectralClass)`.
- `SystemGenerator.ts` — generates a full `StarSystem` from a `Star`. Deterministic given the star's derived seed.
- `WarpLaneGenerator.ts` — connects stars into warp lane paths.
- `FactionGenerator.tsx` — generates factions for a system. Requires `divisions: []` and `armies: []` on faction objects.
- `PlanetGenerator.ts` — `generateSurfaceFeatures(planet, count, factions)`. `generateAffiliation(factions, planet?)`.
- `FleetGenerator.ts`, `MilitaryGenerator.ts` — generate fleet/army compositions.

**Important:** `PlanetGenerator.generateAffiliation()` mutates `faction.holdings` as a side effect when called. This is intentional — it populates which surface features each faction controls.

---

## Shared Schema (`shared/schema.ts`)

Key types used throughout:

```ts
Star, Planet, Moon, PlanetRing, SurfaceFeature, SpaceFeature
Ships, Fleets, Divisions, Armies
Faction, MinorFactions
StarSystem, AsteroidBelt, UniverseData, Nebula, WarpLane
PlanetType  // 'gas_giant' | 'frost_giant' | 'arid_world' | ... (15 types)
ScopeType   // 'galactic' | 'system' | 'planetary'
ModeType    // 'sandbox' | 'lore'
```

`Faction` has: `name`, `homeworld`, `leader`, `holdings`, `fleets`, `armies`, `divisions`, `color`, `influence`. It does **not** have a `forts` field.

---

## API Routes (`server/routes.ts`)

Lore universe persistence:
- `GET /api/lore/universe` — load saved universe
- `POST /api/lore/universe` — save full universe
- `PUT /api/lore/star/:id` — update a single star
- `PUT /api/lore/system/:id` — update a system
- `PUT /api/lore/faction/:id` — update a faction

These routes exist for the planned Lore mode. Sandbox mode generates universe data client-side only.

---

## Planned: Lore Mode / WebSocket Sync

The architecture is designed to support a future `useSession` store for GM vs. player role tracking, and WebSocket sync so players in Lore mode see GM changes in real-time. The `ws` package is already installed.

The intended flow:
- GM operates in Sandbox mode, changes propagate via WebSocket to all connected Lore mode clients
- Lore mode clients: same UI, read-only — no fleet moving, no universe editing
- `useGameView` selections and view navigation remain fully client-side (each player navigates independently)
- Only the universe data itself (`useUniverse` state) needs to be synced

---

## Files to Be Aware Of

- `client/src/App-complex.tsx`, `client/src/components/ui/minimal-app.tsx`, `client/src/components/ui/interface.tsx` — stale/legacy files with pre-existing TypeScript errors. They are not imported anywhere. Ignore their errors.
- `client/src/lib/universe/types.ts` — additional generator-specific types separate from shared schema
- `client/src/hooks/useLazyTexture.ts` — lazy-loads planet textures to avoid loading all at startup

---

## Running the App

```bash
npm run dev        # starts Express + Vite on port 5000
npm run build      # Vite build + esbuild server bundle
npm run check      # tsc type check (expect pre-existing errors in legacy files)
```

Open `http://localhost:5000`. Click "Start Sandbox" to begin.

Controls:
- WASD / Arrow keys — camera movement
- Shift — boost
- Right-click drag — camera rotation
- Click star → Enter — enter system
- Click planet → Enter — orbital camera lock
- F — enter planetary surface view
- Backspace — go back one view level
- Escape — deselect current object
