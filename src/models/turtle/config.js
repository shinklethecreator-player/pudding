export const CONFIG = {
  // Clay / icon look, matching the pudding study: pure colour blocks, rounded
  // silhouettes, restrained speculars, soft contact shadow on white.
  shell: {
    radius: 1.3, height: 1.1,
    lipHeight: 0.2, lipInset: 0.19,        // the baked rim that curls under the bun
    domeFullness: 2.7, domeRound: 0.52,    // exponents of the dome profile
    color: '#d8e79a', creaseColor: '#f6eeac',
    // Melon-bread scoring: two families of parallel cuts crossing at a right angle.
    spacing: 0.6, grooveWidth: 0.045, grooveDepth: 0.095, panelPuff: 0.022,
    latticeAngle: Math.PI / 4,
    roughness: 0.58, clearcoat: 0.06, clearcoatRoughness: 0.65,
  },
  body: { color: '#f3ac6c', roughness: 0.46, clearcoat: 0.14, clearcoatRoughness: 0.5 },
  head: {
    // A capsule lying along +z: `barrel` is the straight section's length in radii, so the
    // head is a rounded cylinder with a hemispherical muzzle, not an egg.
    radius: 0.45, barrel: 1.1, heightScale: 0.92,
    forward: 1.03, lift: 0, tilt: 0.06,
  },
  face: {
    color: '#6d4225', eyeRadius: 0.0576, eyeAngle: 0.4, eyeHeight: 0.14, eyeSink: 0.55,
    mouthSpan: 0.34, mouthDrop: 0.3, mouthArc: 0.11, mouthThickness: 0.0304, mouthSink: 0.5,
  },
  legs: {
    radius: 0.27, lengthScale: 1.42, heightScale: 0.8, lift: 0, reach: 1.24,
    // Azimuth of each limb, measured from straight ahead (+z), and its outward pitch.
    placements: [
      { azimuth: 1.02, pitch: 0.05 }, { azimuth: -1.02, pitch: 0.05 },
      { azimuth: 2.28, pitch: 0.05 }, { azimuth: -2.28, pitch: 0.05 },
    ],
  },
  pose: { yaw: 0.62 },
  camera: { fov: 30, position: [2.4, 1.85, 6.4], framing: 1.34 },
  controls: { enabled: true, autoRotate: true, autoRotateSpeed: 0.5, dampingFactor: 0.06, minPolarAngle: 0.45, maxPolarAngle: 1.58 },
  light: { intensity: 2.7, fillIntensity: 0.8, ambientIntensity: 0.95, keyPosition: [-3.2, 6, 5] },
  presentation: {
    background: '#ffffff', exposure: 0.98, shadowOpacity: 0.05,
    contactOpacity: 0.22, contactScale: 1.5, environmentIntensity: 0.22, pixelRatio: 2,
  },
  geometry: { radialSegments: 128, profileSubdivisions: 2, domeSamples: 56 },
};
