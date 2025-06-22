# Bump Map Requirements for 3D Universe Mapper

## Supported File Formats
For bump maps in Three.js, you can provide textures in the following formats:

### Recommended Formats:
- **PNG** (.png) - Best for detailed heightmaps with transparency
- **JPG/JPEG** (.jpg/.jpeg) - Good for large textures, smaller file sizes
- **WebP** (.webp) - Modern format with excellent compression

### Also Supported:
- **TGA** (.tga)
- **HDR** (.hdr) - For high dynamic range heightmaps
- **EXR** (.exr) - For scientific/precise heightmaps

## Texture Specifications

### Stars:
- **Resolution**: 512x512 to 2048x2048 pixels
- **Type**: Surface detail patterns (solar flares, granulation, sunspots)
- **Color**: Grayscale (white = raised, black = recessed)
- **Naming**: `star_bump.png`, `star_surface.png`

### Planets:
- **Resolution**: 1024x1024 to 4096x4096 pixels  
- **Type**: Surface terrain (mountains, craters, valleys)
- **Color**: Grayscale heightmap
- **Naming**: `planet_terrain.png`, `rocky_surface.png`, `gas_giant_bands.png`

### Implementation Notes:
- Textures should be placed in `client/public/textures/`
- Use `useTexture("/textures/filename.png")` in React Three Fiber
- Bump maps are already prepared in materials with `bumpScale` properties
- Higher resolution = more detailed surface features
- Seamless/tileable textures work best for spherical objects

## Usage Example:
```javascript
const bumpMap = useTexture("/textures/planet_terrain.png");
<meshStandardMaterial 
  bumpMap={bumpMap}
  bumpScale={0.05}
/>
```