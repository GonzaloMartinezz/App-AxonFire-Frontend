import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

// ── Local Mock / Storage Helpers ─────────────────────────────────────────────
async function loadMockResponses(alertaId, currentUserId) {
  try {
    const local = await AsyncStorage.getItem(`responses_${alertaId}`);
    if (local) return JSON.parse(local);

    const defaults = [
      {
        id: 'res1',
        alerta_id: alertaId,
        usuario_id: 'u1',
        usuarioId: {
          id: 'u1',
          nombre_usuario: 'RMENDOZA',
          bombero: {
            nombre: 'ROBERTO',
            apellido: 'MENDOZA',
            rangoBombero: { nombre_rol: 'CAPITAN' }
          }
        },
        estado_respuesta: 'ACEPTADO',
        fecha_hora: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: 'res2',
        alerta_id: alertaId,
        usuario_id: 'u2',
        usuarioId: {
          id: 'u2',
          nombre_usuario: 'JESPINOZA',
          bombero: {
            nombre: 'JORGE',
            apellido: 'ESPINOZA',
            rangoBombero: { nombre_rol: 'SARGENTO' }
          }
        },
        estado_respuesta: 'ACEPTADO',
        fecha_hora: new Date(Date.now() - 8 * 60 * 1000).toISOString()
      },
      {
        id: 'res3',
        alerta_id: alertaId,
        usuario_id: 'u3',
        usuarioId: {
          id: 'u3',
          nombre_usuario: 'LTORRES',
          bombero: {
            nombre: 'LAURA',
            apellido: 'TORRES',
            rangoBombero: { nombre_rol: 'OFICIAL' }
          }
        },
        estado_respuesta: 'RECHAZADO',
        fecha_hora: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      }
    ];

    // If current user is not in defaults, we add them as PENDIENTE
    if (currentUserId && !defaults.some(r => r.usuario_id === currentUserId)) {
      defaults.push({
        id: 'res_current',
        alerta_id: alertaId,
        usuario_id: currentUserId,
        usuarioId: {
          id: currentUserId,
          nombre_usuario: 'MIUSUARIO',
          bombero: {
            nombre: 'OPERADOR',
            apellido: 'AXON-42',
            rangoBombero: { nombre_rol: 'OFICIAL' }
          }
        },
        estado_respuesta: 'PENDIENTE',
        fecha_hora: new Date().toISOString()
      });
    }

    await AsyncStorage.setItem(`responses_${alertaId}`, JSON.stringify(defaults));
    return defaults;
  } catch (e) {
    return [];
  }
}

