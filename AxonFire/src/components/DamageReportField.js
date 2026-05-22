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
 * damaged/missing. Requires a text justification and an optional/recommended photo.
 *
 * @param {boolean}  visible               Whether to render the fields
 * @param {string}   justification         Current justification text
 * @param {Function} onJustificationChange Callback when text changes
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

  // Local state for photo URI (frontend-only mock, as backend schema doesn't persist photos yet)
  const [photoUri, setPhotoUri] = useState(null);

  const handleTakeNewPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Denegado',
          'Se necesita acceso a la cámara para tomar registros fotográficos de los daños.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error launching camera:', err);
      Alert.alert('Error', 'No se pudo abrir la cámara.');
    }
  };

  const handleSelectFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Denegado',
          'Se necesita acceso a la galería para seleccionar registros fotográficos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error launching library:', err);
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const handleRemovePhoto = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPhotoUri(null);
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

      {/* Camera and Gallery Actions */}
      {!photoUri ? (
        <View style={styles.photoActionsRow}>
          <TouchableOpacity
            style={[styles.photoButton, themeStyles.photoButton]}
            onPress={handleTakeNewPhoto}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="camera" size={16} color={isDark ? '#fca5a5' : '#dc2626'} />
            <Text style={[styles.photoButtonText, themeStyles.photoButtonText]}>TOMAR FOTO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.photoButton, themeStyles.photoButton]}
            onPress={handleSelectFromLibrary}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="image-multiple" size={16} color={isDark ? '#94a3b8' : '#475569'} />
            <Text style={[styles.photoButtonText, themeStyles.photoButtonText]}>GALERÍA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <View style={styles.previewOverlay}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleRemovePhoto}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Validation status */}
      <View style={styles.validationRow}>
        <View style={styles.validationItem}>
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
        </View>

        <View style={styles.validationItem}>
          <MaterialCommunityIcons
            name={photoUri ? 'check-circle' : 'circle-outline'}
            size={14}
            color={photoUri ? '#22c55e' : '#64748b'}
          />
          <Text style={[
            styles.validationText,
            { color: photoUri ? '#22c55e' : '#64748b' }
          ]}>
            Foto {photoUri ? 'adjuntada' : 'opcional'}
          </Text>
        </View>
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
    borderRadius: 8,
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
    borderRadius: 6,
    padding: 12,
    fontSize: 13,
    minHeight: 72,
    marginBottom: 12,
    borderWidth: 1,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  photoButtonText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  previewContainer: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  photoButton: {
    backgroundColor: '#1b1d24',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  photoButtonText: {
    color: '#94a3b8',
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
  photoButton: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  photoButtonText: {
    color: '#475569',
  },
});
