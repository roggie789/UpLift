import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radii, borders, typography } from '@theme';

interface Props {
  current: number;
  needed: number;
  level: number;
}

/** XP progress bar that springs to its new fill amount. */
export function XPBar({ current, needed, level }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(Math.min(current / needed, 1), { damping: 16 });
  }, [current, needed, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.row}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>{level}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
        <Text style={styles.label}>
          {current} / {needed} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
    borderWidth: borders.width,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: { ...typography.heading, color: colors.outline },
  track: {
    flex: 1,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundDeep,
    borderWidth: borders.width,
    borderColor: colors.outline,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.xp,
    borderRadius: radii.pill,
  },
  label: {
    ...typography.body,
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '800',
  },
});
