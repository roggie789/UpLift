import React from 'react';
import { Pressable, View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radii, borders, spacing, typography } from '@theme';

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/** Rounded card with thick outline — the "deck card" building block. */
export function GameCard({ title, subtitle, icon, onPress, style, children }: Props) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.card, style]}>
      <View style={styles.header}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    borderWidth: borders.width,
    borderColor: colors.outline,
    borderBottomWidth: borders.width + 3,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { fontSize: 28 },
  title: { ...typography.heading, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
});
