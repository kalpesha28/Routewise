import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, Alert,
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
import { Button } from '@/components/ui/Button';
import { COLORS, GOOGLE_MAPS_REGION_INDIA } from '@/constants';

export default function HomeScreen() {
  const { driver, session, setSession, activeStopIndex } = useStore();
  const { currentLocation } = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadSession();
    }, [driver])
  );

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
    if (!session || session.stops.length < 2) {
      Alert.alert('Need at least 2 stops', 'Add more delivery stops first.');
      return;
    }
    setOptimizing(true);
    const origin = currentLocation ?? {
      lat: session.stops[0].lat,
      lng: session.stops[0].lng,
    };
    const result = optimizeRoute(session.stops, origin, driver?.vehicle_type ?? 'bike');

    await updateSession(session.id, {
      optimized_distance_km: result.totalDistanceKm,
      total_distance_km: result.totalDistanceKm,
      fuel_saved_inr: result.fuelSavedInr,
    });

    // Update stop order in DB
    const { updateStopOrder } = await import('@/lib/api');
    await updateStopOrder(result.orderedStops.map((s, i) => ({ id: s.id, order_index: i })));

    setSession({
      ...session,
      stops: result.orderedStops,
      optimized_distance_km: result.totalDistanceKm,
      fuel_saved_inr: result.fuelSavedInr,
    });
    setOptimizing(false);
  }

  async function handleStartDelivery() {
    if (!session) return;
    await updateSession(session.id, {
      status: 'active',
      started_at: new Date().toISOString(),
    });
    setSession({ ...session, status: 'active' });
    router.push('/delivery/active');
  }

  async function handleNewSession() {
    if (!driver) return;
    const s = await createSession(driver.id);
    setSession(s);
  }

  const pendingStops = session?.stops.filter(s => s.status === 'pending') ?? [];
  const deliveredCount = session?.stops.filter(s => s.status === 'delivered').length ?? 0;
  const totalStops = session?.stops.length ?? 0;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, {driver?.name?.split(' ')[0] ?? 'there'} 👋</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <TouchableOpacity style={styles.vehicleBadge}>
            <Text style={styles.vehicleText}>
              {driver?.vehicle_type === 'bike' ? '🛵' :
               driver?.vehicle_type === 'auto' ? '🛺' :
               driver?.vehicle_type === 'car' ? '🚗' : '🚐'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* No session state */}
        {!session ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 48, textAlign: 'center' }}>📦</Text>
            <Text style={styles.emptyTitle}>No deliveries today</Text>
            <Text style={styles.emptySub}>Start a new session to plan your route</Text>
            <Button title="Start today's deliveries" onPress={handleNewSession} style={{ marginTop: 8 }} />
          </View>
        ) : (
          <>
            {/* Map */}
            {session.stops.length > 0 && (
              <RouteMap
                stops={session.stops}
                currentLocation={currentLocation}
                activeStopIndex={activeStopIndex}
                height={200}
              />
            )}

            {/* Progress bar when active */}
            {session.status === 'active' && totalStops > 0 && (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Today's progress</Text>
                  <Text style={styles.progressCount}>{deliveredCount}/{totalStops} done</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(deliveredCount / totalStops) * 100}%` }]} />
                </View>
              </View>
            )}

            {/* Stats banner */}
            {session.stops.length > 0 && (
              <FuelSavingsBanner
                distanceKm={session.optimized_distance_km}
                estimatedMinutes={Math.round((session.optimized_distance_km / 30) * 60 + session.stops.length * 3)}
                fuelSavedInr={session.fuel_saved_inr}
                savedKm={Math.max(0, session.total_distance_km - session.optimized_distance_km)}
                stopCount={session.stops.length}
              />
            )}

            {/* Action buttons */}
            {session.status === 'planning' && (
              <View style={styles.actionRow}>
                <Button
                  title="Optimize Route"
                  onPress={handleOptimize}
                  loading={optimizing}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Start Delivery"
                  onPress={handleStartDelivery}
                  disabled={session.stops.length === 0}
                  style={{ flex: 1 }}
                />
              </View>
            )}

            {session.status === 'active' && (
              <Button title="Continue Delivery →" onPress={() => router.push('/delivery/active')} />
            )}

            {/* Stops list */}
            {session.stops.length > 0 ? (
              <View style={styles.stopsList}>
                <Text style={styles.sectionTitle}>
                  {pendingStops.length} stops remaining
                </Text>
                {session.stops.map((stop, i) => (
                  <StopCard key={stop.id} stop={stop} index={i} isActive={session.status === 'active' && i === activeStopIndex} />
                ))}
              </View>
            ) : (
              <View style={styles.noStops}>
                <Text style={styles.noStopsText}>No stops yet. Go to Add Stops to plan your route.</Text>
                <Button
                  title="+ Add delivery stops"
                  onPress={() => router.push('/tabs/add-stops')}
                  variant="secondary"
                  style={{ marginTop: 12 }}
                />
              </View>
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
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  greeting: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  date: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  vehicleBadge: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.gray200,
    alignItems: 'center', justifyContent: 'center',
  },
  vehicleText: { fontSize: 22 },
  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 32,
    alignItems: 'center', gap: 10, borderWidth: 0.5, borderColor: COLORS.gray200,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray900 },
  emptySub: { fontSize: 13, color: COLORS.gray500, textAlign: 'center' },
  progressCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    borderWidth: 0.5, borderColor: COLORS.gray200, gap: 10,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, fontWeight: '500', color: COLORS.gray700 },
  progressCount: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  progressBar: { height: 6, backgroundColor: COLORS.gray100, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: COLORS.accent, borderRadius: 3 },
  actionRow: { flexDirection: 'row', gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray700, marginBottom: 4 },
  stopsList: { gap: 0 },
  noStops: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 20,
    alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.gray200,
  },
  noStopsText: { fontSize: 13, color: COLORS.gray500, textAlign: 'center' },
});
