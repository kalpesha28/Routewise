export const COLORS = {
  primary: '#0f172a',
  primaryLight: '#1e293b',
  accent: '#3b82f6',
  accentLight: '#eff6ff',
  success: '#22c55e',
  successLight: '#f0fdf4',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray700: '#334155',
  gray900: '#0f172a',
  white: '#ffffff',
  black: '#000000',
};

export const VEHICLE_TYPES = [
  { value: 'bike', label: 'Bike / Scooter', icon: '🛵', fuelRate: 8 },
  { value: 'auto', label: 'Auto Rickshaw', icon: '🛺', fuelRate: 15 },
  { value: 'car', label: 'Car', icon: '🚗', fuelRate: 12 },
  { value: 'tempo', label: 'Tempo / Van', icon: '🚐', fuelRate: 18 },
] as const;

// Average petrol price in India (INR per litre)
export const PETROL_PRICE_INR = 106;

// km per litre for each vehicle
export const FUEL_EFFICIENCY: Record<string, number> = {
  bike: 45,
  auto: 25,
  car: 18,
  tempo: 12,
};

export const GOOGLE_MAPS_REGION_INDIA = {
  latitude: 19.9975,
  longitude: 73.7898,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};
