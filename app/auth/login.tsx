import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoBox}><Text style={styles.logoIcon}>🛵</Text></View>
          <Text style={styles.appName}>RouteWise</Text>
          <Text style={styles.tagline}>Deliver smarter. Save fuel. Earn more.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>{isSignUp ? 'Create account' : 'Welcome back'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={COLORS.gray400}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.gray400}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button
            title={isSignUp ? 'Create account' : 'Sign in'}
            onPress={handleAuth}
            loading={loading}
          />
          <Text style={styles.toggle} onPress={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 24 },
  hero: { alignItems: 'center', gap: 10 },
  logoBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '700', color: COLORS.primary },
  tagline: { fontSize: 14, color: COLORS.gray500, textAlign: 'center' },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, borderWidth: 0.5, borderColor: COLORS.gray200, gap: 14 },
  heading: { fontSize: 18, fontWeight: '600', color: COLORS.gray900 },
  input: { borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.gray900 },
  toggle: { fontSize: 13, color: COLORS.accent, textAlign: 'center', marginTop: 4 },
});