import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTemplate } from '@/repositories/templates';
import type { Exercise } from '@/repositories/exercises';
import { GameButton } from '@/components/GameButton';
import { GameCard } from '@/components/GameCard';
import { GameTextInput } from '@/components/GameTextInput';
import { ExercisePicker } from '@/components/ExercisePicker';
import { colors, radii, borders, spacing, typography } from '@theme';

const ICONS = ['💪', '🏋️', '🦵', '🔥', '⚡', '🛡️', '🐻', '🦍'];

interface DraftExercise {
  exercise: Exercise;
  defaultSets: number;
  targetReps: number;
}

export default function TemplateBuilderScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [draft, setDraft] = useState<DraftExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      createTemplate({
        name: name.trim(),
        icon,
        exercises: draft.map((d) => ({
          exerciseId: d.exercise.id,
          defaultSets: d.defaultSets,
          targetReps: d.targetReps,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      router.back();
    },
    onError: (error) => Alert.alert('Could not save deck', error.message),
  });

  const canSave = name.trim().length > 0 && draft.length > 0 && !save.isPending;

  function updateDraft(id: string, patch: Partial<Pick<DraftExercise, 'defaultSets' | 'targetReps'>>) {
    setDraft((d) => d.map((e) => (e.exercise.id === id ? { ...e, ...patch } : e)));
  }

  return (
    <View style={styles.screen}>
      <GameTextInput placeholder="Deck name (e.g. Push Day)" value={name} onChangeText={setName} />

      <View style={styles.iconRow}>
        {ICONS.map((i) => (
          <Pressable
            key={i}
            style={[styles.iconChoice, icon === i && styles.iconChosen]}
            onPress={() => setIcon(i)}
          >
            <Text style={styles.iconText}>{i}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={draft}
        keyExtractor={(d) => d.exercise.id}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.md }}
        ListEmptyComponent={
          <Text style={styles.empty}>Add exercises to build your deck.</Text>
        }
        renderItem={({ item }) => (
          <GameCard title={item.exercise.name} subtitle={item.exercise.muscle_group}>
            <View style={styles.stepperRow}>
              <Stepper
                label="Sets"
                value={item.defaultSets}
                min={1}
                onChange={(v) => updateDraft(item.exercise.id, { defaultSets: v })}
              />
              <Stepper
                label="Reps"
                value={item.targetReps}
                min={1}
                onChange={(v) => updateDraft(item.exercise.id, { targetReps: v })}
              />
              <GameButton
                label="✕"
                variant="danger"
                onPress={() => setDraft((d) => d.filter((e) => e.exercise.id !== item.exercise.id))}
              />
            </View>
          </GameCard>
        )}
      />

      <View style={styles.footer}>
        <GameButton label="＋  Add exercise" variant="blue" onPress={() => setPickerOpen(true)} />
        <GameButton
          label={save.isPending ? 'Saving...' : '💾  SAVE DECK'}
          onPress={() => canSave && save.mutate()}
        />
      </View>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={draft.map((d) => d.exercise.id)}
        onPick={(exercise) => {
          setDraft((d) => [...d, { exercise, defaultSets: 3, targetReps: 8 }]);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

function Stepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepperButton} onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={styles.stepperButtonText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable style={styles.stepperButton} onPress={() => onChange(value + 1)}>
          <Text style={styles.stepperButtonText}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.md },
  iconRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  iconChoice: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    borderWidth: borders.width,
    borderColor: colors.outline,
    backgroundColor: colors.backgroundDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChosen: { backgroundColor: colors.gold },
  iconText: { fontSize: 22 },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  stepperRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  stepper: { flex: 1, gap: 4 },
  stepperLabel: { ...typography.body, color: colors.textMuted, fontSize: 12 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: radii.button,
    borderWidth: borders.width,
    borderColor: colors.outline,
    backgroundColor: colors.backgroundDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { ...typography.heading, color: colors.gold },
  stepperValue: { ...typography.heading, color: colors.text, minWidth: 28, textAlign: 'center' },
  footer: { gap: spacing.sm },
});
