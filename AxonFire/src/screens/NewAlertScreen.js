import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import LocationPicker from '../components/LocationPicker';

// ─── Componentes reutilizables (igual que antes) ──────────────────────────────
const InputField = ({ label, placeholder, value, onChangeText, multiline = false }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor="#52525b"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  </View>
);

const DropdownField = ({ label, value, onPress }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.dropdownWrapper} onPress={onPress}>
      <Text style={styles.dropdownValue}>{value}</Text>
      <MaterialCommunityIcons name="chevron-down" size={20} color="#a1a1aa" />
    </TouchableOpacity>
  </View>
);

// ─── Constantes ───────────────────────────────────────────────────────────────
const DEFAULT_LAT = -26.8083;
const DEFAULT_LNG = -65.2176;

const TIPOS_INCIDENTE = [
  { label: 'Incendio Estructural', id: '1' },
  { label: 'Incendio Forestal', id: '1' },
  { label: 'Rescate Vehicular', id: '2' },
  { label: 'Emergencia Médica', id: '3' },
  { label: 'Fuga de Gas', id: '3' },
  { label: 'Accidente Industrial', id: '1' },
];

const NIVELES_SEVERIDAD = [
  'NIVEL 1 - MENOR',
  'NIVEL 2 - MODERADO',
  'NIVEL 3 - ALTO',
  'NIVEL 4 - CRÍTICO',
  'NIVEL 5 - EXTREMO',
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function NewAlertScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const [formData, setFormData] = useState({
    type: 'Incendio Estructural',
    severity: 'NIVEL 4 - CRÍTICO',
    location: '',
    description: '',
    latitud: '',       // ← NUEVO: requerido por el contrato
    longitud: '',       // ← NUEVO: requerido por el contrato
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showSeverityPicker, setShowSeverityPicker] = useState(false);

  const parentState = navigation.getParent()?.getState();
  const isCurrentlyAdmin = parentState?.routeNames?.includes('Panel')
    || navigation.getState()?.routeNames?.includes('Panel')
    || false;

  const colorPrimario = isCurrentlyAdmin ? '#dc2626' : '#0284c7';

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleLocationSelect = ({ latitude, longitude, address }) => {
    updateForm('latitud', String(latitude));
    updateForm('longitud', String(longitude));
    if (address) {
      updateForm('location', address);
    }
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const submitAlertData = async () => {
    if (!formData.location) {
      Alert.alert('Error', 'Por favor completá la ubicación de la emergencia.');
      return;
    }

    let lat = parseFloat(formData.latitud);
    let lng = parseFloat(formData.longitud);

    // Si las coordenadas no están seteadas o falló antes, intentamos una geocodificación nativa de último momento
    if (isNaN(lat) || isNaN(lng)) {
      try {
        const geocoded = await Location.geocodeAsync(formData.location);
        if (geocoded && geocoded.length > 0) {
          lat = geocoded[0].latitude;
          lng = geocoded[0].longitude;
        }
      } catch (err) {
        console.warn('Geocodificación nativa final falló:', err);
      }
    }

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert(
        'Coordenadas requeridas',
        'No pudimos determinar las coordenadas para esa dirección. Tocá el mapa para seleccionar la ubicación exacta.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const selectedType = TIPOS_INCIDENTE.find(t => t.label === formData.type);
      const subCategoriaId = selectedType ? selectedType.id : '1';

      const body = {
        sub_categoria_alerta_id: subCategoriaId,
        ubicacion: formData.location,
        latitud: lat,             // ← NUEVO
        longitud: lng,             // ← NUEVO
        observaciones: `[${formData.severity}] - ${formData.description || 'Sin descripción'}`,
        destinatariosIds: [],          // se notifica a todos los activos
      };

      const response = await fetch(`${API_BASE_URL}/alerta/crear-con-notificacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al crear la alerta');

      Alert.alert('Despacho Confirmado', 'Las unidades de emergencia han sido notificadas.');
      setFormData({
        type: 'Incendio Estructural',
        severity: 'NIVEL 4 - CRÍTICO',
        location: '',
        description: '',
        latitud: '',
        longitud: '',
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear la alerta.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />

      {/* Header (igual que antes) */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>ALERTA</Text>
        </View>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerTitleBox}>
              <View style={[styles.redBorder, { backgroundColor: colorPrimario }]} />
            </View>

            <View style={styles.formContainer}>

              {/* Tipo e incidente (igual que antes) */}
              <DropdownField
                label="TIPO DE INCIDENTE"
                value={formData.type}
                onPress={() => setShowTypePicker(!showTypePicker)}
              />
              {showTypePicker && (
                <View style={styles.pickerContainer}>
                  {TIPOS_INCIDENTE.map(tipo => (
                    <TouchableOpacity
                      key={tipo.label}
                      style={styles.pickerOption}
                      onPress={() => { updateForm('type', tipo.label); setShowTypePicker(false); }}
                    >
                      <Text style={styles.pickerOptionText}>{tipo.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <DropdownField
                label="NIVEL DE SEVERIDAD"
                value={formData.severity}
                onPress={() => setShowSeverityPicker(!showSeverityPicker)}
              />
              {showSeverityPicker && (
                <View style={styles.pickerContainer}>
                  {NIVELES_SEVERIDAD.map(nivel => (
                    <TouchableOpacity
                      key={nivel}
                      style={styles.pickerOption}
                      onPress={() => { updateForm('severity', nivel); setShowSeverityPicker(false); }}
                    >
                      <Text style={styles.pickerOptionText}>{nivel}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Ubicación y coordenadas */}
              <LocationPicker
                initialLocation={
                  formData.latitud && formData.longitud
                    ? {
                        latitude: parseFloat(formData.latitud),
                        longitude: parseFloat(formData.longitud),
                      }
                    : undefined
                }
                initialAddress={formData.location}
                onLocationSelect={handleLocationSelect}
                mapHeight={350}
              />

              {/* Descripción (igual que antes) */}
              <InputField
                label="EVALUACIÓN INICIAL / DESCRIPCIÓN"
                placeholder="DETALLES TÁCTICOS DEL INCIDENTE..."
                value={formData.description}
                onChangeText={text => updateForm('description', text)}
                multiline
              />

              {/* Botón submit */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colorPrimario }]}
                onPress={submitAlertData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="alert-decagram" size={20} color="#fff" />
                    <Text style={styles.buttonText}>INICIAR PROTOCOLO DE DESPACHO</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom actions (igual que antes) */}
            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <MaterialCommunityIcons name="radio-handheld" size={16} color="#e2e8f0" />
                <Text style={styles.actionBtnText}>RADIO COMMS</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181d',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1a1c23',
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 24,
  },
  headerTitleBox: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  redBorder: {
    width: 3,
    marginRight: 12,
  },
  formContainer: {
    backgroundColor: '#1b1d24',
    padding: 24,
    borderRadius: 4,
  },

  // ── Inputs existentes ──────────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#26282f',
    borderRadius: 4,
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputWrapperMultiline: {
    height: 120,
    paddingTop: 16,
  },
  input: {
    color: '#e2e8f0',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputMultiline: {
    height: '100%',
  },
  dropdownWrapper: {
    backgroundColor: '#26282f',
    borderRadius: 4,
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: '#26282f',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1b1d24',
  },
  pickerOptionText: {
    color: '#e2e8f0',
    fontSize: 14,
  },

  // ── Botones y acciones ────────────────────────────────────────────────────
  primaryButton: {
    borderRadius: 4,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});