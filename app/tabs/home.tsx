import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/lib/store';
import { getTodaySession, createSession, updateSession } from '@/lib/api';
import { optimizeRoute } from '@/lib/optimizer';
import { useLocation } from '@/hooks/useLocation';
import { RouteMap } from '@/components/map/RouteMap';
import { StopCard } from '@/components/ui/StopCard';
import { FuelSavingsBanner } from '@/components/ui/FuelSavingsBanner';
import { COLORS, VEHICLE_TYPES } from '@/constants';

export default function HomeScreen() {
  const { driver, session, setSession, activeStopIndex } = useStore();
  const { currentLocation } = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const router = useRouter();

  useFocusEffect(useCallback(() => { loadSession(); }, [driver]));

  async function loadSession() {
    if (!driver) return;
    const s = await getTodaySession(driver.id);
    setSession(s);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadSession();
    setRefreshing(false);
  }

  async function handleOptimize() {
    if (!session || session.stops.length < 2) return;
    setOptimizing(true);
    const origin = currentLocation ?? { lat: session.stops[0].lat, lng: session.stops[0].lng };
    const result = optimizeRoute(session.stops, origin, driver?.vehicle_type ?? 'bike');
    await updateSession(session.id, {
      optimized_distance_km: result.totalDistanceKm,
      total_distance_km: result.totalDistanceKm,
      fuel_saved_inr: result.fuelSavedInr,
    });
    const { updateStopOrder } = await import('@/lib/api');
    await updateStopOrder(result.orderedStops.map((s, i) => ({ id: s.id, order_index: i })));
    setSession({ ...session, stops: result.orderedStops, optimized_distance_km: result.totalDistanceKm, fuel_saved_inr: result.fuelSavedInr });
    setOptimizing(false);
  }

  async function handleStartDelivery() {
    if (!session) return;
    await updateSession(session.id, { status: 'active', started_at: new Date().toISOString() });
    setSession({ ...session, status: 'active' });
    router.push('/delivery/active');
  }

  async function handleNewSession() {
    if (!driver) return;
    const s = await createSession(driver.id);
    setSession(s);
  }

  const vehicleInfo = VEHICLE_TYPES.find(v => v.value === driver?.vehicle_type);
  const deliveredCount = session?.stops.filter(s => s.status === 'delivered').length ?? 0;
  const totalStops = session?.stops.length ?? 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
          </View>
          <View style={styles.vehicleBadge}>
            <Text style={styles.vehicleEmoji}>{vehicleInfo?.icon ?? '🛵'}</Text>
          </View>
        </View>

        {!session ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Text style={{ fontSize: 40 }}>📦</Text>
            </View>
            <Text style={styles.emptyTitle}>Ready to deliver?</Text>
            <Text style={styles.emptySub}>Start a new session to plan today's route</Text>
            <TouchableOpacity style={styles.startBtn} onPress={handleNewSession}>
              <Text style={styles.startBtnText}>Start today's deliveries →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {session.status === 'active' && totalStops > 0 && (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <View>
                    <Text style={styles.progressTitle}>In progress</Text>
                    <Text style={styles.progressSub}>{deliveredCount} of {totalStops} delivered</Text>
                  </View>
                  <Text style={styles.progressPct}>{Math.round((deliveredCount / totalStops) * 100)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${(deliveredCount / totalStops) * 100}%` as any }]} />
                </View>
              </View>
            )}

            {session.stops.length > 0 && (
              <RouteMap stops={session.stops} currentLocation={currentLocation} activeStopIndex={activeStopIndex} height={200} />
            )}

            {session.stops.length > 0 && (
              <FuelSavingsBanner
                distanceKm={session.optimized_distance_km}
                estimatedMinutes={Math.round((session.optimized_distance_km / 30) * 60 + session.stops.length * 3)}
                fuelSavedInr={session.fuel_saved_inr}
                savedKm={Math.max(0, session.total_distance_km - session.optimized_distance_km)}
                stopCount={session.stops.length}
              />
            )}

            {session.status === 'planning' && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnSecondary]}
                  onPress={handleOptimize}
                  disabled={optimizing || session.stops.length < 2}
                >
                  <Ionicons name="git-branch-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.actionBtnSecondaryText}>{optimizing ? 'Optimizing...' : 'Optimize'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary, session.stops.length === 0 && { opacity: 0.4 }]}
                  onPress={handleStartDelivery}
                  disabled={session.stops.length === 0}
                >
                  <Ionicons name="navigate" size={18} color={COLORS.white} />
                  <Text style={styles.actionBtnPrimaryText}>Start delivery</Text>
                </TouchableOpacity>
              </View>
            )}

            {session.status === 'active' && (
              <TouchableOpacity style={styles.continueBtn} onPress={() => router.push('/delivery/active')}>
                <View style={styles.continueDot} />
                <Text style={styles.continueBtnText}>Continue active delivery</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
              </TouchableOpacity>
            )}

            {session.stops.length > 0 ? (
              <View style={styles.stopsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Today's stops</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{session.stops.length}</Text>
                  </View>
                </View>
                {session.stops.map((stop, i) => (
                  <StopCard key={stop.id} stop={stop} index={i} isActive={session.status === 'active' && i === activeStopIndex} />
                ))}
              </View>
            ) : (
              <TouchableOpacity style={styles.addStopsCard} onPress={() => router.push('/tabs/add-stops')}>
                <Ionicons name="add-circle-outline" size={24} color={COLORS.accent} />
                <Text style={styles.addStopsText}>Tap to add delivery stops</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  scroll: { flex: 1 },
  content: { paddingBottom: 32, gap: 14 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  headerLeft: { gap: 2 },
  greeting: { fontSize: 13, color: COLORS.gray500, fontWeight: '500' },
  driverName: { fontSize: 22, fontWeight: '800', color: COLORS.gray900, letterSpacing: -0.3 },
  vehicleBadge: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  vehicleEmoji: { fontSize: 22 },
  emptyCard: {
    marginHorizontal: 20, backgroundColor: COLORS.primary, borderRadius: 24,
    padding: 28, alignItems: 'center', gap: 10,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: COLORS.primaryMid, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  emptySub: { fontSize: 13, color: COLORS.gray400, textAlign: 'center' },
  startBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 24, marginTop: 8,
  },
  startBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  progressCard: {
    marginHorizontal: 20, backgroundColor: COLORS.primary,
    borderRadius: 20, padding: 18, gap: 12,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  progressSub: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  progressPct: { fontSize: 28, fontWeight: '800', color: COLORS.accent },
  progressTrack: { height: 6, backgroundColor: COLORS.primaryMid, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: COLORS.accent, borderRadius: 3 },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 15,
  },
  actionBtnPrimary: { backgroundColor: COLORS.primary },
  actionBtnSecondary: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray200 },
  actionBtnPrimaryText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  actionBtnSecondaryText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  continueBtn: {
    marginHorizontal: 20, backgroundColor: COLORS.success,
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  continueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white },
  continueBtnText: { flex: 1, color: COLORS.white, fontWeight: '700', fontSize: 15 },
  stopsSection: { paddingHorizontal: 20, gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  countBadge: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  addStopsCard: {
    marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.accentLight, borderRadius: 16, padding: 18,
    borderWidth: 1.5, borderColor: COLORS.accent + '40',
  },
  addStopsText: { fontSize: 15, fontWeight: '600', color: COLORS.accent },
});