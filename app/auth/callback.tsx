import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useAuth } from '@/features/auth/AuthProvider';
import { createSessionFromUrl } from '@/lib/authRedirect';
import { colors, spacing, typography } from '@theme';

/**
 * Landing route for Supabase email-confirmation links.
 * Supabase redirects here with access/refresh tokens in the URL hash.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams();

  useEffect(() => {
    async function confirm() {
      const url = await Linking.getInitialURL();
      if (url?.includes('access_token')) {
        try {
          await createSessionFromUrl(url);
          return;
        } catch (error) {
          console.error('Email confirmation failed:', error);
        }
      }
      // Tokens may already have been consumed by AuthProvider's listener
      if (!session) router.replace('/sign-in');
    }
    confirm();
  }, [params, router, session]);

  if (session) return <Redirect href="/" />;

  return (
    <View style={styles.screen}>
      <ActivityIndicator color={colors.gold} size="large" />
      <Text style={styles.text}>Confirming your account...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  text: { ...typography.body, color: colors.textMuted },
});
