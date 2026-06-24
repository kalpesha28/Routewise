import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function handleAuth() {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert('Check inputs', 'Enter a valid email and password (min 6 chars).');
      return;
    }
    setLoading(true);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Text style={styles.logoEmoji}>🛵</Text>
            </View>
          </View>
          <Text style={styles.appName}>RouteWise</Text>
          <Text style={styles.tagline}>Deliver smarter.{'\n'}Save fuel. Earn more.</Text>

          <View style={styles.statsRow}>
            {[
              { val: '2x', label: 'Faster routes' },
              { val: '₹18', label: 'Avg fuel saved' },
              { val: '100%', label: 'Free to use' },
            ].map((s, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isSignUp ? 'Create account' : 'Sign in'}</Text>

          <View style={[styles.inputWrap, focused === 'email' && styles.inputFocused]}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={[styles.inputWrap, focused === 'pass' && styles.inputFocused]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor={COLORS.gray400}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('pass')}
              onBlur={() => setFocused(null)}
              onSubmitEditing={handleAuth}
            />
          </View>

          <TouchableOpacity
            style={[styles.authBtn, loading && { opacity: 0.7 }]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.authBtnText}>
              {loading ? 'Please wait...' : isSignUp ? 'Create account →' : 'Sign in →'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.toggleLink}>{isSignUp ? 'Sign in' : 'Sign up'}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Trusted by delivery partners across India 🇮🇳</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 },
  logoRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1.5, borderColor: COLORS.accent + '40',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  logoInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryMid,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.accent + '30',
  },
  logoEmoji: { fontSize: 34 },
  appName: { fontSize: 36, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5, marginBottom: 8 },
  tagline: { fontSize: 16, color: COLORS.gray400, textAlign: 'center', lineHeight: 24, marginBottom: 28 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryMid, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.primaryLight,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statVal: { fontSize: 20, fontWeight: '700', color: COLORS.accent },
  statLabel: { fontSize: 11, color: COLORS.gray500, marginTop: 2 },

  card: {
    marginHorizontal: 20, backgroundColor: COLORS.white,
    borderRadius: 24, padding: 24, gap: 14,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray900, marginBottom: 4 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.gray200,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: COLORS.gray50,
  },
  inputFocused: { borderColor: COLORS.accent, backgroundColor: COLORS.white },
  inputIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: 15, color: COLORS.gray900 },

  authBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  authBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  toggleBtn: { alignItems: 'center', paddingVertical: 4 },
  toggleText: { fontSize: 13, color: COLORS.gray500 },
  toggleLink: { color: COLORS.accent, fontWeight: '600' },

  footer: { textAlign: 'center', color: COLORS.gray600, fontSize: 12, marginTop: 24 },
});