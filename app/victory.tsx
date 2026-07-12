import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useActiveWorkout } from '@/stores/activeWorkout';
import { GameButton } from '@/components/GameButton';
import { colors, spacing, typography } from '@theme';

/**
 * Victory screen — chest opening Lottie animation slots in here later.
 * Finishing triggers the single batched finish_workout RPC (once Supabase is wired).
 */
export default function VictoryScreen() {
  const router = useRouter();
  const workout = useActiveWorkout();
  const prCount = workout.exercises.reduce(
    (n, e) => n + e.sets.reduce((m, s) => m + s.prs.length, 0),
    0,
  );

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
        label="Collect & Go Home"
        onPress={() => {
          // TODO: call finishWorkout(...) repository RPC here once Supabase is configured
          workout.reset();
          router.replace('/');
        }}
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
