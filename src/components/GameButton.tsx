import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radii, borders, typography } from '@theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'gold' | 'blue' | 'danger';
  style?: ViewStyle;
}

/** Chunky cartoon button that squashes on press, Clash Royale style. */
export function GameButton({ label, onPress, variant = 'gold', style }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={[styles.base, variantStyles[variant], animatedStyle, style]}
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 12, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 8, stiffness: 250 });
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radii.button,
    borderWidth: borders.width,
    borderColor: colors.outline,
    alignItems: 'center',
    // Bottom edge for a slight 3D bevel
    borderBottomWidth: borders.width + 3,
  },
  label: {
    ...typography.heading,
    color: colors.text,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
});

const variantStyles = StyleSheet.create({
  gold: { backgroundColor: colors.gold, borderBottomColor: colors.goldDeep },
  blue: { backgroundColor: colors.card, borderBottomColor: colors.backgroundDeep },
  danger: { backgroundColor: colors.danger, borderBottomColor: '#B02E2E' },
});
