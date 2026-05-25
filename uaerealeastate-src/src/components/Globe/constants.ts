// Visual + geographic constants for the dot globe.

export const GLOBE_RADIUS = 1;

export const COLOR_DOT = '#D7D7D7';      // land dots
export const COLOR_DOT_SEA = '#D7D7D7';  // (unused — sea dots are not rendered)
// Arc 3D shading: top is the lightest (faces the camera most),
// the edge walls a touch darker, and the underside (the "inside"
// of the arc that's visible when looking up at it from below) the
// darkest. Gives the ribbon a real 3D look without lighting.
export const COLOR_ARC = '#B9B9B9';        // top face
export const COLOR_ARC_SIDE = '#8E8E8E';   // edge walls
export const COLOR_ARC_BOTTOM = '#5A5A5A'; // underside ("inside")
export const COLOR_FLOW = '#FF9BAC';     // pink moving "money" dots
export const COLOR_DEST = '#ff1f8f';     // slightly stronger pink for Dubai marker

// Destination: Dubai, UAE
export const DUBAI: [number, number] = [25.2048, 55.2708];

// Origins around the world — capital sources flowing into Dubai.
// Trimmed from 14 to 13: Mumbai dropped because its arc was so short
// it visually collapsed onto the Dubai pedestal; Paris / Shanghai /
// Mexico City dropped because each had a near-neighbour already in
// the list (London / Hong Kong / SF respectively). Three Pacific-rim
// origins added on the OPPOSITE side of the globe from Dubai so
// their arcs cross right over the visible hemisphere — Honolulu,
// Auckland, Lima.
// [lat, lon, label]
export const SOURCES: Array<{ lat: number; lon: number; label: string }> = [
  // Same hemisphere as Dubai
  { lat: 51.5072, lon: -0.1276, label: 'London' },
  { lat: 1.3521, lon: 103.8198, label: 'Singapore' },
  { lat: 22.3193, lon: 114.1694, label: 'Hong Kong' },
  { lat: 55.7558, lon: 37.6173, label: 'Moscow' },
  { lat: 6.5244, lon: 3.3792, label: 'Lagos' },
  { lat: 35.6762, lon: 139.6503, label: 'Tokyo' },
  // Far side of the globe — arcs cross OVER the sphere
  { lat: 40.7128, lon: -74.006, label: 'New York' },
  { lat: 37.7749, lon: -122.4194, label: 'San Francisco' },
  { lat: -23.5505, lon: -46.6333, label: 'São Paulo' },
  { lat: -33.8688, lon: 151.2093, label: 'Sydney' },
  // Pacific-rim origins on the antipodal side of Dubai
  { lat: 21.3069, lon: -157.8583, label: 'Honolulu' },
  { lat: -36.8485, lon: 174.7633, label: 'Auckland' },
  { lat: -12.0464, lon: -77.0428, label: 'Lima' },
];
