import { Stop, RouteResult, Coordinate } from '@/types';
import { FUEL_EFFICIENCY, PETROL_PRICE_INR } from '@/constants';

// ─── Haversine distance between two coordinates (km) ─────────────────────────
export function haversineKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// ─── Total route distance for a given stop order ─────────────────────────────
export function totalRouteDistance(
  stops: Stop[],
  origin: Coordinate
): number {
  if (stops.length === 0) return 0;
  let dist = haversineKm(origin, { lat: stops[0].lat, lng: stops[0].lng });
  for (let i = 0; i < stops.length - 1; i++) {
    dist += haversineKm(
      { lat: stops[i].lat, lng: stops[i].lng },
      { lat: stops[i + 1].lat, lng: stops[i + 1].lng }
    );
  }
  return dist;
}

// ─── Nearest Neighbour heuristic (fast, good enough for ≤20 stops) ───────────
function nearestNeighbour(stops: Stop[], origin: Coordinate): Stop[] {
  const remaining = [...stops];
  const ordered: Stop[] = [];
  let current = origin;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineKm(current, { lat: s.lat, lng: s.lng });
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    });
    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push(next);
    current = { lat: next.lat, lng: next.lng };
  }
  return ordered;
}

// ─── 2-opt improvement pass ───────────────────────────────────────────────────
function twoOpt(stops: Stop[], origin: Coordinate): Stop[] {
  let best = [...stops];
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        if (
          totalRouteDistance(candidate, origin) <
          totalRouteDistance(best, origin)
        ) {
          best = candidate;
          improved = true;
        }
      }
    }
  }
  return best;
}

// ─── Main optimization function ───────────────────────────────────────────────
export function optimizeRoute(
  stops: Stop[],
  origin: Coordinate,
  vehicleType: string
): RouteResult {
  if (stops.length === 0) {
    return {
      orderedStops: [],
      totalDistanceKm: 0,
      estimatedMinutes: 0,
      fuelSavedInr: 0,
      savedKm: 0,
    };
  }

  // Naive distance (original order)
  const naiveDistance = totalRouteDistance(stops, origin);

  // Step 1: nearest neighbour seed
  const nnOrder = nearestNeighbour(stops, origin);

  // Step 2: 2-opt refinement (only if ≤15 stops to keep it fast)
  const optimized = stops.length <= 15 ? twoOpt(nnOrder, origin) : nnOrder;

  const optimizedDistance = totalRouteDistance(optimized, origin);
  const savedKm = Math.max(0, naiveDistance - optimizedDistance);

  // Fuel cost calculation
  const efficiency = FUEL_EFFICIENCY[vehicleType] ?? 40;
  const litresSaved = savedKm / efficiency;
  const fuelSavedInr = litresSaved * PETROL_PRICE_INR;

  // Estimate time: avg 30 km/h in city + 3 min per stop
  const drivingMinutes = (optimizedDistance / 30) * 60;
  const stopMinutes = optimized.length * 3;
  const estimatedMinutes = Math.round(drivingMinutes + stopMinutes);

  return {
    orderedStops: optimized.map((s, i) => ({ ...s, order_index: i })),
    totalDistanceKm: Math.round(optimizedDistance * 10) / 10,
    estimatedMinutes,
    fuelSavedInr: Math.round(fuelSavedInr * 100) / 100,
    savedKm: Math.round(savedKm * 10) / 10,
  };
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
