import { CityConfig, GeoSearchResult } from '../types/taxi';

export interface RoadRouteResult {
  coordinates: [number, number][]; // [lat, lng][]
  distanceKm: number;
  durationMin: number;
  isRealRoad: boolean;
}

const routeCache = new Map<string, RoadRouteResult>();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildFallbackRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): RoadRouteResult {
  const steps = 16;
  const coords: [number, number][] = [];
  const curveOffsetLat = (to.lng - from.lng) * 0.08;
  const curveOffsetLng = -(to.lat - from.lat) * 0.08;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const bend = Math.sin(t * Math.PI);
    coords.push([
      from.lat + (to.lat - from.lat) * t + curveOffsetLat * bend,
      from.lng + (to.lng - from.lng) * t + curveOffsetLng * bend
    ]);
  }

  const rawDist = Math.max(0.8, haversineKm(from.lat, from.lng, to.lat, to.lng) * 1.25);
  const distanceKm = Math.round(rawDist * 10) / 10;
  const durationMin = Math.max(3, Math.round((distanceKm / 28) * 60));

  return {
    coordinates: coords,
    distanceKm,
    durationMin,
    isRealRoad: false
  };
}

/**
 * Fetches real street-by-street driving route across Kyrgyzstan roads via public OSRM.
 * Automatically falls back to a smooth road-estimated curve if offline or rate-limited.
 */
export async function fetchRoadRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  stop?: { lat: number; lng: number } | null
): Promise<RoadRouteResult> {
  const key = `${from.lat.toFixed(4)},${from.lng.toFixed(4)}->${stop ? `${stop.lat.toFixed(4)},${stop.lng.toFixed(4)}->` : ''}${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
  const cached = routeCache.get(key);
  if (cached) return cached;

  const waypoints = stop
    ? `${from.lng},${from.lat};${stop.lng},${stop.lat};${to.lng},${to.lat}`
    : `${from.lng},${from.lat};${to.lng},${to.lat}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return buildFallbackRoute(from, to);
    }

    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) {
      return buildFallbackRoute(from, to);
    }

    // OSRM returns [lng, lat]; Leaflet expects [lat, lng]
    const coords: [number, number][] = route.geometry.coordinates.map(
      (pt: [number, number]) => [pt[1], pt[0]]
    );
    const distanceKm = Math.max(0.5, Math.round((route.distance / 1000) * 10) / 10);
    const durationMin = Math.max(2, Math.round(route.duration / 60));

    const result: RoadRouteResult = {
      coordinates: coords,
      distanceKm,
      durationMin,
      isRealRoad: true
    };
    routeCache.set(key, result);
    return result;
  } catch {
    return buildFallbackRoute(from, to);
  }
}

/**
 * Interpolates exact position and compass bearing along a polyline for progress in [0, 1].
 */
export function interpolateAlongRoute(
  coords: [number, number][],
  progress: number
): { lat: number; lng: number; heading: number } {
  if (!coords.length) {
    return { lat: 42.8746, lng: 74.5698, heading: 0 };
  }
  if (coords.length === 1) {
    return { lat: coords[0][0], lng: coords[0][1], heading: 0 };
  }

  const clamped = Math.max(0, Math.min(1, progress));
  const segLengths: number[] = [];
  let totalLen = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const dLat = coords[i + 1][0] - coords[i][0];
    const dLng = coords[i + 1][1] - coords[i][1];
    const len = Math.sqrt(dLat * dLat + dLng * dLng);
    segLengths.push(len);
    totalLen += len;
  }

  if (totalLen === 0) {
    return { lat: coords[0][0], lng: coords[0][1], heading: 0 };
  }

  const targetDist = clamped * totalLen;
  let accum = 0;

  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i];
    if (accum + segLen >= targetDist || i === segLengths.length - 1) {
      const localT = segLen > 0 ? (targetDist - accum) / segLen : 0;
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const lat = p1[0] + (p2[0] - p1[0]) * localT;
      const lng = p1[1] + (p2[1] - p1[1]) * localT;
      const heading = (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;
      return { lat, lng, heading: (heading + 360) % 360 };
    }
    accum += segLen;
  }

  const last = coords[coords.length - 1];
  return { lat: last[0], lng: last[1], heading: 0 };
}

/**
 * Live Kyrgyzstan street, building & POI autocomplete combining local landmarks and OpenStreetMap Nominatim.
 */
export async function searchKyrgyzstanAddresses(
  query: string,
  currentCity: CityConfig
): Promise<GeoSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const localMatches: GeoSearchResult[] = currentCity.landmarks
    .filter(
      (lm) =>
        lm.name.ru.toLowerCase().includes(q) ||
        lm.name.kg.toLowerCase().includes(q) ||
        lm.name.en.toLowerCase().includes(q) ||
        lm.address.toLowerCase().includes(q)
    )
    .map((lm) => ({
      id: `local_${lm.id}`,
      name: lm.name.ru,
      address: `${lm.address}, ${currentCity.name.ru}`,
      lat: lm.lat,
      lng: lm.lng,
      source: 'local'
    }));

  try {
    const cityBias = currentCity.id === 'intercity' ? '' : ` ${currentCity.name.ru}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=kg&accept-language=ru&limit=5&q=${encodeURIComponent(
      `${query.trim()}${cityBias}`
    )}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return localMatches;
    const rows = await res.json();
    const osmMatches: GeoSearchResult[] = (rows || []).map((row: any) => {
      const parts = String(row.display_name || '').split(',');
      const title = parts.slice(0, 2).join(',').trim();
      const subtitle = parts.slice(2, 4).join(',').trim() || 'Кыргызстан';
      return {
        id: `osm_${row.place_id}`,
        name: title || query.trim(),
        address: subtitle,
        lat: Number(row.lat),
        lng: Number(row.lon),
        source: 'osm'
      };
    });

    // Deduplicate by title
    const seen = new Set(localMatches.map((m) => m.name.toLowerCase()));
    const combined = [...localMatches];
    for (const item of osmMatches) {
      if (!seen.has(item.name.toLowerCase())) {
        seen.add(item.name.toLowerCase());
        combined.push(item);
      }
    }
    return combined.slice(0, 6);
  } catch {
    return localMatches;
  }
}
