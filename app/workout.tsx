import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useActiveWorkout } from '@/stores/activeWorkout';
import { GameCard } from '@/components/GameCard';
import { GameButton } from '@/components/GameButton';
import { colors, radii, borders, spacing, typography } from '@theme';

/**
 * Active workout screen. Set logging is entirely local (Zustand) —
 * zero API calls until the user hits FINISH.
 */
export default function WorkoutScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const workout = useActiveWorkout();

  useEffect(() => {
    if (!workout.startedAt) {
      // TODO: load template exercises + bests from cache/Supabase when templateId is set
      workout.start({ templateId: templateId ?? null, exercises: [], bests: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.xpTally}>⚡ {workout.totalXp} XP this battle</Text>

      <FlatList
        data={workout.exercises}
        keyExtractor={(e) => e.exerciseId}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Freestyle mode — exercise picker coming next. (Template loading lands with Supabase wiring.)
          </Text>
        }
        renderItem={({ item }) => <ExerciseCard exerciseId={item.exerciseId} />}
      />

      <GameButton
        label="🏆  FINISH WORKOUT"
        onPress={() => router.replace('/victory')}
      />
    </View>
  );
}

function ExerciseCard({ exerciseId }: { exerciseId: string }) {
  const workout = useActiveWorkout();
  const exercise = workout.exercises.find((e) => e.exerciseId === exerciseId)!;
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const last = exercise.lastSession?.[exercise.sets.length];

  return (
    <GameCard title={exercise.name} subtitle={`${exercise.sets.length}/${exercise.targetSets} sets`}>
      {exercise.sets.map((s) => (
        <Text key={s.setNumber} style={styles.setRow}>
          Set {s.setNumber}: {s.weightKg}kg x {s.reps}  (+{s.xp} XP{s.prs.length ? ' 🏅 PR!' : ''})
        </Text>
      ))}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={last ? `${last.weightKg}kg` : 'kg'}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput
          style={styles.input}
          placeholder={last ? `${last.reps} reps` : 'reps'}
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={reps}
          onChangeText={setReps}
        />
        <GameButton
          label="✓"
          onPress={() => {
            const w = parseFloat(weight);
            const r = parseInt(reps, 10);
            if (!isNaN(w) && !isNaN(r)) {
              workout.logSet(exerciseId, { weightKg: w, reps: r });
              setWeight('');
              setReps('');
            }
          }}
        />
      </View>
    </GameCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.md },
  xpTally: { ...typography.heading, color: colors.gold, textAlign: 'center' },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  setRow: { ...typography.body, color: colors.text },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
    borderRadius: radii.button,
    borderWidth: borders.width,
    borderColor: colors.outline,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body,
  },
});
