import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { GameButton } from '@/components/GameButton';
import { GameTextInput } from '@/components/GameTextInput';
import { colors, spacing, typography } from '@theme';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Sign in failed', error.message);
    // On success the auth listener flips the route guard automatically.
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🏋️</Text>
        <Text style={styles.title}>UpLift</Text>
        <Text style={styles.subtitle}>Ready to battle?</Text>
      </View>

      <View style={styles.form}>
        <GameTextInput
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <GameTextInput
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />
        <GameButton label={loading ? 'Signing in...' : '⚔️  SIGN IN'} onPress={signIn} />
        <GameButton
          label="New here? Create account"
          variant="blue"
          onPress={() => router.push('/sign-up')}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  hero: { alignItems: 'center', gap: spacing.sm },
  heroEmoji: { fontSize: 72 },
  title: { ...typography.display, color: colors.gold },
  subtitle: { ...typography.body, color: colors.textMuted },
  form: { gap: spacing.md },
});
