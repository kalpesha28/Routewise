import React from 'react';
import { StyleSheet, View, Platform, Text } from 'react-native';
import { Stop } from '@/types';
import { COLORS } from '@/constants';

const isWeb = Platform.OS === 'web';
let MapView: any, Marker: any, Polyline: any, PROVIDER_GOOGLE: any;
if (!isWeb) {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

interface RouteMapProps {
  stops: Stop[];
  currentLocation?: { lat: number; lng: number } | null;
  activeStopIndex?: number;
  height?: number;
}

export function RouteMap({ stops, currentLocation, activeStopIndex = 0, height = 220 }: RouteMapProps) {
  if (isWeb) {
    return (
      <View style={[styles.webFallback, { height }]}>
        <Text style={styles.webIcon}>🗺️</Text>
        <Text style={styles.webText}>{stops.length} stops planned</Text>
        <Text style={styles.webSub}>Map shows on Android app</Text>
      </View>
    );
  }

  const region = currentLocation
    ? { latitude: currentLocation.lat, longitude: currentLocation.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : stops.length > 0
    ? { latitude: stops[0].lat, longitude: stops[0].lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : { latitude: 19.9975, longitude: 73.7898, latitudeDelta: 0.0922, longitudeDelta: 0.0421 };

  return (
    <View style={[styles.container, { height }]}>
      <MapView style={StyleSheet.absoluteFillObject} provider={PROVIDER_GOOGLE} initialRegion={region} showsUserLocation showsTraffic>
        {stops.map((stop, i) => (
          <Marker key={stop.id} coordinate={{ latitude: stop.lat, longitude: stop.lng }} title={stop.customer_name}
            pinColor={stop.status === 'delivered' ? COLORS.success : i === activeStopIndex ? COLORS.accent : COLORS.gray400} />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 14, overflow: 'hidden', backgroundColor: COLORS.gray100 },
  webFallback: { borderRadius: 14, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 0.5, borderColor: COLORS.gray200 },
  webIcon: { fontSize: 32 },
  webText: { fontSize: 14, fontWeight: '500', color: COLORS.gray700 },
  webSub: { fontSize: 12, color: COLORS.gray400 },
});