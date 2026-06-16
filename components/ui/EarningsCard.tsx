import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stop } from '@/types';
import { COLORS } from '@/constants';

interface Props {
  stops: Stop[];
  streakDays?: number;
  deliveryScore?: number;
}

function getLevel(score: number) {
  if (score >= 500) return { label: '🏆 Elite', color: '#F5A623' };
  if (score >= 200) return { label: '⭐ Pro', color: '#3B82F6' };
  if (score >= 50) return { label: '🚀 Rising', color: '#10B981' };
  return { label: '🌱 Starter', color: '#94A3B8' };
}

export function EarningsCard({ stops, streakDays = 0, deliveryScore = 0 }: Props) {
  const delivered = stops.filter(s => s.status === 'delivered');
  const codCollected = delivered
    .filter(s => s.payment_type === 'cod')
    .reduce((sum, s) => sum + (s.cod_amount ?? 0), 0);
  const codPending = stops
    .filter(s => s.status === 'pending' && s.payment_type === 'cod')
    .reduce((sum, s) => sum + (s.cod_amount ?? 0), 0);
  const level = getLevel(deliveryScore);

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.cardLabel}>Today's earnings</Text>
          <Text style={styles.codAmount}>₹{codCollected.toLocaleString()}</Text>
          <Text style={styles.codSub}>collected · ₹{codPending} pending</Text>
        </View>
        <View style={styles.rightCol}>
          <View style={[styles.levelBadge, { borderColor: level.color }]}>
            <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
          </View>
          <Text style={styles.scoreText}>{deliveryScore} pts</Text>
        </View>
      </View>

      {/* Bottom stats */}
      <View style={styles.bottomRow}>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatIcon}>🔥</Text>
          <Text style={styles.miniStatVal}>{streakDays}</Text>
          <Text style={styles.miniStatLabel}>Day streak</Text>
        </View>
        <View style={styles.miniDivider} />
        <View style={styles.miniStat}>
          <Text style={styles.miniStatIcon}>📦</Text>
          <Text style={styles.miniStatVal}>{delivered.length}</Text>
          <Text style={styles.miniStatLabel}>Delivered</Text>
        </View>
        <View style={styles.miniDivider} />
        <View style={styles.miniStat}>
          <Text style={styles.miniStatIcon}>⚡</Text>
          <Text style={styles.miniStatVal}>{stops.length > 0 ? Math.round((delivered.length / stops.length) * 100) : 0}%</Text>
          <Text style={styles.miniStatLabel}>Success rate</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20, backgroundColor: COLORS.primary,
    borderRadius: 20, padding: 18, gap: 16,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { fontSize: 12, color: COLORS.gray400, fontWeight: '500', marginBottom: 4 },
  codAmount: { fontSize: 32, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  codSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  levelBadge: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  levelText: { fontSize: 12, fontWeight: '700' },
  scoreText: { fontSize: 12, color: COLORS.gray400 },
  bottomRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primaryMid, borderRadius: 14, padding: 14,
  },
  miniStat: { flex: 1, alignItems: 'center', gap: 4 },
  miniStatIcon: { fontSize: 18 },
  miniStatVal: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  miniStatLabel: { fontSize: 10, color: COLORS.gray500 },
  miniDivider: { width: 1, height: 36, backgroundColor: COLORS.primaryLight },
});