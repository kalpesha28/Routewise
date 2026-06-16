import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stop } from '@/types';
import { COLORS } from '@/constants';

interface StopCardProps {
  stop: Stop;
  index: number;
  isActive?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export function StopCard({ stop, index, isActive, onPress, onDelete, showDelete }: StopCardProps) {
  const isDone = stop.status === 'delivered';
  const isFailed = stop.status === 'failed';

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive, isDone && styles.cardDone, isFailed && styles.cardFailed]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.numWrap, isDone && styles.numWrapDone, isActive && styles.numWrapActive, isFailed && styles.numWrapFailed]}>
        {isDone
          ? <Ionicons name="checkmark" size={14} color={COLORS.white} />
          : isFailed
          ? <Ionicons name="close" size={14} color={COLORS.white} />
          : <Text style={[styles.num, isActive && styles.numActive]}>{index + 1}</Text>
        }
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, isDone && styles.nameDone]} numberOfLines={1}>{stop.customer_name}</Text>
        <Text style={styles.address} numberOfLines={1}>{stop.address}</Text>
        <View style={styles.tags}>
          {stop.payment_type === 'cod' && stop.cod_amount
            ? <View style={styles.tagCod}><Text style={styles.tagCodText}>💵 ₹{stop.cod_amount}</Text></View>
            : <View style={styles.tagPaid}><Text style={styles.tagPaidText}>✓ Paid</Text></View>
          }
          {stop.is_fragile && <View style={styles.tagFragile}><Text style={styles.tagFragileText}>⚠️ Fragile</Text></View>}
        </View>
      </View>

      {showDelete
        ? <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        : <Ionicons name="chevron-forward" size={16} color={COLORS.gray300} />
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.gray100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardActive: { borderColor: COLORS.accent, borderWidth: 1.5, backgroundColor: COLORS.accentLight },
  cardDone: { opacity: 0.6, backgroundColor: COLORS.gray50 },
  cardFailed: { borderColor: COLORS.danger + '40' },
  numWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center',
  },
  numWrapActive: { backgroundColor: COLORS.primary },
  numWrapDone: { backgroundColor: COLORS.success },
  numWrapFailed: { backgroundColor: COLORS.danger },
  num: { fontSize: 13, fontWeight: '700', color: COLORS.gray600 },
  numActive: { color: COLORS.white },
  content: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.gray900 },
  nameDone: { textDecorationLine: 'line-through', color: COLORS.gray400 },
  address: { fontSize: 12, color: COLORS.gray400 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 2 },
  tagCod: { backgroundColor: COLORS.warningLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagCodText: { fontSize: 10, fontWeight: '600', color: '#92400e' },
  tagPaid: { backgroundColor: COLORS.successLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagPaidText: { fontSize: 10, fontWeight: '600', color: '#065f46' },
  tagFragile: { backgroundColor: COLORS.dangerLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagFragileText: { fontSize: 10, fontWeight: '600', color: '#7f1d1d' },
});