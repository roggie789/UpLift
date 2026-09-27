import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { listExercises, type Exercise } from '@/repositories/exercises';
import { staleTimes } from '@/lib/queryClient';
import { GameCard } from './GameCard';
import { GameButton } from './GameButton';
import { GameTextInput } from './GameTextInput';
import { colors, spacing, typography } from '@theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
  /** Exercise ids to hide (already added) */
  excludeIds?: string[];
}
console.log('test');
/** Full-screen modal for choosing an exercise from the library. */
export function ExercisePicker({ visible, onClose, onPick, excludeIds = [] }: Props) {
  const [search, setSearch] = useState('');
  const exercises = useQuery({
    queryKey: ['exercises'],
    queryFn: listExercises,
    staleTime: staleTimes.exerciseLibrary,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (exercises.data ?? []).filter(
      (e) =>
        !excludeIds.includes(e.id) &&
        (q === '' || e.name.toLowerCase().includes(q) || e.muscle_group.toLowerCase().includes(q)),
    );
  }, [exercises.data, search, excludeIds]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <Text style={styles.title}>Pick an exercise</Text>
        <GameTextInput placeholder="Search name or muscle group" value={search} onChangeText={setSearch} />
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {exercises.isLoading ? 'Loading exercises...' : 'No exercises match.'}
            </Text>
          }
          renderItem={({ item }) => (
            <GameCard
              title={item.name}
              subtitle={`${item.muscle_group} · ${item.equipment}`}
              onPress={() => {
                onPick(item);
                setSearch('');
              }}
            />
          )}
        />
        <GameButton label="Close" variant="blue" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { ...typography.heading, color: colors.gold, textAlign: 'center', marginTop: spacing.lg },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
