import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Linking, Platform,
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
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants';

export default function ActiveDeliveryScreen() {
  const { session, setSession, updateStop, activeStopIndex, setActiveStopIndex, currentLocation, driver } = useStore();
  const [marking, setMarking] = useState(false);
  const router = useRouter();

  const stops = session?.stops ?? [];
  const pendingStops = stops.filter(s => s.status === 'pending');
  const currentStop = pendingStops[0] ?? null;
  const deliveredCount = stops.filter(s => s.status === 'delivered').length;

  function openMapsNavigation() {
    if (!currentStop) return;
    const dest = `${currentStop.lat},${currentStop.lng}`;
    const label = encodeURIComponent(currentStop.customer_name);
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${dest}`
      : `google.navigation:q=${dest}&mode=d`;
    Linking.canOpenURL(url).then(can => {
      if (can) Linking.openURL(url);
      else Linking.openURL(`https://maps.google.com/maps?daddr=${dest}`);
    });
  }

  async function handleMarkDelivered() {
    if (!currentStop) return;

    Alert.alert('Mark as delivered?', 'Do you want to add a proof of delivery photo?', [
      {
        text: 'No photo',
        onPress: () => confirmDelivered(undefined),
      },
      {
        text: 'Take photo',
        onPress: takeProofPhoto,
      },
    ]);
  }

  async function takeProofPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera permission needed', 'Please allow camera access to take proof photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: false,
    });
    if (result.canceled) return;
    const photoUri = result.assets[0].uri;
    const photoUrl = await uploadProofPhoto(photoUri, currentStop!.id);
    confirmDelivered(photoUrl ?? undefined);
  }

  async function uploadProofPhoto(uri: string, stopId: string): Promise<string | null> {
    try {
      const ext = uri.split('.').pop();
      const filename = `proof/${driver?.id}/${stopId}_${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: `image/${ext}` } as any);
      const { data, error } = await supabase.storage.from('delivery-proofs').upload(filename, formData);
      if (error) return null;
      const { data: urlData } = supabase.storage.from('delivery-proofs').getPublicUrl(filename);
      return urlData.publicUrl;
    } catch {
      return null;
    }
  }

  async function confirmDelivered(photoUrl?: string) {
    if (!currentStop || !session) return;
    setMarking(true);
    const ok = await markStopDelivered(currentStop.id, photoUrl);
    if (ok) {
      updateStop(currentStop.id, { status: 'delivered', proof_photo_url: photoUrl, delivered_at: new Date().toISOString() });
      const remaining = pendingStops.length - 1;
      if (remaining === 0) {
        await finishDelivery();
      }
    }
    setMarking(false);
  }

  async function handleMarkFailed() {
    if (!currentStop) return;
    Alert.alert('Mark as failed?', 'This stop will be marked as undelivered.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark failed',
        style: 'destructive',
        onPress: async () => {
          setMarking(true);
          await markStopFailed(currentStop.id);
          updateStop(currentStop.id, { status: 'failed' });
          setMarking(false);
        },
      },
    ]);
  }

  async function finishDelivery() {
    if (!session) return;
    await updateSession(session.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    setSession({ ...session, status: 'completed' });
    Alert.alert('All done! 🎉', `You completed ${deliveredCount + 1} deliveries today!`, [
      { text: 'View summary', onPress: () => router.replace('/tabs/history') },
    ]);
  }

  if (!session || stops.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>📭</Text>
          <Text style={styles.emptyTitle}>No active delivery</Text>
          <Button title="Go back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={22} color={COLORS.gray700} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Active delivery</Text>
          <Text style={styles.topSub}>{deliveredCount}/{stops.length} done</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Map */}
        <RouteMap
          stops={stops}
          currentLocation={currentLocation}
          activeStopIndex={stops.findIndex(s => s.id === currentStop?.id)}
          height={190}
        />

        {/* Current stop card */}
        {currentStop ? (
          <View style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <View style={styles.nextBadge}>
                <Text style={styles.nextBadgeText}>Next stop</Text>
              </View>
              {currentStop.is_fragile && (
                <View style={styles.fragileBadge}>
                  <Text style={styles.fragileBadgeText}>⚠️ Fragile</Text>
                </View>
              )}
            </View>

            <Text style={styles.customerName}>{currentStop.customer_name}</Text>
            <Text style={styles.address}>{currentStop.address}</Text>

            {currentStop.notes ? (
              <View style={styles.notesRow}>
                <Ionicons name="document-text-outline" size={13} color={COLORS.gray500} />
                <Text style={styles.notesText}>{currentStop.notes}</Text>
              </View>
            ) : null}

            {currentStop.payment_type === 'cod' && (
              <View style={styles.codBanner}>
                <Ionicons name="cash-outline" size={16} color="#92400e" />
                <Text style={styles.codText}>
                  Collect <Text style={{ fontWeight: '700' }}>₹{currentStop.cod_amount}</Text> cash on delivery
                </Text>
              </View>
            )}

            {/* Navigate button */}
            <TouchableOpacity style={styles.navigateBtn} onPress={openMapsNavigation}>
              <Ionicons name="navigate" size={18} color={COLORS.white} />
              <Text style={styles.navigateBtnText}>Open in Google Maps</Text>
            </TouchableOpacity>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <Button
                title="Failed"
                onPress={handleMarkFailed}
                variant="danger"
                loading={marking}
                style={{ flex: 1 }}
                size="sm"
              />
              <Button
                title="Delivered ✓"
                onPress={handleMarkDelivered}
                loading={marking}
                style={{ flex: 1, backgroundColor: COLORS.success }}
                size="sm"
              />
            </View>
          </View>
        ) : (
          <View style={styles.allDoneCard}>
            <Text style={{ fontSize: 40 }}>🎉</Text>
            <Text style={styles.allDoneTitle}>All stops done!</Text>
            <Button title="Finish & see summary" onPress={finishDelivery} />
          </View>
        )}

        {/* Remaining stops */}
        {pendingStops.length > 1 && (
          <View style={styles.upNext}>
            <Text style={styles.sectionTitle}>Up next ({pendingStops.length - 1} stops)</Text>
            {pendingStops.slice(1).map((stop, i) => (
              <StopCard key={stop.id} stop={stop} index={i + 1} />
            ))}
          </View>
        )}

        {/* Completed stops */}
        {deliveredCount > 0 && (
          <View style={styles.completedSection}>
            <Text style={styles.sectionTitle}>Completed ({deliveredCount})</Text>
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
    backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.gray200,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center',
  },
  topCenter: { alignItems: 'center' },
  topTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray900 },
  topSub: { fontSize: 12, color: COLORS.gray500 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  currentCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    borderWidth: 0.5, borderColor: COLORS.gray200, gap: 10,
  },
  currentHeader: { flexDirection: 'row', gap: 8 },
  nextBadge: {
    backgroundColor: COLORS.accentLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  nextBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.accent },
  fragileBadge: {
    backgroundColor: COLORS.dangerLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  fragileBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.danger },
  customerName: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  address: { fontSize: 13, color: COLORS.gray500, lineHeight: 18 },
  notesRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', backgroundColor: COLORS.gray50, borderRadius: 8, padding: 8 },
  notesText: { fontSize: 12, color: COLORS.gray500, flex: 1 },
  codBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: COLORS.warningLight, borderRadius: 10, padding: 12,
  },
  codText: { fontSize: 14, color: '#92400e' },
  navigateBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 13,
  },
  navigateBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
  actionRow: { flexDirection: 'row', gap: 10 },
  allDoneCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 32,
    alignItems: 'center', gap: 12, borderWidth: 0.5, borderColor: COLORS.gray200,
  },
  allDoneTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  upNext: { gap: 8 },
  completedSection: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.4 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray700 },
});
