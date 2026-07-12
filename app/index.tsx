import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/repositories/profile';
import { staleTimes } from '@/lib/queryClient';
import { GameButton } from '@/components/GameButton';
import { XPBar } from '@/components/XPBar';
import { levelFromTotalXp } from '@/features/gamification/engine';
import { colors, spacing, typography } from '@theme';

export default function HomeHub() {
  const router = useRouter();
  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: staleTimes.profile,
  });

  const { level, intoLevel, needed } = levelFromTotalXp(profile.data?.total_xp ?? 0);

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🏋️</Text>
        <Text style={styles.title}>{profile.data?.display_name ?? 'UpLift'}</Text>
        <Text style={styles.subtitle}>Every rep makes you stronger.</Text>
      </View>

      <XPBar current={intoLevel} needed={needed} level={level} />

      <View style={styles.actions}>
        <GameButton label="⚔️  BATTLE" onPress={() => router.push('/gym')} />
        <GameButton label="📜  Battle Log" variant="blue" onPress={() => router.push('/history')} />
        <GameButton label="Sign out" variant="danger" onPress={() => supabase.auth.signOut()} />
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
