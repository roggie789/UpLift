import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listTemplates } from '@/repositories/templates';
import { staleTimes } from '@/lib/queryClient';
import { GameCard } from '@/components/GameCard';
import { GameButton } from '@/components/GameButton';
import { colors, spacing, typography } from '@theme';

export default function GymScreen() {
  const router = useRouter();
  const templates = useQuery({
    queryKey: ['templates'],
    queryFn: listTemplates,
    staleTime: staleTimes.templates,
  });

  return (
    <View style={styles.screen}>
      <FlatList
        data={templates.data ?? []}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {templates.isLoading ? 'Loading decks...' : 'No decks yet — build your first template!'}
          </Text>
        }
        renderItem={({ item }) => (
          <GameCard
            icon={item.icon}
            title={item.name}
            subtitle="Tap to start this battle"
            onPress={() => router.push({ pathname: '/workout', params: { templateId: item.id } })}
          />
        )}
      />
      <View style={styles.footer}>
        <GameButton label="🃏  Freestyle Battle" variant="blue" onPress={() => router.push('/workout')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  footer: { paddingTop: spacing.md },
});
