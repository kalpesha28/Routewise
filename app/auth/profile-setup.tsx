import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { updateDriver } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { COLORS, VEHICLE_TYPES } from '@/constants';

export default function ProfileSetupScreen() {
  const { driver, setDriver } = useStore();
  const [name, setName] = useState('');
  const [vehicle, setVehicle] = useState<'bike' | 'auto' | 'car' | 'tempo'>('bike');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name to continue.');
      return;
    }
    if (!driver) return;
    setLoading(true);
    const ok = await updateDriver(driver.id, { name: name.trim(), vehicle_type: vehicle });
    setLoading(false);
    if (!ok) {
      Alert.alert('Error', 'Could not save profile. Please try again.');
      return;
    }
    setDriver({ ...driver, name: name.trim(), vehicle_type: vehicle });
    router.replace('/tabs/home');
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 40 }}>👤</Text>
        </View>
        <Text style={styles.heading}>Set up your profile</Text>
        <Text style={styles.sub}>This helps us calculate fuel savings accurately</Text>
      </View>

      {/* Name input */}
      <View style={styles.section}>
        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Rahul Pawar"
          placeholderTextColor={COLORS.gray400}
          value={name}
          onChangeText={setName}
          returnKeyType="done"
          autoCapitalize="words"
        />
      </View>

      {/* Vehicle type */}
      <View style={styles.section}>
        <Text style={styles.label}>Your vehicle</Text>
        <View style={styles.vehicleGrid}>
          {VEHICLE_TYPES.map((v) => (
            <TouchableOpacity
              key={v.value}
              style={[styles.vehicleCard, vehicle === v.value && styles.vehicleCardActive]}
              onPress={() => setVehicle(v.value as typeof vehicle)}
              activeOpacity={0.8}
            >
              <Text style={styles.vehicleIcon}>{v.icon}</Text>
              <Text style={[styles.vehicleLabel, vehicle === v.value && styles.vehicleLabelActive]}>
                {v.label}
              </Text>
              <Text style={styles.vehicleSub}>{v.fuelRate}₹/km avg</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Button title="Start delivering →" onPress={handleSave} loading={loading} style={styles.btn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  scroll: { padding: 24, gap: 28, paddingBottom: 48 },
  hero: { alignItems: 'center', gap: 12, marginTop: 32 },
  iconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.accentLight, alignItems: 'center', justifyContent: 'center',
  },
  heading: { fontSize: 24, fontWeight: '700', color: COLORS.gray900 },
  sub: { fontSize: 14, color: COLORS.gray500, textAlign: 'center' },
  section: { gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.gray200, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: COLORS.gray900,
  },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vehicleCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.gray200,
  },
  vehicleCardActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  vehicleIcon: { fontSize: 30 },
  vehicleLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray700, textAlign: 'center' },
  vehicleLabelActive: { color: COLORS.accent },
  vehicleSub: { fontSize: 11, color: COLORS.gray400 },
  btn: { marginTop: 8 },
});
