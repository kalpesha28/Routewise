import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { getPastSessions } from '@/lib/api';
import { DeliverySession } from '@/types';
import { COLORS } from '@/constants';
import { formatDistance, formatDuration } from '@/lib/optimizer';

export default function HistoryScreen() {
  const { driver } = useStore();
  const [sessions, setSessions] = useState<DeliverySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => { load(); }, [driver])
  );

  async function load() {
    if (!driver) return;
    const data = await getPastSessions(driver.id);
    setSessions(data);
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // Aggregate stats
  const totalDeliveries = sessions.reduce((sum, s) => sum + s.stops.filter(st => st.status === 'delivered').length, 0);
  const totalSaved = sessions.reduce((sum, s) => sum + s.fuel_saved_inr, 0);
  const totalKm = sessions.reduce((sum, s) => sum + s.optimized_distance_km, 0);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Text style={styles.heading}>Delivery history</Text>

        {/* Lifetime stats */}
        {sessions.length > 0 && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              <Text style={styles.statNum}>{totalDeliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="leaf" size={22} color={COLORS.success} />
              <Text style={styles.statNum}>₹{Math.round(totalSaved)}</Text>
              <Text style={styles.statLabel}>Fuel saved</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="map" size={22} color={COLORS.accent} />
              <Text style={styles.statNum}>{formatDistance(totalKm)}</Text>
              <Text style={styles.statLabel}>Total driven</Text>
            </View>
          </View>
        )}

        {/* Sessions list */}
        {loading ? (
          <Text style={styles.loadingText}>Loading history...</Text>
        ) : sessions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text style={styles.emptyTitle}>No completed deliveries yet</Text>
            <Text style={styles.emptySub}>Your delivery history will appear here</Text>
          </View>
        ) : (
          sessions.map((s) => <SessionCard key={s.id} session={s} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SessionCard({ session }: { session: DeliverySession }) {
  const delivered = session.stops.filter(s => s.status === 'delivered').length;
  const failed = session.stops.filter(s => s.status === 'failed').length;
  const date = new Date(session.date).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const codTotal = session.stops
    .filter(s => s.status === 'delivered' && s.payment_type === 'cod')
    .reduce((sum, s) => sum + (s.cod_amount ?? 0), 0);

  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>{date}</Text>
        <View style={styles.sessionBadge}>
          <Text style={styles.sessionBadgeText}>{delivered}/{session.stops.length} delivered</Text>
        </View>
      </View>

      <View style={styles.sessionStats}>
        <View style={styles.sessionStat}>
          <Ionicons name="map-outline" size={14} color={COLORS.gray400} />
          <Text style={styles.sessionStatText}>{formatDistance(session.optimized_distance_km)}</Text>
        </View>
        {session.fuel_saved_inr > 0 && (
          <View style={styles.sessionStat}>
            <Ionicons name="leaf-outline" size={14} color={COLORS.success} />
            <Text style={[styles.sessionStatText, { color: COLORS.success }]}>₹{session.fuel_saved_inr.toFixed(0)} saved</Text>
          </View>
        )}
        {codTotal > 0 && (
          <View style={styles.sessionStat}>
            <Ionicons name="cash-outline" size={14} color={COLORS.warning} />
            <Text style={styles.sessionStatText}>₹{codTotal} COD</Text>
          </View>
        )}
        {failed > 0 && (
          <View style={styles.sessionStat}>
            <Ionicons name="close-circle-outline" size={14} color={COLORS.danger} />
            <Text style={[styles.sessionStatText, { color: COLORS.danger }]}>{failed} failed</Text>
          </View>
        )}
      </View>

      {/* Stop names */}
      <Text style={styles.stopNames} numberOfLines={2}>
        {session.stops.map(s => s.customer_name).join(' → ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '700', color: COLORS.gray900 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 6, borderWidth: 0.5, borderColor: COLORS.gray200,
  },
  statNum: { fontSize: 18, fontWeight: '700', color: COLORS.gray900 },
  statLabel: { fontSize: 11, color: COLORS.gray400 },
  loadingText: { textAlign: 'center', color: COLORS.gray400, padding: 32 },
  empty: { alignItems: 'center', gap: 10, padding: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: COLORS.gray700 },
  emptySub: { fontSize: 13, color: COLORS.gray400 },
  sessionCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    borderWidth: 0.5, borderColor: COLORS.gray200, gap: 10,
  },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionDate: { fontSize: 15, fontWeight: '600', color: COLORS.gray900 },
  sessionBadge: { backgroundColor: COLORS.successLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sessionBadgeText: { fontSize: 11, fontWeight: '600', color: '#166534' },
  sessionStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sessionStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionStatText: { fontSize: 12, color: COLORS.gray500, fontWeight: '500' },
  stopNames: { fontSize: 11, color: COLORS.gray400, lineHeight: 16 },
});
