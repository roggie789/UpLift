import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, queryPersister } from '@/lib/queryClient';
import { colors } from '@theme';

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.backgroundDeep },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '900' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'UpLift' }} />
        <Stack.Screen name="gym" options={{ title: 'Choose Your Battle' }} />
        <Stack.Screen name="workout" options={{ title: 'Battle!', headerBackVisible: false }} />
        <Stack.Screen name="victory" options={{ title: 'Victory!', headerBackVisible: false }} />
        <Stack.Screen name="history" options={{ title: 'Battle Log' }} />
      </Stack>
    </PersistQueryClientProvider>
  );
}
