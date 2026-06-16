import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Linking, Platform, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '@/lib/store';
import { markStopDelivered, markStopFailed, updateSession } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { RouteMap } from '@/components/map/RouteMap';
import { StopCard } from '@/components/ui/StopCard';
import { LiveETACard } from '@/components/ui/LiveETACard';
import { COLORS } from '@/constants';

export default function ActiveDeliveryScreen() {
  const { session, setSession, updateStop, currentLocation, driver } = useStore();
  const [marking, setMarking] = useState(false);
  const router = useRouter();

  const stops = session?.stops ?? [];
  const pendingStops = stops.filter(s => s.status === 'pending');
  const currentStop = pendingStops[0] ?? null;
  const deliveredCount = stops.filter(s => s.status === 'delivered').length;
  const progress = stops.length > 0 ? deliveredCount / stops.length : 0;

  function openMapsNavigation() {
    if (!currentStop) return;
    const dest = `${currentStop.lat},${currentStop.lng}`;
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${dest}`
      : `google.navigation:q=${dest}&mode=d`;
    Linking.canOpenURL(url).then(can => {
      Linking.openURL(can ? url : `https://maps.google.com/maps?daddr=${dest}`);
    });
  }

  async function handleMarkDelivered() {
    if (!currentStop) return;
    Alert.alert('Mark as delivered?', 'Add a proof of delivery photo?', [
      { text: 'No photo', onPress: () => confirmDelivered(undefined) },
      { text: '📷 Take photo', onPress: takeProofPhoto },
    ]);
  }

  async function takeProofPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { confirmDelivered(undefined); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (result.canceled) return;
    const photoUrl = await uploadProofPhoto(result.assets[0].uri, currentStop!.id);
    confirmDelivered(photoUrl ?? undefined);
  }

  async function uploadProofPhoto(uri: string, stopId: string): Promise<string | null> {
    try {
      const ext = uri.split('.').pop();
      const filename = `proof/${driver?.id}/${stopId}_${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: `image/${ext}` } as any);
      const { data } = await supabase.storage.from('delivery-proofs').upload(filename, formData);
      if (!data) return null;
      const { data: urlData } = supabase.storage.from('delivery-proofs').getPublicUrl(filename);
      return urlData.publicUrl;
    } catch { return null; }
  }

  async function confirmDelivered(photoUrl?: string) {
    if (!currentStop || !session) return;
    setMarking(true);
    Vibration.vibrate(100);
    const ok = await markStopDelivered(currentStop.id, photoUrl);
    if (ok) {
      updateStop(currentStop.id, { status: 'delivered', proof_photo_url: photoUrl, delivered_at: new Date().toISOString() });
      if (pendingStops.length - 1 === 0) await finishDelivery();
    }
    setMarking(false);
  }

  async function handleMarkFailed() {
    if (!currentStop) return;
    Alert.alert('Mark as failed?', 'This stop will be skipped.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark failed', style: 'destructive', onPress: async () => {
        setMarking(true);
        await markStopFailed(currentStop.id);
        updateStop(currentStop.id, { status: 'failed' });
        setMarking(false);
      }},
    ]);
  }

  async function finishDelivery() {
    if (!session) return;
    await updateSession(session.id, { status: 'completed', completed_at: new Date().toISOString() });
    setSession({ ...session, status: 'completed' });
    Vibration.vibrate([0, 100, 100, 100]);
    Alert.alert('🎉 All done!', `You completed ${deliveredCount + 1} deliveries today!`, [
      { text: 'View summary', onPress: () => router.replace('/tabs/history') },
    ]);
  }

  if (!session || stops.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>📭</Text>
          <Text style={styles.emptyTitle}>No active delivery</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={20} color={COLORS.gray700} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Active delivery</Text>
          <Text style={styles.topSub}>{deliveredCount}/{stops.length} completed</Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressCircleText}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map */}
        <RouteMap
          stops={stops}
          currentLocation={currentLocation}
          activeStopIndex={stops.findIndex(s => s.id === currentStop?.id)}
          height={180}
        />

        {/* Current stop */}
        {currentStop ? (
          <>
            <LiveETACard
              stop={currentStop}
              currentLocation={currentLocation}
              onNavigate={openMapsNavigation}
            />

            {currentStop.is_fragile && (
              <View style={styles.fragileAlert}>
                <Text style={styles.fragileIcon}>⚠️</Text>
                <Text style={styles.fragileText}>Fragile package — handle with care</Text>
              </View>
            )}

            {currentStop.notes && (
              <View style={styles.notesCard}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.gray500} />
                <Text style={styles.notesText}>{currentStop.notes}</Text>
              </View>
            )}

            {/* Delivery actions */}
            <View style={styles.deliveryActions}>
              <TouchableOpacity
                style={styles.failBtn}
                onPress={handleMarkFailed}
                disabled={marking}
              >
                <Ionicons name="close-circle-outline" size={20} color={COLORS.danger} />
                <Text style={styles.failBtnText}>Failed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deliveredBtn}
                onPress={handleMarkDelivered}
                disabled={marking}
              >
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.deliveredBtnText}>{marking ? 'Saving...' : 'Mark Delivered'}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.allDoneCard}>
            <Text style={{ fontSize: 48 }}>🎉</Text>
            <Text style={styles.allDoneTitle}>All stops done!</Text>
            <TouchableOpacity style={styles.finishBtn} onPress={finishDelivery}>
              <Text style={styles.finishBtnText}>Finish & see summary →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming stops */}
        {pendingStops.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Up next · {pendingStops.length - 1} stops</Text>
            {pendingStops.slice(1, 4).map((stop, i) => (
              <StopCard key={stop.id} stop={stop} index={i + 1} />
            ))}
            {pendingStops.length > 4 && (
              <Text style={styles.moreStops}>+{pendingStops.length - 4} more stops</Text>
            )}
          </View>
        )}

        {/* Completed */}
        {deliveredCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed · {deliveredCount}</Text>
            {stops.filter(s => s.status !== 'pending').map((stop, i) => (
              <StopCard key={stop.id} stop={stop} index={i} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.gray100,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center',
  },
  topCenter: { alignItems: 'center' },
  topTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
  topSub: { fontSize: 12, color: COLORS.gray400 },
  progressCircle: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.accentLight, alignItems: 'center', justifyContent: 'center',
  },
  progressCircleText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  progressBar: { height: 3, backgroundColor: COLORS.gray100 },
  progressFill: { height: 3, backgroundColor: COLORS.accent },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  fragileAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.dangerLight, borderRadius: 12, padding: 12,
  },
  fragileIcon: { fontSize: 16 },
  fragileText: { fontSize: 13, fontWeight: '600', color: COLORS.danger },
  notesCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: COLORS.gray50, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.gray100,
  },
  notesText: { flex: 1, fontSize: 13, color: COLORS.gray500, lineHeight: 18 },
  deliveryActions: { flexDirection: 'row', gap: 10 },
  failBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 16, paddingVertical: 15,
    backgroundColor: COLORS.dangerLight, borderWidth: 1.5, borderColor: COLORS.danger + '30',
  },
  failBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },
  deliveredBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.success, borderRadius: 16, paddingVertical: 15,
  },
  deliveredBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  allDoneCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 32,
    alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.gray100,
  },
  allDoneTitle: { fontSize: 22, fontWeight: '800', color: COLORS.gray900 },
  finishBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24 },
  finishBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.5 },
  moreStops: { fontSize: 12, color: COLORS.gray400, textAlign: 'center', padding: 8 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray700 },
  backBtn: { backgroundColor: COLORS.gray100, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  backBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.gray700 },
});