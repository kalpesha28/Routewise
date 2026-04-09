import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { formatDistance, formatDuration } from '@/lib/optimizer';

interface Props {
  distanceKm: number;
  estimatedMinutes: number;
  fuelSavedInr: number;
  savedKm: number;
  stopCount: number;
}

export function FuelSavingsBanner({
  distanceKm,
  estimatedMinutes,
  fuelSavedInr,
  savedKm,
  stopCount,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Top row - stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="map-outline" size={16} color={COLORS.accent} />
          <Text style={styles.statValue}>{formatDistance(distanceKm)}</Text>
          <Text style={styles.statLabel}>Route</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={16} color={COLORS.accent} />
          <Text style={styles.statValue}>{formatDuration(estimatedMinutes)}</Text>
          <Text style={styles.statLabel}>Est. time</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Ionicons name="location-outline" size={16} color={COLORS.accent} />
          <Text style={styles.statValue}>{stopCount}</Text>
          <Text style={styles.statLabel}>Stops</Text>
        </View>
      </View>

      {/* Savings row */}
      {fuelSavedInr > 0 && (
        <View style={styles.savingsRow}>
          <Ionicons name="leaf-outline" size={13} color={COLORS.success} />
          <Text style={styles.savingsText}>
            Saved <Text style={styles.savingsAmount}>₹{fuelSavedInr.toFixed(0)}</Text> in
            fuel vs manual route ({formatDistance(savedKm)} shorter)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: COLORS.gray200,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray900,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray400,
  },
  divider: {
    width: 0.5,
    height: 32,
    backgroundColor: COLORS.gray200,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  savingsText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  savingsAmount: {
    fontWeight: '600',
  },
});
