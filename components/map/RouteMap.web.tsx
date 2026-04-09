import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stop } from '@/types';
import { COLORS } from '@/constants';

interface RouteMapProps {
  stops: Stop[];
  currentLocation?: { lat: number; lng: number } | null;
  activeStopIndex?: number;
  height?: number;
}

export function RouteMap({ stops, height = 220 }: RouteMapProps) {
  return (
    <View style={[styles.box, { height }]}>
      <Text style={styles.icon}>🗺️</Text>
      <Text style={styles.text}>{stops.length} stops planned</Text>
      <Text style={styles.sub}>Map visible on Android app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 14, backgroundColor: COLORS.gray100,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 0.5, borderColor: COLORS.gray200,
  },
  icon: { fontSize: 32 },
  text: { fontSize: 14, fontWeight: '500', color: COLORS.gray700 },
  sub: { fontSize: 12, color: COLORS.gray400 },
});