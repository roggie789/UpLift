import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, queryPersister } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@theme';

function RootNavigator() {
  const { session, isLoading } = useAuth();

  // Until the persisted session loads, render nothing (avoids a sign-in flash)
  if (isLoading) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.backgroundDeep },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '900' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" options={{ title: 'UpLift' }} />
        <Stack.Screen name="gym" options={{ title: 'Choose Your Battle' }} />
        <Stack.Screen name="template-builder" options={{ title: 'Build a Deck' }} />
        <Stack.Screen name="workout" options={{ title: 'Battle!', headerBackVisible: false }} />
        <Stack.Screen name="victory" options={{ title: 'Victory!', headerBackVisible: false }} />
        <Stack.Screen name="history" options={{ title: 'Battle Log' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
