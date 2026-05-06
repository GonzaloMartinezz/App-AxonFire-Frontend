import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function EmergencyScreen({ route }) {
  // Obtener alerta_id desde los parámetros de navegación (fallback para dev)
  const alertaId = route?.params?.alerta_id ?? null;

  const { user } = useAuth();
  const usuarioId = user?.id ?? null;

  // Estado de respuesta: null | 'ACEPTADO' | 'RECHAZADO'
  const [respuesta, setRespuesta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Animación de confirmación
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // ── Sonido y vibración ───────────────────────────────────────────────────
  const soundRef = useRef(null);
  const vibrationRef = useRef(null);

  const startEmergencyAlert = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/siren.mp3'),
        { isLooping: true, volume: 1.0 }
      );

      soundRef.current = sound;
      await sound.playAsync();

      vibrationRef.current = setInterval(() => {
        Vibration.vibrate(1000);
      }, 1500);
    } catch (e) {
      console.log('Error playing sound:', e);
    }
  };

  const stopEmergencyAlert = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (vibrationRef.current) {
      clearInterval(vibrationRef.current);
      vibrationRef.current = null;
    }
    Vibration.cancel();
  };

  useEffect(() => {
    startEmergencyAlert();
    return () => {
      stopEmergencyAlert();
    };
  }, []);

  // ── Animación al confirmar/rechazar ─────────────────────────────────────
  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (callback) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(callback);
    scaleAnim.setValue(0.8);
  };

  // ── Llamada al API ───────────────────────────────────────────────────────
  const enviarRespuesta = async (estadoRespuesta) => {
    if (!alertaId || !usuarioId) {
      // Sin IDs reales simplemente actualizamos el estado local (modo demo)
      await stopEmergencyAlert();
      setRespuesta(estadoRespuesta);
      animateIn();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/respuestas_alertas/responder/${alertaId}/${usuarioId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado_respuesta: estadoRespuesta,
            fecha_hora: new Date().toISOString(),
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      await stopEmergencyAlert();
      setRespuesta(estadoRespuesta);
      animateIn();
    } catch (err) {
      console.error('Error al enviar respuesta:', err);
      setError('No se pudo registrar la respuesta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // ── Cambiar respuesta ────────────────────────────────────────────────────
  const cambiarRespuesta = () => {
    animateOut(() => {
      setRespuesta(null);
      setError(null);
      // Opcionalmente reiniciar el sonido si el usuario vuelve a la pantalla de alerta
      startEmergencyAlert();
    });
  };

  // ── Fecha / hora ─────────────────────────────────────────────────────────
  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const currentDate = new Date()
    .toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    .toUpperCase();

  // ── Render: pantalla de confirmación ────────────────────────────────────
  if (respuesta !== null) {
    const esAceptado = respuesta === 'ACEPTADO';

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centeredFlex}>
          <Animated.View
            style={[
              styles.confirmationCard,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
              esAceptado ? styles.confirmationCardAccepted : styles.confirmationCardRejected,
            ]}
          >
            <MaterialCommunityIcons
              name={esAceptado ? 'check-circle' : 'close-circle'}
              size={72}
              color={esAceptado ? '#22c55e' : '#ef4444'}
            />
            <Text style={styles.confirmationTitle}>
              {esAceptado ? 'Asistencia Registrada' : 'Rechazo Registrado'}
            </Text>
            <Text style={styles.confirmationSubtitle}>
              {esAceptado
                ? 'Tu respuesta ha sido enviada. ¡Prepárate!'
                : 'Tu negativa ha sido registrada correctamente.'}
            </Text>

            <View style={styles.confirmationBadge}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#90a4ae" />
              <Text style={styles.confirmationTime}>{currentTime} HS</Text>
            </View>
          </Animated.View>

          {/* Botón cambiar respuesta */}
          <TouchableOpacity style={styles.changeButton} onPress={cambiarRespuesta}>
            <MaterialCommunityIcons name="refresh" size={16} color="#90a4ae" />
            <Text style={styles.changeButtonText}>Cambiar mi respuesta</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>AXON TACTICAL DRIVE</Text>
        </SafeAreaView>
      </View>
    );
  }

  // ── Render: pantalla de emergencia (por defecto) ─────────────────────────
  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.time}>{currentTime}</Text>
          <Text style={styles.date}>{currentDate}</Text>
        </View>

        {/* ALERTA */}
        <View style={styles.alertBox}>
          <MaterialCommunityIcons name="alert" size={24} color="#fff" />
          <View>
            <Text style={styles.alertTitle}>¡ALERTA DE EMERGENCIA!</Text>
            <Text style={styles.alertSubtitle}>AXON CODE</Text>
          </View>
        </View>

        {/* DETALLES */}
        <View style={styles.card}>
          <Text style={styles.label}>TIPO DE INCIDENTE</Text>
          <Text style={styles.text}>Incendio Estructural - Edificio</Text>
          <Text style={styles.text}>Av. Corrientes</Text>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>HORA</Text>
              <Text style={styles.text}>{currentTime} HS</Text>
            </View>
            <View>
              <Text style={styles.label}>PRIORIDAD</Text>
              <Text style={styles.critical}>CRÍTICA</Text>
            </View>
          </View>

          <View style={styles.location}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#3b82f6" />
            <Text style={styles.locationText}>
              Av. Corrientes 1234, CABA. Múltiples focos en piso 4 y 5.
            </Text>
          </View>
        </View>

        {/* ERROR */}
        {error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* BOTONES */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.buttonDisabled]}
            onPress={() => enviarRespuesta('ACEPTADO')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
            )}
            <Text style={styles.buttonText}>CONFIRMAR ASISTENCIA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rejectButton, loading && styles.buttonDisabled]}
            onPress={() => enviarRespuesta('RECHAZADO')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="close-circle-outline" size={20} color="#fff" />
            )}
            <Text style={styles.buttonText}>RECHAZAR</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>AXON TACTICAL DRIVE</Text>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f12',
    padding: 20,
  },
  centeredFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  time: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  date: {
    color: '#90a4ae',
    fontSize: 12,
    letterSpacing: 2,
  },
  alertBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  alertTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  alertSubtitle: {
    color: '#fecaca',
    fontSize: 12,
  },
  card: {
    backgroundColor: 'rgba(17,24,39,0.7)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  label: {
    color: '#90a4ae',
    fontSize: 10,
    marginBottom: 4,
  },
  text: {
    color: '#fff',
    marginBottom: 4,
  },
  critical: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  location: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  locationText: {
    color: '#cfd8dc',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
  actions: {
    marginTop: 'auto',
    gap: 10,
  },
  confirmButton: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  rejectButton: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    color: '#455a64',
    marginTop: 20,
    fontSize: 10,
  },

  // ── Pantalla de confirmación ──────────────────────────────────────────
  confirmationCard: {
    width: '100%',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  confirmationCardAccepted: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  confirmationCardRejected: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  confirmationTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  confirmationSubtitle: {
    color: '#90a4ae',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  confirmationTime: {
    color: '#90a4ae',
    fontSize: 12,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(144,164,174,0.3)',
  },
  changeButtonText: {
    color: '#90a4ae',
    fontSize: 14,
  },
});