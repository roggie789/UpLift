import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { listSessions } from '@/repositories/workouts';
import { staleTimes } from '@/lib/queryClient';
import { GameCard } from '@/components/GameCard';
import { colors, spacing, typography } from '@theme';

export default function HistoryScreen() {
  const sessions = useQuery({
    queryKey: ['sessions'],
    queryFn: () => listSessions(),
    staleTime: staleTimes.history,
  });

  return (
    <View style={styles.screen}>
      <FlatList
        data={sessions.data ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ gap: spacing.md }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {sessions.isLoading ? 'Loading battle log...' : 'No battles fought yet. Go lift!'}
          </Text>
        }
        renderItem={({ item }) => (
          <GameCard
            icon="⚔️"
            title={new Date(item.started_at).toLocaleDateString()}
            subtitle={`+${item.total_xp} XP`}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
