export const CONFIG = {
  // Clay / icon-leaning look: pure colour blocks, rounded edges, restrained speculars.
  pudding: {
    height: 2.05, topRadius: 1.2, bottomRadius: 1.48,
    color: '#ffc94f', flutes: 10, fluteDepth: 0.058, fluteFadeStart: 0.06, fluteFadeEnd: 0.38,
    domeHeight: 0.085, rimRadiusFactor: 0.96,
    // Generated side wall: near-linear taper, slight outward bow, quarter-ellipse tuck at the base.
    baseFillet: 0.3, baseFilletHeight: 0.3, bow: 0.04, sideSamples: 34,
    roughness: 0.42, clearcoat: 0.14, clearcoatRoughness: 0.5,
  },
  // Radius is derived from the pudding rim so the glaze hugs the body instead of overhanging.
  caramel: {
    height: 0.24, hugFactor: 1.03, wobble: 0.014,
    color: '#a24d27', roughness: 0.26, clearcoat: 0.5, clearcoatRoughness: 0.22,
  },
  // Piped swirl: a tapering dome carrying a helical ridge.
  cream: {
    width: 1.5, height: 0.86, turns: 2.6, ridgeDepth: 0.12, petals: 5, petalDepth: 0.022,
    color: '#fff6e4', roughness: 0.62, specularIntensity: 0.24,
  },
  cherry: { radius: 0.35, color: '#d92440', roughness: 0.26, stemLength: 0.6, stemRadius: 0.026, stemColor: '#7a1a32' },
  camera: { fov: 32, position: [4.1, 3.6, 7.5], target: [0, 0.55, 0], framing: 0.74 },
  controls: { enabled: true, autoRotate: true, autoRotateSpeed: 0.55, dampingFactor: 0.06, minPolarAngle: 0.55, maxPolarAngle: 1.62 },
  light: { intensity: 3.2, fillIntensity: 1.05, ambientIntensity: 1.05, keyPosition: [-3, 6, 5] },
  presentation: { background: '#faf8f4', exposure: 1.04, shadowOpacity: 0.1, contactOpacity: 0.3, contactScale: 1.55, environmentIntensity: 0.28, pixelRatio: 2 },
  geometry: { radialSegments: 96, profileSubdivisions: 4 },
};

// Shared flute profile so the caramel cap follows exactly the same lobes as the body.
export function fluteFactor(angle, amount = CONFIG.pudding.fluteDepth) {
  return 1 + amount * Math.cos(CONFIG.pudding.flutes * angle);
}

// Radius of the pudding rim (top edge) at a given angle, before the caramel hug factor.
export function puddingRimRadius(angle) {
  return CONFIG.pudding.topRadius * CONFIG.pudding.rimRadiusFactor * fluteFactor(angle);
}

Object.assign(CONFIG.pudding, { deformationRadius: 1.0, strength: 1.3, softness: 1.1, plasticity: 0.48, yieldThreshold: 0.28, recovery: 1.35, dragInfluence: 0.8, maxDent: 0.78, smoothing: 0.38 });
Object.assign(CONFIG.cream, { deformationRadius: 0.95, strength: 1.6, softness: 1.5, plasticity: 0.65, yieldThreshold: 0.18, recovery: 0.9, dragInfluence: 1.05, maxDent: 0.64, smoothing: 0.4 });
CONFIG.wax = { thickness: 0.06, minThickness: 0.01, maxThickness: 0.20 };
CONFIG.interaction = { holdPressureSpeed: 0.7, dragPressureScale: 0.012, maxPressure: 1 };
export function waxProperties(thickness = CONFIG.wax.thickness) {
  const t = Math.max(0, Math.min(1, (thickness - 0.01) / 0.19));
  return { offset: 0.01 + thickness * 0.23, opacity: 0.22 + t * 0.28, breakRadius: 0.84 - t * 0.24, impulse: 0.85 + t * 0.35 };
}

CONFIG.caramelClay={...CONFIG.pudding,softness:1.2,plasticity:.95};
CONFIG.cherryClay={...CONFIG.cream,softness:1.35,deformationRadius:.85};
