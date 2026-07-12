import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useActiveWorkout, type ActiveExercise } from '@/stores/activeWorkout';
import { getTemplate } from '@/repositories/templates';
import { getWorkoutPrep } from '@/repositories/workouts';
import { GameCard } from '@/components/GameCard';
import { GameButton } from '@/components/GameButton';
import { GameTextInput } from '@/components/GameTextInput';
import { ExercisePicker } from '@/components/ExercisePicker';
import { colors, spacing, typography } from '@theme';

/**
 * Active workout screen. Set logging is entirely local (Zustand) —
 * zero API calls between the initial load and hitting FINISH.
 */
export default function WorkoutScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const workout = useActiveWorkout();
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (workout.startedAt) return;

    async function begin() {
      if (!templateId) {
        workout.start({ templateId: null, exercises: [], bests: {} });
        return;
      }
      setLoading(true);
      try {
        const template = await getTemplate(templateId);
        const ordered = [...template.exercises].sort((a, b) => a.order_index - b.order_index);
        const prep = await getWorkoutPrep(ordered.map((e) => e.exercise_id));
        const exercises: ActiveExercise[] = ordered.map((e) => ({
          exerciseId: e.exercise_id,
          name: e.exercise.name,
          targetSets: e.default_sets,
          targetReps: e.target_reps,
          lastSession: prep.lastSession[e.exercise_id],
          sets: [],
        }));
        workout.start({ templateId, exercises, bests: prep.bests });
      } catch {
        workout.start({ templateId, exercises: [], bests: {} });
      } finally {
        setLoading(false);
      }
    }
    begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSets = workout.exercises.some((e) => e.sets.length > 0);

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.empty}>Preparing your battle...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.xpTally}>⚡ {workout.totalXp} XP this battle</Text>

      <FlatList
        data={workout.exercises}
        keyExtractor={(e) => e.exerciseId}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <Text style={styles.empty}>Freestyle mode — add your first exercise below.</Text>
        }
        renderItem={({ item }) => <ExerciseCard exerciseId={item.exerciseId} />}
      />

      <View style={styles.footer}>
        <GameButton label="＋  Add exercise" variant="blue" onPress={() => setPickerOpen(true)} />
        <GameButton
          label="🏆  FINISH WORKOUT"
          onPress={() => {
            if (hasSets) {
              router.replace('/victory');
            } else {
              workout.reset();
              router.back();
            }
          }}
        />
      </View>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={workout.exercises.map((e) => e.exerciseId)}
        onPick={async (exercise) => {
          setPickerOpen(false);
          // Fetch bests + last-session placeholders for the picked exercise
          const prep = await getWorkoutPrep([exercise.id]).catch(() => null);
          workout.addExercise(
            {
              exerciseId: exercise.id,
              name: exercise.name,
              targetSets: 3,
              targetReps: 8,
              lastSession: prep?.lastSession[exercise.id],
              sets: [],
            },
            prep?.bests[exercise.id],
          );
        }}
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
    <GameCard title={exercise.name} subtitle={`${exercise.sets.length}/${exercise.targetSets} sets · target ${exercise.targetReps} reps`}>
      {exercise.sets.map((s) => (
        <Text key={s.setNumber} style={styles.setRow}>
          Set {s.setNumber}: {s.weightKg}kg x {s.reps}  (+{s.xp} XP{s.prs.length ? ' 🏅 PR!' : ''})
        </Text>
      ))}
      <View style={styles.inputRow}>
        <GameTextInput
          style={styles.input}
          placeholder={last ? `${last.weightKg}kg` : 'kg'}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <GameTextInput
          style={styles.input}
          placeholder={last ? `${last.reps} reps` : 'reps'}
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
  center: { alignItems: 'center', justifyContent: 'center' },
  xpTally: { ...typography.heading, color: colors.gold, textAlign: 'center' },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  setRow: { ...typography.body, color: colors.text },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: { flex: 1 },
  footer: { gap: spacing.sm },
});
