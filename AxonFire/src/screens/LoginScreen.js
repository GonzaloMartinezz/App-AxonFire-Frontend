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
  SafeAreaView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos operativos.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (email.includes('@')) {
        navigation.replace('MainApp'); 
        Alert.alert('Acceso Autorizado', 'Bienvenido a la red táctica Axon Fire');
      } else {
        Alert.alert('Error de Acceso', 'Credenciales no reconocidas por el sistema.');
      }
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Fondo Base Oscuro */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a0f12' }]} />
      
      {/* Destellos de color (Glow effects) */}
      <View style={[styles.glow, styles.redGlow]} />
      <View style={[styles.glow, styles.blueGlow]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoBox}>
                  <MaterialCommunityIcons name="shield-fire" size={32} color="#fff" />
                </View>
                <Text style={styles.logoText}>
                  <Text style={styles.logoAxon}>AXON </Text>
                  <Text style={styles.logoFire}>FIRE</Text>
                </Text>
              </View>
              <Text style={styles.versionText}>TACTICAL COMMAND INTERFACE V4.0</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="at" size={20} color="#90a4ae" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="usuario@axonfire.com"
                    placeholderTextColor="#455a64"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>CONTRASEÑA</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>¿OLVIDASTE?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#90a4ae" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••••••"
                    placeholderTextColor="#455a64"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#90a4ae" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLogin}
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
                      <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
                      <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.securityNote}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#455a64" />
                <Text style={styles.securityText}>
                  Acceso restringido a personal de emergencias autorizado. Todas las sesiones son monitoreadas bajo el protocolo de seguridad AXON-256.
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.footerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.footerLinkText}>SOLICITA ACCESO AQUÍ</Text>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <View style={styles.statusFooter}>
              <Text style={styles.statusText}>STATUS: OPERATIONAL</Text>
              <Text style={styles.statusText}>NODE: STATION-42</Text>
            </View>
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
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
    shadowColor: '#af101a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: '#eceff1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  forgotText: {
    color: '#af101a',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 58,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 10,
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
    marginVertical: 32,
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
    marginTop: 60,
  },
  footerLinkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 'auto',
    paddingTop: 60,
    paddingHorizontal: 12,
  },
  statusText: {
    color: '#37474f',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
