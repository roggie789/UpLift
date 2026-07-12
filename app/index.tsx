import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GameButton } from '@/components/GameButton';
import { XPBar } from '@/components/XPBar';
import { levelFromTotalXp } from '@/features/gamification/engine';
import { colors, spacing, typography } from '@theme';

export default function HomeHub() {
  const router = useRouter();
  // TODO: replace with profile query once Supabase auth is wired up
  const { level, intoLevel, needed } = levelFromTotalXp(0);

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🏋️</Text>
        <Text style={styles.title}>UpLift</Text>
        <Text style={styles.subtitle}>Every rep makes you stronger.</Text>
      </View>

      <XPBar current={intoLevel} needed={needed} level={level} />

      <View style={styles.actions}>
        <GameButton label="⚔️  BATTLE" onPress={() => router.push('/gym')} />
        <GameButton label="📜  Battle Log" variant="blue" onPress={() => router.push('/history')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.xl, justifyContent: 'center' },
  hero: { alignItems: 'center', gap: spacing.sm },
  heroEmoji: { fontSize: 72 },
  title: { ...typography.display, color: colors.gold },
  subtitle: { ...typography.body, color: colors.textMuted },
  actions: { gap: spacing.md },
});
