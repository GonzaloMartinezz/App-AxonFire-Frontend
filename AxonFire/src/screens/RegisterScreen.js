import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '../config/api';

const InputField = ({ label, icon, placeholder, value, onChangeText, secureTextEntry, rightIcon, showPassword, onTogglePassword }) => (
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
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
      {rightIcon && (
        <TouchableOpacity onPress={onTogglePassword}>
          <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#90a4ae" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    password: '',
    bombero: {
      nombre: '',
      apellido: '',
      rango: ''
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRangoPicker, setShowRangoPicker] = useState(false);

  const rangosDisponibles = [
    'CADETE',
    'BOMBERO',
    'CABO',
    'SARGENTO',
    'TENIENTE',
    'CAPITÁN',
    'MAYOR',
    'JEFE DE CUARTEL'
  ];

  const updateForm = (key, value) => {
    if (key in formData.bombero) {
      setFormData({ ...formData, bombero: { ...formData.bombero, [key]: value } });
    } else {
      setFormData({ ...formData, [key]: value });
    }
  };

  const handleRegister = async () => {
    const { nombre_usuario, password, bombero } = formData;
    if (!nombre_usuario || !password || !bombero.nombre || !bombero.apellido || !bombero.rango) {
      Alert.alert('Error', 'Por favor completa todos los campos operativos.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_usuario,
          password,
          rol: 'USER',
          bombero: {
            nombre: bombero.nombre,
            apellido: bombero.apellido,
            rango: bombero.rango
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro');
      }

      Alert.alert('Solicitud Enviada', 'Tu solicitud de acceso ha sido enviada a comando central.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo completar el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a0f12' }]} />
      <View style={[styles.glow, styles.redGlow]} />
      <View style={[styles.glow, styles.blueGlow]} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <MaterialCommunityIcons name="fire" size={32} color="#fff" />
              </View>
              <Text style={styles.logoText}>
                <Text style={styles.logoAxon}>AXON </Text>
                <Text style={styles.logoFire}>FIRE</Text>
              </Text>
            </View>
            <Text style={styles.versionText}>TACTICAL COMMAND INTERFACE V4.0</Text>
          </View>

          <View style={styles.card}>
            <InputField
              label="NOMBRE DE USUARIO"
              icon="account-outline"
              placeholder="identificador único"
              value={formData.nombre_usuario}
              onChangeText={(text) => updateForm('nombre_usuario', text)}
            />
            <InputField
              label="NOMBRE"
              icon="identifier"
              placeholder="Tu nombre"
              value={formData.bombero.nombre}
              onChangeText={(text) => updateForm('nombre', text)}
            />
            <InputField
              label="APELLIDO"
              icon="identifier"
              placeholder="Tu apellido"
              value={formData.bombero.apellido}
              onChangeText={(text) => updateForm('apellido', text)}
            />
            <InputField
              label="RANGO"
              icon="badge-account-outline"
              placeholder="Tu rango"
              value={formData.bombero.rango}
              onChangeText={(text) => updateForm('rango', text)}
            />
            <InputField
              label="CONTRASEÑA"
              icon="lock-outline"
              placeholder="••••••••••••"
              value={formData.password}
              onChangeText={(text) => updateForm('password', text)}
              secureTextEntry={!showPassword}
              rightIcon
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRegister}
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
                    <Text style={styles.buttonText}>REGISTRARSE</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.securityNote}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#455a64" />
              <Text style={styles.securityText}>
                Central command registration requires verified biometric data for level 3 clearance. System monitoring enabled.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.footerLinkText}>
              ¿YA TIENES CUENTA? <Text style={styles.linkHighlight}>INICIA SESIÓN</Text>
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#dc2626" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <View style={styles.statusFooter}>
            <Text style={styles.statusText}>STATUS: SECURE</Text>
            <Text style={styles.statusText}>NODE: HK-09</Text>
          </View>
        </ScrollView>
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
    opacity: 0.15,
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
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoBox: {
    backgroundColor: '#af101a',
    padding: 10,
    borderRadius: 12,
    marginRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#af101a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 10px rgba(175, 16, 26, 0.8)',
      },
    }),
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  logoAxon: {
    color: '#fff',
  },
  logoFire: {
    color: '#dc2626',
  },
  versionText: {
    color: '#90a4ae',
    fontSize: 12,
    letterSpacing: 3,
    marginTop: 8,
    opacity: 0.8,
  },
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
      web: {
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#eceff1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 10,
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
  primaryButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    marginRight: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 24,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 12,
  },
  securityText: {
    color: '#90a4ae',
    fontSize: 11,
    lineHeight: 18,
    marginLeft: 12,
    flex: 1,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
  },
  footerLinkText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  linkHighlight: {
    color: '#dc2626',
  },
  statusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 40,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  statusText: {
    color: '#37474f',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});