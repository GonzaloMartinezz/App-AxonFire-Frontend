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
import * as ImagePicker from 'expo-image-picker';

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
  photoUri,
  onPhotoSelected,
  onPhotoRemoved,
  theme = 'dark',
}) {
  if (!visible) return null;

  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const isDark = theme === 'dark';
  const themeStyles = isDark ? darkStyles : lightStyles;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') {
        alert('Se necesita acceso a la galería para adjuntar fotos.');
      } else {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para adjuntar fotos.');
      }
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      onPhotoSelected?.(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') {
        alert('Se necesita acceso a la cámara para tomar fotos.');
      } else {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar fotos.');
      }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      onPhotoSelected?.(result.assets[0].uri);
    }
  };

  const handleAttach = () => {
    if (Platform.OS === 'web') {
      pickImage();
      return;
    }
    Alert.alert(
      'Adjuntar Evidencia',
      'Seleccioná el origen de la imagen',
      [
        { text: 'Cámara', onPress: takePhoto },
        { text: 'Galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

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

      {/* Photo attachment */}
      {!photoUri ? (
        <TouchableOpacity
          style={[styles.attachButton, themeStyles.attachButton]}
          onPress={handleAttach}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="camera-plus" size={18} color="#fca5a5" />
          <Text style={styles.attachText}>ADJUNTAR EVIDENCIA FOTOGRÁFICA</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          <TouchableOpacity
            style={styles.removePhotoBtn}
            onPress={onPhotoRemoved}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close-circle" size={24} color="#dc2626" />
          </TouchableOpacity>
          <View style={styles.photoOkBadge}>
            <MaterialCommunityIcons name="check" size={12} color="#fff" />
            <Text style={styles.photoOkText}>EVIDENCIA</Text>
          </View>
        </View>
      )}

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

        <View style={{ width: 16 }} />

        <MaterialCommunityIcons
          name={photoUri ? 'check-circle' : 'circle-outline'}
          size={14}
          color={photoUri ? '#22c55e' : '#64748b'}
        />
        <Text style={[
          styles.validationText,
          { color: photoUri ? '#22c55e' : '#64748b' }
        ]}>
          Foto {photoUri ? 'adjunta' : 'pendiente'}
        </Text>
      </View>
    </View>
  );
}

/**
 * Helper to check if all damage report fields are complete.
 */
export function isDamageReportComplete(justification, photoUri) {
  return justification?.trim().length > 0 && !!photoUri;
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
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  attachText: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  photoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 6,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  photoOkBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  photoOkText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
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
  attachButton: {
    borderColor: '#451a1a',
    backgroundColor: '#1b1d24',
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
  attachButton: {
    borderColor: '#fecaca',
    backgroundColor: '#ffffff',
  },
});
