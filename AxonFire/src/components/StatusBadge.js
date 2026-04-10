import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme';

/**
 * StatusBadge — Criticality badges used on alert cards.
 * @param {'critica' | 'alta' | 'media' | 'baja' | 'activa' | 'despachada' | 'progreso' | 'resuelta'} severity
 */
const BADGE_MAP = {
  critica: { bg: Colors.primary, text: Colors.onPrimary, label: 'CRÍTICA' },
  alta: { bg: Colors.tertiary, text: Colors.onTertiary, label: 'ALTA' },
  media: { bg: Colors.warningOrange, text: '#fff', label: 'MEDIA' },
  baja: { bg: Colors.surfaceContainerHighest, text: Colors.onSurface, label: 'BAJA' },
  activa: { bg: Colors.success, text: '#fff', label: 'Activa' },
  despachada: { bg: Colors.alertBlue, text: '#fff', label: 'Despachada' },
  progreso: { bg: Colors.tertiaryFixed, text: Colors.tertiary, label: 'En Progreso' },
  resuelta: { bg: Colors.surfaceContainerHighest, text: Colors.onSurfaceVariant, label: 'Resuelta' },
};

export default function StatusBadge({ severity, label }) {
  const config = BADGE_MAP[severity] || BADGE_MAP.media;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{label || config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
