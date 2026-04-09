import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/lib/store';
import { updateDriver } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { COLORS, VEHICLE_TYPES } from '@/constants';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { driver, setDriver } = useStore();
  const [name, setName] = useState(driver?.name ?? '');
  const [vehicle, setVehicle] = useState(driver?.vehicle_type ?? 'bike');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  async function handleSave() {
    if (!driver || !name.trim()) return;
    setSaving(true);
    const ok = await updateDriver(driver.id, { name: name.trim(), vehicle_type: vehicle as any });
    setSaving(false);
    if (ok) {
      setDriver({ ...driver, name: name.trim(), vehicle_type: vehicle as any });
      setEditing(false);
    } else {
      Alert.alert('Error', 'Could not save. Please try again.');
    }
  }

  function handleSignOut() {
    Alert.alert('Sign out?', 'You will be logged out of RouteWise.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  const vehicleInfo = VEHICLE_TYPES.find(v => v.value === driver?.vehicle_type);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {driver?.name ? driver.name[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
          <Text style={styles.driverPhone}>{driver?.phone}</Text>
          <View style={styles.vehiclePill}>
            <Text style={{ fontSize: 16 }}>{vehicleInfo?.icon}</Text>
            <Text style={styles.vehiclePillText}>{vehicleInfo?.label}</Text>
          </View>
        </View>

        {/* Edit form */}
        {editing ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit profile</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Vehicle</Text>
              <View style={styles.vehicleGrid}>
                {VEHICLE_TYPES.map((v) => (
                  <TouchableOpacity
                    key={v.value}
                    style={[styles.vehicleOption, vehicle === v.value && styles.vehicleOptionActive]}
                    onPress={() => setVehicle(v.value)}
                  >
                    <Text style={{ fontSize: 22 }}>{v.icon}</Text>
                    <Text style={[styles.vehicleOptionText, vehicle === v.value && { color: COLORS.accent }]}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.buttonRow}>
              <Button title="Cancel" onPress={() => setEditing(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Save" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <Button title="Edit profile" onPress={() => setEditing(true)} variant="secondary" />
        )}

        {/* Info cards */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.accent} />
            <Text style={styles.infoText}>RouteWise uses the nearest-neighbour + 2-opt algorithm to find the shortest path through all your stops — the same approach used in professional logistics software.</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="leaf-outline" size={18} color={COLORS.success} />
            <Text style={styles.infoText}>Fuel savings are calculated based on your vehicle type and current petrol price (₹106/L). Select your vehicle accurately for best estimates.</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>RouteWise v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  heading: { fontSize: 22, fontWeight: '700', color: COLORS.gray900 },
  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: 10 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: COLORS.white },
  driverName: { fontSize: 20, fontWeight: '700', color: COLORS.gray900 },
  driverPhone: { fontSize: 14, color: COLORS.gray400 },
  vehiclePill: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    backgroundColor: COLORS.accentLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  vehiclePillText: { fontSize: 13, fontWeight: '500', color: COLORS.accent },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: COLORS.gray200, gap: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.gray900 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray700, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.gray900,
  },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vehicleOption: {
    flex: 1, minWidth: '45%', alignItems: 'center', gap: 4, padding: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  vehicleOptionActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  vehicleOptionText: { fontSize: 12, fontWeight: '500', color: COLORS.gray600, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    borderWidth: 0.5, borderColor: COLORS.gray200,
  },
  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  infoText: { fontSize: 13, color: COLORS.gray500, lineHeight: 19, flex: 1 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center',
    padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.dangerLight,
    backgroundColor: COLORS.dangerLight,
  },
  signOutText: { fontSize: 15, fontWeight: '500', color: COLORS.danger },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.gray400 },
});
