import React from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors, radii, borders, spacing, typography } from '@theme';

/** Text input matching the chunky cartoon design system. */
export function GameTextInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, props.style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.backgroundDeep,
    borderRadius: radii.button,
    borderWidth: borders.width,
    borderColor: colors.outline,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...typography.body,
  },
});