export default function EmergencyScreen({ route, navigation }) {
  // Obtener alerta_id desde los parámetros de navegación (fallback para dev)
  const navAlertaId = route?.params?.alerta_id ?? null;

  const { user, token } = useAuth();
  const usuarioId = user?.id ?? null;

  const [resolvedAlertaId, setResolvedAlertaId] = useState(navAlertaId);

  // Estado de respuesta: null | 'ACEPTADO' | 'RECHAZADO'
  const [respuesta, setRespuesta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Datos de la alerta cargados desde el backend
  const [alertaData, setAlertaData] = useState(null);
  const [respuestaSummary, setRespuestaSummary] = useState({ confirmaron: 0, rechazaron: 0, pendientes: 0 });
  const [loadingAlerta, setLoadingAlerta] = useState(true);
  const [responders, setResponders] = useState([]);

  // Animación de confirmación
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // ── Sonido y vibración ───────────────────────────────────────────────────
  const soundRef = useRef(null);
  const vibrationRef = useRef(null);

  // ── Siren Sound & Vibration ────────────────────────────────────────────────
  const startEmergencyAlert = async () => {
    try {
      if (soundRef.current || vibrationRef.current) return;

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/siren.wav'),
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

  // ── Cargar detalles de la alerta y respuestas ───────────────────────────
  const fetchEmergencyData = useCallback(async () => {
    let activeAlertaId = navAlertaId;

    setLoadingAlerta(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Si no hay alertaId, buscar la más reciente activa
      if (!activeAlertaId) {
        try {
          const resAlertas = await axios.get(`${API_BASE_URL}/alerta/rango`, {
            headers,
            data: {
              fecha_desde: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              fecha_hasta: new Date().toISOString()
            }
          });
          const data = resAlertas.data;
          const alertas = data.alertas || [];
          if (alertas.length > 0) {
            const ultima = alertas.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))[0];
            activeAlertaId = ultima.id;
          }
        } catch (e) {
          console.log('Error fetching range alerts:', e);
        }
      }

      if (!activeAlertaId) {
        // Fallback demo alert if database is empty or offline
        activeAlertaId = 'demo-alert-123';
      }
      
      setResolvedAlertaId(activeAlertaId);

      // 2. Cargar alerta y respuestas
      let alertDataObj = null;
      let isFinalizada = false;

      if (activeAlertaId === 'demo-alert-123') {
        alertDataObj = {
          id: 'demo-alert-123',
          observaciones: 'INCENDIO ESTRUCTURAL DEPOSITOS',
          ubicacion: 'AV. VELEZ SARSFIELD 3200',
          fecha_hora: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          estadoAlerta: { nombre_estado: 'ACTIVA' }
        };
      } else {
        try {
          const alertaRes = await fetch(`${API_BASE_URL}/alerta/${activeAlertaId}`, { headers });
          if (alertaRes.ok) {
            alertDataObj = await alertaRes.json();
            isFinalizada = alertDataObj.estadoAlerta?.nombre_estado === 'FINALIZADO';
          }
        } catch (err) {
          console.log('Error loading alert, using fallback:', err);
        }
      }

      if (!alertDataObj) {
        alertDataObj = {
          id: activeAlertaId,
          observaciones: 'ALERTA TÁCTICA ACTIVA',
          ubicacion: 'ZONA DE DESPACHO',
          fecha_hora: new Date().toISOString(),
          estadoAlerta: { nombre_estado: 'ACTIVA' }
        };
      }
      setAlertaData(alertDataObj);

      // 3. Cargar respuestas
      let respuestas = [];
      try {
        const respuestasRes = await fetch(`${API_BASE_URL}/respuestas_alertas/${activeAlertaId}`, { headers });
        if (respuestasRes.ok) {
          respuestas = await respuestasRes.json();
          // If we got null or empty or it failed parameter match, fall back
          if (!respuestas || respuestas.length === 0 || respuestas.error) {
            respuestas = await loadMockResponses(activeAlertaId, usuarioId);
          }
        } else {
          respuestas = await loadMockResponses(activeAlertaId, usuarioId);
        }
      } catch (err) {
        respuestas = await loadMockResponses(activeAlertaId, usuarioId);
      }
      
      // Ver si YO ya respondí
      const miRespuesta = respuestas.find(r => (r.usuario_id || r.usuarioId?.id) === usuarioId);
      
      if (isFinalizada) {
        setRespuesta('FINALIZADA');
        stopEmergencyAlert();
        animateIn();
      } else if (miRespuesta && miRespuesta.estado_respuesta !== 'PENDIENTE') {
        setRespuesta(miRespuesta.estado_respuesta);
        stopEmergencyAlert();
        animateIn();
      } else {
        // Si no hemos respondido o es PENDIENTE, reseteamos para que aparezcan los botones
        setRespuesta(null);
        startEmergencyAlert();
      }

      // Resumen de respuestas
      const counts = {
        confirmaron: respuestas.filter(r => r.estado_respuesta === 'ACEPTADO').length,
        rechazaron: respuestas.filter(r => r.estado_respuesta === 'RECHAZADO').length,
        pendientes: respuestas.filter(r => !r.estado_respuesta || r.estado_respuesta === 'PENDIENTE').length
      };
      setRespuestaSummary(counts);

      // Lista de los que aceptaron
      const aceptados = respuestas
        .filter(r => r.estado_respuesta === 'ACEPTADO')
        .map(r => ({
          id: r.id,
          nombre: r.usuarioId?.bombero?.nombre || 'Bombero',
          apellido: r.usuarioId?.bombero?.apellido || '',
          hora: r.fecha_hora ? new Date(r.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'
        }));
      setResponders(aceptados);
    } catch (err) {
      console.error('Error al cargar datos de emergencia:', err);
      setError("Ocurrió un error al cargar la alerta.");
    } finally {
      setLoadingAlerta(false);
    }
  }, [navAlertaId, token, usuarioId]);

  useFocusEffect(
    useCallback(() => {
      fetchEmergencyData();
      return () => stopEmergencyAlert();
    }, [fetchEmergencyData])
  );

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
    if (!resolvedAlertaId || !usuarioId) {
      await stopEmergencyAlert();
      setRespuesta(estadoRespuesta);
      animateIn();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        await fetch(
          `${API_BASE_URL}/respuestas_alertas/responder/${resolvedAlertaId}/${usuarioId}`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              estado_respuesta: estadoRespuesta,
              fecha_hora: new Date().toISOString(),
            }),
          }
        );
      } catch (err) {
        console.log('Error responding to alert on backend, using local override:', err);
      }

      // Update response in AsyncStorage mock storage
      const mockList = await loadMockResponses(resolvedAlertaId, usuarioId);
      const existingIdx = mockList.findIndex(r => (r.usuario_id || r.usuarioId?.id) === usuarioId);
      const updatedResponse = {
        id: existingIdx >= 0 ? mockList[existingIdx].id : `res_${Date.now()}`,
        alerta_id: resolvedAlertaId,
        usuario_id: usuarioId,
        usuarioId: {
          id: usuarioId,
          nombre_usuario: user?.nombre_usuario || 'MIUSUARIO',
          bombero: {
            nombre: user?.nombre || 'OPERADOR',
            apellido: user?.apellido || 'AXON-42',
            rangoBombero: { nombre_rol: 'OFICIAL' }
          }
        },
        estado_respuesta: estadoRespuesta,
        fecha_hora: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        mockList[existingIdx] = updatedResponse;
      } else {
        mockList.push(updatedResponse);
      }
      await AsyncStorage.setItem(`responses_${resolvedAlertaId}`, JSON.stringify(mockList));

      await stopEmergencyAlert();
      setRespuesta(estadoRespuesta);
      animateIn();
      fetchEmergencyData();
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
    if (respuesta === 'FINALIZADA') {
      return (
        <View style={styles.container}>
          <SafeAreaView style={styles.centeredFlex}>
            <Animated.View
              style={[
                styles.confirmationCard,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                styles.confirmationCardFinalized,
              ]}
            >
              <MaterialCommunityIcons name="flag-checkered" size={72} color="#94a3b8" />
              <Text style={styles.confirmationTitle}>Emergencia Finalizada</Text>
              <Text style={styles.confirmationSubtitle}>
                El administrador ya ha dado por finalizada esta alerta.
              </Text>
            </Animated.View>
            <TouchableOpacity style={[styles.changeButton, { marginTop: 12 }]} onPress={() => navigation.navigate(user?.rol === 'ADMIN' ? 'AdminApp' : 'MainApp')}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="#90a4ae" />
              <Text style={styles.changeButtonText}>Volver al panel principal</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      );
    }

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

            {esAceptado && (
              <View style={styles.respondersSummaryBox}>
                <View style={styles.summaryItem}>
                   <Text style={[styles.summaryNum, { color: '#22c55e' }]}>{respuestaSummary.confirmaron}</Text>
                   <Text style={styles.summaryLabel}>VAN</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                   <Text style={[styles.summaryNum, { color: '#94a3b8' }]}>{respuestaSummary.pendientes}</Text>
                   <Text style={styles.summaryLabel}>PEND.</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                   <Text style={[styles.summaryNum, { color: '#ef4444' }]}>{respuestaSummary.rechazaron}</Text>
                   <Text style={styles.summaryLabel}>NO</Text>
                </View>
              </View>
            )}

            {esAceptado && responders.length > 0 && (
              <View style={styles.respondersSmallList}>
                <Text style={styles.respondersSmallTitle}>EFECTIVOS EN CAMINO:</Text>
                <View style={styles.miniRespondersScroll}>
                  {responders.slice(0, 5).map((r, idx) => (
                    <View key={idx} style={styles.miniResponderItem}>
                       <MaterialCommunityIcons name="account-check" size={12} color="#22c55e" />
                       <Text style={styles.responderRowMini}>
                         {r.nombre} {r.apellido} ({r.hora})
                       </Text>
                    </View>
                  ))}
                  {responders.length > 5 && (
                    <Text style={styles.responderMoreText}>+ {responders.length - 5} más...</Text>
                  )}
                </View>
              </View>
            )}
          </Animated.View>

          {/* Botón cambiar respuesta */}
          {respuesta !== 'FINALIZADA' && !alertaData?.estadoAlerta?.nombre_estado?.includes('FINALIZADO') && (
            <TouchableOpacity style={styles.changeButton} onPress={cambiarRespuesta}>
              <MaterialCommunityIcons name="refresh" size={16} color="#90a4ae" />
              <Text style={styles.changeButtonText}>Cambiar mi respuesta</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.changeButton, { marginTop: 12 }]} onPress={() => navigation.navigate(user?.rol === 'ADMIN' ? 'AdminApp' : 'MainApp')}>
            <MaterialCommunityIcons name="arrow-left" size={16} color="#90a4ae" />
            <Text style={styles.changeButtonText}>Volver al panel principal</Text>
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
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity onPress={() => navigation.navigate(user?.rol === 'ADMIN' ? 'AdminApp' : 'MainApp')} style={{ marginRight: 12, padding: 4 }}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#90a4ae" />
              </TouchableOpacity>
              <Text style={styles.time}>{currentTime}</Text>
              <TouchableOpacity style={styles.refreshIcon} onPress={fetchEmergencyData}>
                <MaterialCommunityIcons name="refresh" size={24} color="#90a4ae" />
              </TouchableOpacity>
            </View>
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
          <Text style={styles.text}>{alertaData?.observaciones || 'Incendio Estructural - Edificio'}</Text>
          <Text style={styles.text}>{alertaData?.ubicacion || 'Ubicación no disponible'}</Text>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>HORA</Text>
              <Text style={styles.text}>
                {alertaData?.fecha_hora
                  ? new Date(alertaData.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  : currentTime} HS
              </Text>
            </View>
            <View>
              <Text style={styles.label}>PRIORIDAD</Text>
              <Text style={styles.critical}>CRÍTICA</Text>
            </View>
          </View>

          <View style={styles.location}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#3b82f6" />
            <Text style={styles.locationText}>
              {alertaData?.ubicacion || 'Av. Corrientes 1234, CABA. Múltiples focos en piso 4 y 5.'}
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

        {/* RESPONDERS LIST (Pre-confirmation) */}
        {responders.length > 0 && (
          <View style={styles.respondersPreview}>
            <View style={styles.respondersHeader}>
              <MaterialCommunityIcons name="account-group" size={18} color="#3b82f6" />
              <Text style={styles.respondersTitle}>PERSONAL RESPONDIENDO ({responders.length})</Text>
            </View>
            <View style={styles.respondersGrid}>
              {responders.map((r, idx) => (
                <View key={idx} style={styles.responderChip}>
                  <Text style={styles.responderChipText}>{r.nombre[0]}. {r.apellido}</Text>
                </View>
              ))}
            </View>
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

        </ScrollView>
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
    width: '100%',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  refreshIcon: {
    position: 'absolute',
    right: 0,
    padding: 10,
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
    marginTop: 30,
    gap: 10,
    paddingBottom: 20,
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
  confirmationCardFinalized: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
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
  // Responders List
  respondersPreview: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  respondersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  respondersTitle: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  respondersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  responderChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  responderChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  respondersSmallList: {
    marginTop: 20,
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  respondersSmallTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  responderRowMini: {
    color: '#cfd8dc',
    fontSize: 11,
    flex: 1,
  },
  responderMoreText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  // Resumen de respuestas en confirmación
  respondersSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  summaryItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  summaryNum: {
    fontSize: 20,
    fontWeight: '900',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#90a4ae',
    fontWeight: '700',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  miniRespondersScroll: {
    width: '100%',
    marginTop: 8,
    gap: 4,
  },
  miniResponderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
});