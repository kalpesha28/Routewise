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

export function FuelSavingsBanner({ distanceKm, estimatedMinutes, fuelSavedInr, savedKm, stopCount }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        {[
          { icon: 'map-outline', val: formatDistance(distanceKm), label: 'Route' },
          { icon: 'time-outline', val: formatDuration(estimatedMinutes), label: 'Est. time' },
          { icon: 'location-outline', val: `${stopCount}`, label: 'Stops' },
        ].map((s, i) => (
          <React.Fragment key={i}>
            <View style={styles.stat}>
              <Ionicons name={s.icon as any} size={16} color={COLORS.accent} />
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
            {i < 2 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>

      {fuelSavedInr > 0 && (
        <View style={styles.savingsRow}>
          <Text style={styles.savingsEmoji}>🌿</Text>
          <Text style={styles.savingsText}>
            Saved <Text style={styles.savingsAmt}>₹{fuelSavedInr.toFixed(0)}</Text> vs manual route · {formatDistance(savedKm)} shorter
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20, backgroundColor: COLORS.white, borderRadius: 20,
    padding: 16, gap: 12,
    borderWidth: 1, borderColor: COLORS.gray100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
  statLabel: { fontSize: 11, color: COLORS.gray400 },
  divider: { width: 1, height: 36, backgroundColor: COLORS.gray100 },
  savingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.successLight, borderRadius: 12, padding: 10,
  },
  savingsEmoji: { fontSize: 14 },
  savingsText: { fontSize: 12, color: '#065f46', flex: 1 },
  savingsAmt: { fontWeight: '700' },
});