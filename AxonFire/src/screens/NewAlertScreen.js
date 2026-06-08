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
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

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

export default function NewAlertScreen({ navigation }) {
  const [formData, setFormData] = useState({
    type: 'Incendio Estructural',
    severity: 'NIVEL 4 - CRÍTICO',
    location: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showSeverityPicker, setShowSeverityPicker] = useState(false);
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const parentState = navigation.getParent()?.getState();
  const isCurrentlyAdmin = parentState?.routeNames?.includes('Panel') || navigation.getState()?.routeNames?.includes('Panel') || false;

  const tiposIncidente = [
    { label: 'Incendio Estructural', id: '1' },
    { label: 'Incendio Forestal', id: '1' },
    { label: 'Rescate Vehicular', id: '2' },
    { label: 'Emergencia Médica', id: '3' },
    { label: 'Fuga de Gas', id: '3' },
    { label: 'Accidente Industrial', id: '1' }
  ];

  const nivelesSeveridad = [
    'NIVEL 1 - MENOR',
    'NIVEL 2 - MODERADO',
    'NIVEL 3 - ALTO',
    'NIVEL 4 - CRÍTICO',
    'NIVEL 5 - EXTREMO'
  ];

  const updateForm = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleGeoLocate = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la ubicación para geolocalizar la alerta.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const coords = `${location.coords.latitude}, ${location.coords.longitude}`;
      updateForm('location', coords);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual.');
    } finally {
      setIsLocating(false);
    }
  };

  const submitAlertData = async () => {
    if (!formData.location) {
      Alert.alert('Error', 'Por favor completa la ubicación de la emergencia.');
      return;
    }

    setIsLoading(true);

    try {
      const selectedType = tiposIncidente.find(t => t.label === formData.type);
      const subCategoriaId = selectedType ? selectedType.id : '1';

      const response = await fetch(`${API_BASE_URL}/alerta/crear-con-notificacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sub_categoria_alerta_id: subCategoriaId,
          ubicacion: formData.location,
          observaciones: `[${formData.severity}] - ${formData.description || 'Sin descripción'}`,
          usuario_alta_alerta: user?.id || 'abc1'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la alerta');
      }

      Alert.alert('Despacho Confirmado', 'Las unidades de emergencia han sido notificadas.');
      setFormData({
        type: 'Incendio Estructural',
        severity: 'NIVEL 4 - CRÍTICO',
        location: '',
        description: '',
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear la alerta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />

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
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerTitleBox}>
              <View style={[styles.redBorder, { backgroundColor: isCurrentlyAdmin ? '#dc2626' : '#0284c7' }]} />
            </View>

            <View style={styles.formContainer}>
              <DropdownField
                label="TIPO DE INCIDENTE"
                value={formData.type}
                onPress={() => setShowTypePicker(!showTypePicker)}
              />

              {showTypePicker && (
                <View style={styles.pickerContainer}>
                  {tiposIncidente.map((tipo) => (
                    <TouchableOpacity
                      key={tipo.label}
                      style={styles.pickerOption}
                      onPress={() => {
                        updateForm('type', tipo.label);
                        setShowTypePicker(false);
                      }}
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
                  {nivelesSeveridad.map((nivel) => (
                    <TouchableOpacity
                      key={nivel}
                      style={styles.pickerOption}
                      onPress={() => {
                        updateForm('severity', nivel);
                        setShowSeverityPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{nivel}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <InputField
                label="UBICACIÓN EXACTA"
                placeholder="COODENADAS O DIRECCIÓN..."
                value={formData.location}
                onChangeText={(text) => updateForm('location', text)}
              />

              <InputField
                label="EVALUACIÓN INICIAL / DESCRIPCIÓN"
                placeholder="DETALLES TÁCTICOS DEL INCIDENTE..."
                value={formData.description}
                onChangeText={(text) => updateForm('description', text)}
                multiline={true}
              />

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: isCurrentlyAdmin ? '#dc2626' : '#0284c7' }]}
                onPress={submitAlertData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="alert-decagram" size={20} color="#fff" />
                    <Text style={styles.buttonText}>INICIAR PROTOCOLO DE DESPACHO</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

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
    backgroundColor: '#dc2626',
    marginRight: 12,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  formContainer: {
    backgroundColor: '#1b1d24',
    padding: 24,
    borderRadius: 4,
  },
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
  primaryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
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
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#334155',
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
  roleBreadcrumb: {
    height: 24,
    backgroundColor: '#1b1d24',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
    marginTop: 6,
    borderRadius: 2,
  },
  roleBreadcrumbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  roleBreadcrumbText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1.2,
  },
});