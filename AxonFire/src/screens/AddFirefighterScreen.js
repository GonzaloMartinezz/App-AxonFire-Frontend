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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';

const InputField = ({ label, icon, placeholder, value, onChangeText, keyboardType = 'default' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <MaterialCommunityIcons name={icon} size={20} color="#90a4ae" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#455a64"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="sentences"
      />
    </View>
  </View>
);

export default function AddFirefighterScreen() {
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    contactoEmergencia: '',
    rango: 'Aspirante',
    grupoSanguineo: 'O+',
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateForm = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const submitFirefighterData = () => {
    if (!formData.dni || !formData.nombres || !formData.apellidos) {
      Alert.alert('Datos Incompletos', 'DNI, Nombres y Apellidos son obligatorios para el registro táctico.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Registro Exitoso', 'La ficha del bombero ha sido cargada en el sistema AXON.');
      setFormData({
        dni: '', nombres: '', apellidos: '', telefono: '', 
        contactoEmergencia: '', rango: 'Aspirante', grupoSanguineo: 'O+'
      });
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a0f12' }]} />
      <View style={[styles.glow, styles.redGlow]} />
      <View style={[styles.glow, styles.blueGlow]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>ALTA DE PERSONAL</Text>
              <Text style={styles.headerSubtitle}>FICHA TÉCNICA OPERATIVA AXON-24</Text>
            </View>

            <View style={styles.card}>
              <InputField
                label="DNI / IDENTIFICACIÓN"
                icon="card-account-details-outline"
                placeholder="12345678"
                keyboardType="numeric"
                value={formData.dni}
                onChangeText={(text) => updateForm('dni', text)}
              />

              <InputField
                label="NOMBRES"
                icon="account-outline"
                placeholder="Nombres completos"
                value={formData.nombres}
                onChangeText={(text) => updateForm('nombres', text)}
              />

              <InputField
                label="APELLIDOS"
                icon="identifier"
                placeholder="Apellidos"
                value={formData.apellidos}
                onChangeText={(text) => updateForm('apellidos', text)}
              />

              <InputField
                label="TELÉFONO"
                icon="phone-outline"
                placeholder="+54 9..."
                keyboardType="phone-pad"
                value={formData.telefono}
                onChangeText={(text) => updateForm('telefono', text)}
              />

              <Text style={styles.label}>JERARQUÍA / RANGO</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.rango}
                  onValueChange={(itemValue) => updateForm('rango', itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#fff"
                >
                  <Picker.Item label="Aspirante" value="Aspirante" color="#000" />
                  <Picker.Item label="Bombero" value="Bombero" color="#000" />
                  <Picker.Item label="Cabo" value="Cabo" color="#000" />
                  <Picker.Item label="Sargento" value="Sargento" color="#000" />
                  <Picker.Item label="Oficial" value="Oficial" color="#000" />
                </Picker>
              </View>

              <Text style={styles.label}>GRUPO SANGUÍNEO</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.grupoSanguineo}
                  onValueChange={(itemValue) => updateForm('grupoSanguineo', itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#fff"
                >
                  <Picker.Item label="O+" value="O+" color="#000" />
                  <Picker.Item label="O-" value="O-" color="#000" />
                  <Picker.Item label="A+" value="A+" color="#000" />
                  <Picker.Item label="A-" value="A-" color="#000" />
                  <Picker.Item label="B+" value="B+" color="#000" />
                  <Picker.Item label="B-" value="B-" color="#000" />
                  <Picker.Item label="AB+" value="AB+" color="#000" />
                  <Picker.Item label="AB-" value="AB-" color="#000" />
                </Picker>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={submitFirefighterData}
                disabled={isLoading}
              >
                <LinearGradient 
                  colors={['#dc2626', '#991b1b']} 
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>GUARDAR FICHA</Text>
                      <MaterialCommunityIcons name="content-save-outline" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    borderRadius: 500,
    width: 600,
    height: 600,
    opacity: 0.1,
  },
  redGlow: {
    backgroundColor: '#dc2626',
    top: -200,
    left: -200,
  },
  blueGlow: {
    backgroundColor: '#2563eb',
    bottom: -200,
    right: -200,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#90a4ae',
    letterSpacing: 1.5,
    marginTop: 6,
    fontWeight: '800',
  },
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#eceff1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  pickerWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    height: 50,
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
