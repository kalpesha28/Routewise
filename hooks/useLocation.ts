import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { useStore } from '@/lib/store';

export function useLocation() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentLocation, setCurrentLocation } = useStore();

  useEffect(() => {
    requestAndWatch();
  }, []);

  async function requestAndWatch() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Location permission denied. Please enable it in settings.');
      return;
    }
    setPermissionGranted(true);

    // Get initial location immediately
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });

    // Watch for updates every 30 seconds
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 50 },
      (loc) => {
        setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    );
  }

  return { currentLocation, permissionGranted, locationError: error };
}
