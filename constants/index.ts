export const COLORS = {
  primary: '#0B1120',
  primaryLight: '#141E33',
  primaryMid: '#1C2B4A',
  accent: '#F5A623',
  accentLight: '#FFF8EC',
  accentDark: '#D4891A',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  info: '#3B82F6',
  infoLight: '#EFF6FF',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
  white: '#FFFFFF',
  black: '#000000',
};

export const VEHICLE_TYPES = [
  { value: 'bike', label: 'Bike / Scooter', icon: '🛵', fuelRate: 8 },
  { value: 'auto', label: 'Auto Rickshaw', icon: '🛺', fuelRate: 15 },
  { value: 'car', label: 'Car', icon: '🚗', fuelRate: 12 },
  { value: 'tempo', label: 'Tempo / Van', icon: '🚐', fuelRate: 18 },
] as const;

export const PETROL_PRICE_INR = 106;

export const FUEL_EFFICIENCY: Record<string, number> = {
  bike: 45, auto: 25, car: 18, tempo: 12,
};

export const GOOGLE_MAPS_REGION_INDIA = {
  latitude: 19.9975, longitude: 73.7898,
  latitudeDelta: 0.0922, longitudeDelta: 0.0421,
};