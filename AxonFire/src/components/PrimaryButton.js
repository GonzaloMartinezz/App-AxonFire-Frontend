import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../theme';

/**
 * PrimaryButton — Gradient fill from primary → primaryContainer.
 * "Machined" feel with the signature texture.
 */
export default function PrimaryButton({
  title,
  onPress,
  icon,
  iconFamily = 'MaterialCommunityIcons',
  style,
  fullWidth = true,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost'
}) {
  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        style={[styles.secondary, fullWidth && styles.fullWidth, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon && (
          <MaterialCommunityIcons name={icon} size={20} color={Colors.onSurface} style={styles.icon} />
        )}
        <Text style={styles.secondaryText}>{title}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        style={[styles.ghost, fullWidth && styles.fullWidth, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon && (
          <MaterialCommunityIcons name={icon} size={20} color={Colors.onSurfaceVariant} style={styles.icon} />
        )}
        <Text style={styles.ghostText}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <LinearGradient
        colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        {icon && (
          <MaterialCommunityIcons name={icon} size={22} color={Colors.onPrimary} style={styles.icon} />
        )}
        <Text style={styles.primaryText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
  },
  fullWidth: {
    width: '100%',
  },
  primaryText: {
    color: Colors.onPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  secondaryText: {
    color: Colors.onSurface,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
