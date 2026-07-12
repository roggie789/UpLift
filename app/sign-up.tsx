import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getAuthRedirectUri } from '@/lib/authRedirect';
import { GameButton } from '@/components/GameButton';
import { GameTextInput } from '@/components/GameTextInput';
import { colors, spacing, typography } from '@theme';

export default function SignUpScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUp() {
    if (!email || !password) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() || 'Lifter' },
        emailRedirectTo: getAuthRedirectUri(),
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    if (!data.session) {
      // Email confirmation is enabled on the project
      Alert.alert('Check your email', 'Confirm your address, then sign in to start battling.');
      router.back();
    }
    // If confirmation is disabled, a session exists and the route guard takes over.
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🛡️</Text>
        <Text style={styles.title}>Create your lifter</Text>
        <Text style={styles.subtitle}>Level 1. Infinite potential.</Text>
      </View>

      <View style={styles.form}>
        <GameTextInput
          placeholder="Display name"
          autoCapitalize="words"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <GameTextInput
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <GameTextInput
          placeholder="Password (min 6 characters)"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />
        <GameButton label={loading ? 'Creating...' : '🛡️  CREATE ACCOUNT'} onPress={signUp} />
        <GameButton label="Back to sign in" variant="blue" onPress={() => router.back()} />
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
  title: { ...typography.display, color: colors.gold, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textMuted },
  form: { gap: spacing.md },
});
