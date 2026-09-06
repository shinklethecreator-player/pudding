# Caramel pudding

Standalone Vite + vanilla Three.js scene. All dessert geometry is procedural; no downloaded models or textures.

Run `pnpm install`, then `pnpm dev`. Use `pnpm build` for a static production build.

Edit `src/config.js` to tune the model. Body height, topRadius and bottomRadius control the main silhouette. Caramel radius and waveAmount control its scalloped outline; cream width/height and cherry radius control topping proportions. Camera position controls the viewing direction; distance fits the viewport automatically.

The body is centered at the origin, with its bottom at negative half-height. Four components remain separate and named. Geometry uses smooth normals and moderate radial resolution. The scene renders on load and resize only.

Visual compromises: cream is deliberately larger than the brief's numeric range to match the supplied image; translucency is approximated by warm lighting and broad highlights. Shadows use an inexpensive softened shadow map. No microtexture or physical subsurface scattering.
