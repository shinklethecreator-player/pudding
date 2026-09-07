export const CONFIG = {
  // Clay / icon look, matching the pudding, melon-bread turtle and steamed bun studies:
  // pure colour blocks, rounded silhouettes, restrained speculars, soft contact shadow.
  slice: {
    radius: 1.3, height: 1.16,
    edgeFillet: 0.15,          // rounding where the flat faces meet the scalloped rim
    crown: 0.022,              // faint doming of each flat face
    // The flower cross-section: the same radial modulation the pudding uses for its flutes.
    petals: 13, petalDepth: 0.1, petalSharpness: 0.68,
    color: '#fdf3f2',
    roughness: 0.5, clearcoat: 0.14, clearcoatRoughness: 0.45,
  },
  // An Archimedean spiral painted onto both flat faces with vertex colour. It is a marking,
  // not relief: the slice's surface stays smooth.
  swirl: {
    color: '#e79dbf',
    innerRadius: 0.045, outerRadius: 0.55,   // as fractions of the slice radius
    turns: 1.35, width: 0.123, softness: 0.028,
    capSoften: 0.04,                        // rounds the two ends of the stroke
  },
  pose: { yaw: 0.2 },
  camera: { fov: 30, position: [1.7, 2.4, 5.4], framing: 1.26 },
  controls: { enabled: true, autoRotate: true, autoRotateSpeed: 0.5, dampingFactor: 0.06, minPolarAngle: 0.18, maxPolarAngle: 1.5 },
  light: { intensity: 2.5, fillIntensity: 0.85, ambientIntensity: 1.05, keyPosition: [-3, 6, 4.4] },
  presentation: {
    background: '#ffffff', exposure: 1.03, shadowOpacity: 0.05,
    contactOpacity: 0.18, contactScale: 1.4, environmentIntensity: 0.26, pixelRatio: 2,
  },
  geometry: { radialSegments: 224, profileSubdivisions: 1, profileRows: 120 },
};
