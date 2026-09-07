export const CONFIG = {
  // Clay / icon look, matching the pudding and melon-bread studies: pure colour blocks,
  // rounded silhouettes, restrained speculars, soft contact shadow on white.
  bun: {
    radius: 1.3, height: 1.5,
    baseTuck: 0.33, baseTuckHeight: 0.27,   // quarter-ellipse that pulls the wall in to a flat bottom
    domeFullness: 2.95, domeRound: 0.46,    // exponents of the upper profile
    bow: 0.05,                             // slight outward bulge at mid-height
    color: '#f7f3ea', creaseColor: '#e9e2d4',
    roughness: 0.66, clearcoat: 0.05, clearcoatRoughness: 0.7,
  },
  // The gathered top. Folds are laid out in polar coordinates: each one ramps up and then
  // drops off a cliff at the next crease, which is what makes them read as overlapping
  // shingles rather than symmetrical corrugations.
  pleats: {
    count: 12, swirl: 0.72,
    foldDepth: 0.142, foldSkew: 1.75,
    creaseWidth: 0.1, creaseDepth: 0.022,
    fadeStart: 0.36, fadeEnd: 0.72,
    dimpleWidth: 0.26, dimpleDepth: 0.085, dimpleFadeStart: 0.72, dimpleFadeEnd: 0.94,
    minRadius: 0.12,
  },
  pose: { yaw: 0.35 },
  camera: { fov: 30, position: [2.2, 2.0, 6.2], framing: 1.3 },
  controls: { enabled: true, autoRotate: true, autoRotateSpeed: 0.5, dampingFactor: 0.06, minPolarAngle: 0.35, maxPolarAngle: 1.56 },
  light: { intensity: 2.6, fillIntensity: 0.85, ambientIntensity: 1.0, keyPosition: [-3.2, 6, 4.6] },
  presentation: {
    background: '#ffffff', exposure: 1.0, shadowOpacity: 0.05,
    contactOpacity: 0.2, contactScale: 1.45, environmentIntensity: 0.24, pixelRatio: 2,
  },
  geometry: { radialSegments: 192, profileSubdivisions: 1, profileRows: 120 },
};
