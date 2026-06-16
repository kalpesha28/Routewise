// ─── User & Auth ─────────────────────────────────────────────────────────────

export interface Driver {
  id: string;
  phone: string;
  name: string;
  vehicle_type: 'bike' | 'auto' | 'car' | 'tempo';
  created_at: string;
}

// ─── Stops & Deliveries ──────────────────────────────────────────────────────

export interface Stop {
  id: string;
  session_id: string;
  order_index: number;
  customer_name: string;
  address: string;
  lat: number;
  lng: number;
  notes?: string;
  payment_type: 'paid' | 'cod';
  cod_amount?: number;
  is_fragile: boolean;
  status: 'pending' | 'delivered' | 'failed';
  proof_photo_url?: string;
  delivered_at?: string;
  created_at: string;
}

export interface StopInput {
  customer_name: string;
  address: string;
  lat: number;
  lng: number;
  notes?: string;
  payment_type: 'paid' | 'cod';
  cod_amount?: number;
  is_fragile: boolean;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface DeliverySession {
  id: string;
  driver_id: string;
  date: string;
  status: 'planning' | 'active' | 'completed';
  total_distance_km: number;
  optimized_distance_km: number;
  fuel_saved_inr: number;
  stops: Stop[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// ─── Route Optimization ──────────────────────────────────────────────────────

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteResult {
  orderedStops: Stop[];
  totalDistanceKm: number;
  estimatedMinutes: number;
  fuelSavedInr: number;
  savedKm: number;
}

// ─── Maps ────────────────────────────────────────────────────────────────────

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
