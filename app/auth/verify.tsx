import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();

  function handleChange(val: string, idx: number) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length !== 6) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
  email: email!,
  token: code,
  type: 'email',
});
    setLoading(false);
    if (error) {
      Alert.alert('Wrong OTP', 'Please check the code and try again.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      return;
    }
    // Auth hook will detect the session and redirect automatically
  }

  async function handleResend() {
  await supabase.auth.signInWithOtp({ email: email! });
  Alert.alert('Sent!', 'A new OTP has been sent to your email.');
}

  const code = otp.join('');

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.iconBox}>
            <Text style={{ fontSize: 36 }}>💬</Text>
          </View>
          <Text style={styles.heading}>Verify your number</Text>
          <Text style={styles.sub}>
            Enter the 6-digit OTP sent to{'\n'}
            <Text style={styles.phone}>{email}</Text>
          </Text>
        </View>

        {/* OTP boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              textContentType="oneTimeCode"
            />
          ))}
        </View>

        <Button
          title="Verify & Continue"
          onPress={handleVerify}
          loading={loading}
          disabled={code.length !== 6}
          style={styles.btn}
        />

        <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
          <Text style={styles.resendText}>Didn't receive it? <Text style={styles.resendLink}>Resend OTP</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  container: { flex: 1, padding: 24, gap: 28 },
  back: { paddingTop: 20 },
  backText: { fontSize: 15, color: COLORS.accent, fontWeight: '500' },
  hero: { alignItems: 'center', gap: 12, marginTop: 20 },
  iconBox: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: COLORS.accentLight, alignItems: 'center', justifyContent: 'center',
  },
  heading: { fontSize: 22, fontWeight: '700', color: COLORS.gray900 },
  sub: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', lineHeight: 20 },
  phone: { color: COLORS.gray900, fontWeight: '600' },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  otpBox: {
    width: 48, height: 56, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.gray200,
    textAlign: 'center', fontSize: 22, fontWeight: '600',
    color: COLORS.gray900, backgroundColor: COLORS.white,
  },
  otpBoxFilled: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  btn: { marginTop: 4 },
  resendBtn: { alignItems: 'center' },
  resendText: { fontSize: 13, color: COLORS.gray500 },
  resendLink: { color: COLORS.accent, fontWeight: '500' },
});
