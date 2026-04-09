import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch, FlatList, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { addStop, deleteStop, getTodaySession, createSession } from '@/lib/api';
import { StopCard } from '@/components/ui/StopCard';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants';
import { StopInput } from '@/types';


const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function AddStopsScreen() {
  const { driver, session, setSession } = useStore();

  // Form state
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState<'paid' | 'cod'>('paid');
  const [codAmount, setCodAmount] = useState('');
  const [isFragile, setIsFragile] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadOrCreateSession();
    }, [driver])
  );

  async function loadOrCreateSession() {
    if (!driver) return;
    let s = session;
    if (!s) {
      s = await getTodaySession(driver.id);
      if (!s) s = await createSession(driver.id);
      setSession(s);
    }
  }

  // Debounced Google Places Autocomplete
  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return; }
    const t = setTimeout(() => searchPlaces(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  async function searchPlaces(text: string) {
  setSearching(true);
  try {
    if (Platform.OS === 'web') {
      // On web, use a simple static suggestion to avoid CORS
      setSuggestions([{
        place_id: 'web_placeholder',
        description: text,
        structured_formatting: { main_text: text, secondary_text: 'Search works on Android app' }
      }] as any);
    } else {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&components=country:in&key=${MAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.predictions ?? []);
    }
  } catch {
    setSuggestions([]);
  }
  setSearching(false);
}

  async function handleSelectPlace(place: PlaceSuggestion) {
  setSuggestions([]);
  setQuery(place.structured_formatting.main_text);
  
  if (Platform.OS === 'web') {
    // On web, use dummy coordinates for testing
    setSelectedPlace({
      name: place.structured_formatting.main_text,
      address: place.structured_formatting.main_text,
      lat: 19.9975 + (Math.random() - 0.5) * 0.1,
      lng: 73.7898 + (Math.random() - 0.5) * 0.1,
    });
    setShowForm(true);
    return;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=geometry,formatted_address&key=${MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data.result?.geometry?.location;
    if (!loc) return;
    setSelectedPlace({
      name: place.structured_formatting.main_text,
      address: data.result.formatted_address,
      lat: loc.lat,
      lng: loc.lng,
    });
    setShowForm(true);
  } catch {
    Alert.alert('Error', 'Could not fetch location details.');
  }
}

  async function handleAddStop() {
    if (!selectedPlace || !customerName.trim() || !session) return;
    if (paymentType === 'cod' && (!codAmount || isNaN(Number(codAmount)))) {
      Alert.alert('Enter COD amount', 'Please enter the cash on delivery amount.');
      return;
    }

    setAdding(true);
    const stopData: StopInput = {
      customer_name: customerName.trim(),
      address: selectedPlace.address,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      notes: notes.trim() || undefined,
      payment_type: paymentType,
      cod_amount: paymentType === 'cod' ? Number(codAmount) : undefined,
      is_fragile: isFragile,
    };

    const newStop = await addStop(session.id, stopData, session.stops.length);
    setAdding(false);

    if (!newStop) {
      Alert.alert('Error', 'Could not add stop. Check your connection.');
      return;
    }

    setSession({ ...session, stops: [...session.stops, newStop] });
    resetForm();
  }

  function resetForm() {
    setQuery('');
    setSelectedPlace(null);
    setCustomerName('');
    setNotes('');
    setPaymentType('paid');
    setCodAmount('');
    setIsFragile(false);
    setShowForm(false);
    setSuggestions([]);
  }

  async function handleDelete(stopId: string) {
    Alert.alert('Remove stop?', 'This will remove the stop from today\'s route.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteStop(stopId);
          if (ok && session) {
            setSession({ ...session, stops: session.stops.filter(s => s.id !== stopId) });
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Add delivery stops</Text>
        <Text style={styles.sub}>Search for an address to add it to today's route</Text>

        {/* Search box */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search address, landmark, area..."
            placeholderTextColor={COLORS.gray400}
            value={query}
            onChangeText={(t) => { setQuery(t); setShowForm(false); setSelectedPlace(null); }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={resetForm}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s.place_id} style={styles.suggestion} onPress={() => handleSelectPlace(s)}>
                <Ionicons name="location-outline" size={16} color={COLORS.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sugMain}>{s.structured_formatting.main_text}</Text>
                  <Text style={styles.sugSub} numberOfLines={1}>{s.structured_formatting.secondary_text}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Form */}
        {showForm && selectedPlace && (
          <View style={styles.form}>
            <View style={styles.selectedPlace}>
              <Ionicons name="location" size={16} color={COLORS.accent} />
              <Text style={styles.selectedAddr} numberOfLines={2}>{selectedPlace.address}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Customer name *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={COLORS.gray400}
                value={customerName}
                onChangeText={setCustomerName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Delivery notes (optional)</Text>
              <TextInput
                style={[styles.fieldInput, { height: 70 }]}
                placeholder="e.g. Call before arriving, leave at gate..."
                placeholderTextColor={COLORS.gray400}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Payment type */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Payment</Text>
              <View style={styles.toggleRow}>
                {(['paid', 'cod'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.toggleBtn, paymentType === type && styles.toggleBtnActive]}
                    onPress={() => setPaymentType(type)}
                  >
                    <Text style={[styles.toggleText, paymentType === type && styles.toggleTextActive]}>
                      {type === 'paid' ? '✓ Already paid' : '💵 Cash on delivery'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {paymentType === 'cod' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>COD amount (₹)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. 450"
                  placeholderTextColor={COLORS.gray400}
                  value={codAmount}
                  onChangeText={setCodAmount}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Fragile toggle */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.fieldLabel}>Fragile package</Text>
                <Text style={styles.switchSub}>Handle with extra care</Text>
              </View>
              <Switch
                value={isFragile}
                onValueChange={setIsFragile}
                trackColor={{ false: COLORS.gray200, true: COLORS.accent }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.formButtons}>
              <Button title="Cancel" onPress={resetForm} variant="ghost" style={{ flex: 1 }} />
              <Button
                title="Add stop"
                onPress={handleAddStop}
                loading={adding}
                disabled={!customerName.trim()}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}

        {/* Current stops */}
        {(session?.stops.length ?? 0) > 0 && (
          <View style={styles.currentStops}>
            <Text style={styles.sectionTitle}>Today's stops ({session!.stops.length})</Text>
            {session!.stops.map((stop, i) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={i}
                showDelete
                onDelete={() => handleDelete(stop.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '700', color: COLORS.gray900 },
  sub: { fontSize: 13, color: COLORS.gray500, marginTop: -6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.gray200,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.gray900 },
  suggestions: {
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 0.5, borderColor: COLORS.gray200, overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 13, borderBottomWidth: 0.5, borderBottomColor: COLORS.gray100,
  },
  sugMain: { fontSize: 14, fontWeight: '500', color: COLORS.gray900 },
  sugSub: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  form: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: COLORS.gray200, gap: 14,
  },
  selectedPlace: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: COLORS.accentLight, borderRadius: 10, padding: 10,
  },
  selectedAddr: { flex: 1, fontSize: 13, color: COLORS.accent, lineHeight: 18 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray700, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldInput: {
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.gray900,
    backgroundColor: COLORS.gray50,
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.gray200,
    alignItems: 'center', backgroundColor: COLORS.white,
  },
  toggleBtnActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  toggleText: { fontSize: 12, fontWeight: '500', color: COLORS.gray500 },
  toggleTextActive: { color: COLORS.accent },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 4,
  },
  switchSub: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  formButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  currentStops: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray700 },
});
