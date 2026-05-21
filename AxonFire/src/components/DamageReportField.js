import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * DamageReportField — Conditional fields that appear when an item is marked as
 * damaged/missing. Requires a text justification and an optional photo.
 *
 * @param {boolean}  visible               Whether to render the fields
 * @param {string}   justification         Current justification text
 * @param {Function} onJustificationChange Callback when text changes
 * @param {string}   photoUri              URI of the selected photo
 * @param {Function} onPhotoSelected       Callback with the selected photo URI
 * @param {Function} onPhotoRemoved        Callback to remove the photo
 * @param {'dark'|'light'} theme           Visual theme variant
 */
export default function DamageReportField({
  visible,
  justification = '',
  onJustificationChange,
  theme = 'dark',
}) {
  if (!visible) return null;

  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const isDark = theme === 'dark';
  const themeStyles = isDark ? darkStyles : lightStyles;

  // Photo functionality removed as requested

  return (
    <View style={[styles.container, themeStyles.container]}>
      {/* Warning indicator */}
      <View style={styles.warningRow}>
        <MaterialCommunityIcons name="alert-circle" size={14} color="#fca5a5" />
        <Text style={styles.warningText}>JUSTIFICACIÓN REQUERIDA</Text>
      </View>

      {/* Text justification */}
      <TextInput
        style={[styles.textInput, themeStyles.textInput]}
        placeholder="Describir el daño, faltante o anomalía..."
        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        value={justification}
        onChangeText={onJustificationChange}
      />

      {/* Photo attachment removed */}

      {/* Validation status */}
      <View style={styles.validationRow}>
        <MaterialCommunityIcons
          name={justification.trim().length > 0 ? 'check-circle' : 'circle-outline'}
          size={14}
          color={justification.trim().length > 0 ? '#22c55e' : '#64748b'}
        />
        <Text style={[
          styles.validationText,
          { color: justification.trim().length > 0 ? '#22c55e' : '#64748b' }
        ]}>
          Texto {justification.trim().length > 0 ? 'completado' : 'pendiente'}
        </Text>

        {/* Photo validation removed */}
      </View>
    </View>
  );
}

/**
 * Helper to check if all damage report fields are complete.
 */
export function isDamageReportComplete(justification) {
  return justification?.trim().length > 0;
}

// ── Shared Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    padding: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  warningText: {
    color: '#fca5a5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  textInput: {
    borderRadius: 4,
    padding: 12,
    fontSize: 13,
    minHeight: 72,
    marginBottom: 10,
    borderWidth: 1,
  },
  // Removed photo styles
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  validationText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

// ── Dark Theme ───────────────────────────────────────────────────────────────

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#13141a',
    borderWidth: 1,
    borderColor: '#451a1a',
  },
  textInput: {
    backgroundColor: '#1b1d24',
    borderColor: '#334155',
    color: '#f8fafc',
  },
});

// ── Light Theme ──────────────────────────────────────────────────────────────

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    color: '#111d23',
  },
});
