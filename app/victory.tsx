import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveWorkout } from '@/stores/activeWorkout';
import { finishWorkout } from '@/repositories/workouts';
import { GameButton } from '@/components/GameButton';
import { colors, spacing, typography } from '@theme';

/**
 * Victory screen — chest opening Lottie animation slots in here later.
 * "Collect" fires the single batched finish_workout RPC.
 */
export default function VictoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const workout = useActiveWorkout();
  const prCount = workout.exercises.reduce(
    (n, e) => n + e.sets.reduce((m, s) => m + s.prs.length, 0),
    0,
  );

  const collect = useMutation({
    mutationFn: () =>
      finishWorkout({
        templateId: workout.templateId,
        startedAt: workout.startedAt!,
        exercises: workout.exercises.filter((e) => e.sets.length > 0),
        totalXp: workout.totalXp,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      workout.reset();
      router.replace('/');
    },
    onError: (error) =>
      Alert.alert('Could not save workout', `${error.message}\n\nYour sets are still here — try again.`),
  });

  const chestScale = useSharedValue(0);
  const chestStyle = useAnimatedStyle(() => ({ transform: [{ scale: chestScale.value }] }));

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    chestScale.value = withDelay(200, withSpring(1, { damping: 9 }));
  }, [chestScale]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>VICTORY!</Text>
      <Animated.Text style={[styles.chest, chestStyle]}>🎁</Animated.Text>
      <Text style={styles.xp}>+{workout.totalXp} XP</Text>
      {prCount > 0 ? <Text style={styles.pr}>🏅 {prCount} new record{prCount > 1 ? 's' : ''}!</Text> : null}
      <GameButton
        label={collect.isPending ? 'Saving...' : 'Collect & Go Home'}
        onPress={() => !collect.isPending && collect.mutate()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  title: { ...typography.display, color: colors.gold },
  chest: { fontSize: 96 },
  xp: { ...typography.bigNumber, color: colors.xp },
  pr: { ...typography.heading, color: colors.success },
});
