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

export function StopCard({
  stop,
  index,
  isActive = false,
  onPress,
  onDelete,
  showDelete = false,
}: StopCardProps) {
  const statusColor =
    stop.status === 'delivered'
      ? COLORS.success
      : stop.status === 'failed'
      ? COLORS.danger
      : isActive
      ? COLORS.accent
      : COLORS.gray400;

  const statusBg =
    stop.status === 'delivered'
      ? COLORS.successLight
      : stop.status === 'failed'
      ? COLORS.dangerLight
      : isActive
      ? COLORS.accentLight
      : COLORS.gray100;

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Number badge */}
      <View style={[styles.badge, { backgroundColor: statusBg }]}>
        {stop.status === 'delivered' ? (
          <Ionicons name="checkmark" size={14} color={statusColor} />
        ) : stop.status === 'failed' ? (
          <Ionicons name="close" size={14} color={statusColor} />
        ) : (
          <Text style={[styles.badgeText, { color: statusColor }]}>{index + 1}</Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {stop.customer_name}
        </Text>
        <Text style={styles.address} numberOfLines={2}>
          {stop.address}
        </Text>

        {/* Tags row */}
        <View style={styles.tags}>
          {stop.payment_type === 'cod' && stop.cod_amount ? (
            <View style={[styles.tag, styles.tagCod]}>
              <Text style={styles.tagCodText}>COD ₹{stop.cod_amount}</Text>
            </View>
          ) : (
            <View style={[styles.tag, styles.tagPaid]}>
              <Text style={styles.tagPaidText}>Paid</Text>
            </View>
          )}
          {stop.is_fragile && (
            <View style={[styles.tag, styles.tagFragile]}>
              <Text style={styles.tagFragileText}>Fragile</Text>
            </View>
          )}
          {stop.notes ? (
            <View style={[styles.tag, styles.tagNote]}>
              <Ionicons name="document-text-outline" size={10} color={COLORS.gray500} />
            </View>
          ) : null}
        </View>
      </View>

      {/* Right side */}
      <View style={styles.right}>
        {showDelete ? (
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: COLORS.gray200,
    gap: 10,
  },
  cardActive: {
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray900,
  },
  address: {
    fontSize: 12,
    color: COLORS.gray500,
    lineHeight: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagCod: { backgroundColor: COLORS.warningLight },
  tagCodText: { fontSize: 10, color: '#92400e', fontWeight: '500' },
  tagPaid: { backgroundColor: COLORS.successLight },
  tagPaidText: { fontSize: 10, color: '#14532d', fontWeight: '500' },
  tagFragile: { backgroundColor: COLORS.dangerLight },
  tagFragileText: { fontSize: 10, color: '#7f1d1d', fontWeight: '500' },
  tagNote: { backgroundColor: COLORS.gray100, width: 20, alignItems: 'center' },
  right: {
    paddingTop: 4,
  },
});
