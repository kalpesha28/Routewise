import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stop } from '@/types';
import { COLORS } from '@/constants';
import { haversineKm, formatDuration } from '@/lib/optimizer';

interface Props {
  stop: Stop;
  currentLocation: { lat: number; lng: number } | null;
  onNavigate: () => void;
}

export function LiveETACard({ stop, currentLocation, onNavigate }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [stop.id]);

  const distKm = currentLocation
    ? haversineKm(currentLocation, { lat: stop.lat, lng: stop.lng })
    : null;
  const etaMin = distKm ? Math.max(1, Math.round((distKm / 30) * 60)) : null;

  function openWhatsApp() {
    const msg = encodeURIComponent(`Hi, I'm your delivery partner from RouteWise. I'll arrive in approximately ${etaMin} minutes with your package. 📦`);
    Linking.openURL(`whatsapp://send?text=${msg}`);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.activeDot} />
        <Text style={styles.headerText}>Currently delivering to</Text>
      </View>

      <Text style={styles.customerName}>{stop.customer_name}</Text>
      <Text style={styles.address} numberOfLines={2}>{stop.address}</Text>

      {/* ETA + distance */}
      {distKm !== null && (
        <View style={styles.etaRow}>
          <View style={styles.etaStat}>
            <Text style={styles.etaVal}>{distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}</Text>
            <Text style={styles.etaLabel}>Distance</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaStat}>
            <Text style={styles.etaVal}>{etaMin} min</Text>
            <Text style={styles.etaLabel}>ETA</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaStat}>
            <Text style={styles.etaVal}>{formatDuration(elapsed >= 60 ? Math.floor(elapsed / 60) : 0)}{elapsed < 60 ? `${elapsed}s` : ''}</Text>
            <Text style={styles.etaLabel}>En route</Text>
          </View>
        </View>
      )}

      {stop.payment_type === 'cod' && (
        <View style={styles.codAlert}>
          <Ionicons name="cash-outline" size={16} color="#92400e" />
          <Text style={styles.codAlertText}>Collect <Text style={{ fontWeight: '800' }}>₹{stop.cod_amount}</Text> cash on delivery</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.navBtn} onPress={onNavigate}>
          <Ionicons name="navigate" size={18} color={COLORS.white} />
          <Text style={styles.navBtnText}>Open Maps</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp}>
          <Text style={styles.waBtnText}>📱 WhatsApp ETA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 18,
    borderWidth: 1.5, borderColor: COLORS.accent + '40', gap: 10,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  headerText: { fontSize: 12, color: COLORS.gray400, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  customerName: { fontSize: 22, fontWeight: '800', color: COLORS.gray900, letterSpacing: -0.3 },
  address: { fontSize: 13, color: COLORS.gray500, lineHeight: 18 },
  etaRow: {
    flexDirection: 'row', backgroundColor: COLORS.gray50,
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  etaStat: { flex: 1, alignItems: 'center', gap: 3 },
  etaVal: { fontSize: 18, fontWeight: '700', color: COLORS.gray900 },
  etaLabel: { fontSize: 10, color: COLORS.gray400 },
  etaDivider: { width: 1, height: 32, backgroundColor: COLORS.gray200 },
  codAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.warningLight, borderRadius: 12, padding: 12,
  },
  codAlertText: { fontSize: 14, color: '#92400e' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 13,
  },
  navBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  waBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#25D366' + '20', borderRadius: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: '#25D366' + '40',
  },
  waBtnText: { color: '#128C7E', fontWeight: '700', fontSize: 14 },
});