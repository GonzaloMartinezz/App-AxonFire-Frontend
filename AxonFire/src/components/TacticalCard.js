import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../theme';

/**
 * TacticalCard — Container card used across all screens.
 * No border lines; depth via tonal layering only.
 */
export default function TacticalCard({ children, style, elevated = false }) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  elevated: {
    boxShadow: '0px 4px 20px rgba(17,29,35,0.06)',
    elevation: 3,
  },
});
