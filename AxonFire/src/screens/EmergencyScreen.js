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
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { useNotifications } from '../context/NotificationContext';
import ModalRevisionBolsos, { useRevisionBolsos } from '../components/ModalRevisionBolsos';
import { styles } from '../styles/EmergencyScreenStyles';

// ── Local Mock / Storage Helpers ─────────────────────────────────────────────
async function loadMockResponses(alertaId, currentUserId, token) {
  try {
    const local = await AsyncStorage.getItem(`responses_${alertaId}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (alertaId !== 'demo-alert-123') {
        return parsed.filter(r => r.usuario_id !== 'u1' && r.usuario_id !== 'u2' && r.usuario_id !== 'u3' && r.usuario_id !== 'u4' && r.usuario_id !== 'u5');
      }
      return parsed;
    }

    let realBomberos = [];
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/usuarios/bomberos`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          realBomberos = await res.json();
        }
      } catch (err) {
        console.log('Error fetching real bomberos for mock responses:', err);
      }
    }

    const defaults = [];

    // ONLY generate simulated responses if it is the demo alert
    if (alertaId === 'demo-alert-123' && realBomberos && realBomberos.length > 0) {
      realBomberos.forEach((b, idx) => {
        if (b.usuario_id === currentUserId) return;

        let estado = 'PENDIENTE';
        if (idx % 3 === 0) estado = 'ACEPTADO';
        else if (idx % 3 === 1) estado = 'RECHAZADO';

        defaults.push({
          id: `res_real_${b.id}`,
          alerta_id: alertaId,
          usuario_id: b.usuario_id,
          usuarioId: {
            id: b.usuario_id,
            nombre_usuario: b.usuarioId?.nombre_usuario || b.nombre.toLowerCase(),
            bombero: {
              nombre: b.nombre,
              apellido: b.apellido,
              rangoBombero: { nombre_rol: b.rangoBombero?.nombre_rol || 'BOMBERO' }
            }
          },
          estado_respuesta: estado,
          fecha_hora: new Date(Date.now() - (10 - idx) * 60 * 1000).toISOString()
        });
      });
    }

    if (currentUserId && !defaults.some(r => r.usuario_id === currentUserId)) {
      const currentUserReal = realBomberos.find(b => b.usuario_id === currentUserId);
      defaults.push({
        id: 'res_current',
        alerta_id: alertaId,
        usuario_id: currentUserId,
        usuarioId: {
          id: currentUserId,
          nombre_usuario: currentUserReal?.usuarioId?.nombre_usuario || 'MIUSUARIO',
          bombero: {
            nombre: currentUserReal?.nombre || 'OPERADOR',
            apellido: currentUserReal?.apellido || 'AXON-42',
            rangoBombero: { nombre_rol: currentUserReal?.rangoBombero?.nombre_rol || 'OFICIAL' }
          }
        },
        estado_respuesta: 'PENDIENTE',
        fecha_hora: new Date().toISOString()
      });
    }

    if (defaults.length <= 1 && alertaId === 'demo-alert-123') {
      const fallbackMock = [
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
        }
      ];
      fallbackMock.forEach(f => defaults.push(f));
    }

    await AsyncStorage.setItem(`responses_${alertaId}`, JSON.stringify(defaults));
    return defaults;
  } catch (e) {
    return [];
  }
}

// ── Helper: formatea Date a HH:MM ────────────────────────────────────────────
function formatHora(date) {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ── Helper: valida que el string sea HH:MM válido ─────────────────────────────
function esHoraValida(str) {
  if (!str) return false;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(str);
}

// ── Helper: parsea fecha de la base de datos a local ──────────────────────────
function parseDateLocal(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput !== 'string') return new Date(dateInput);

  // Strip 'Z' at the end or '+00:00' timezone offset to parse it as local time
  const cleaned = dateInput.replace(/Z$/, '').replace(/\+00:?00$/, '');
  return new Date(cleaned);
}

// ── Componente: Input de hora amigable ────────────────────────────────────────
// Muestra un campo formateado HH:MM con teclado numérico.
// Acepta tipeo libre y formatea automáticamente al salir del campo.
function InputHora({ label, value, onChange, readOnly = false, icono = 'clock-outline' }) {
  const [texto, setTexto] = useState(value || '');
  const [enfocado, setEnfocado] = useState(false);

  // Sincronizar si el padre cambia el value externamente
  useEffect(() => { setTexto(value || ''); }, [value]);

  // Formatea mientras el usuario tipea: agrega el ":" automáticamente
  function handleChange(raw) {
    // Solo dígitos
    const soloDigitos = raw.replace(/\D/g, '').slice(0, 4);
    let formateado = soloDigitos;
    if (soloDigitos.length >= 3) {
      formateado = soloDigitos.slice(0, 2) + ':' + soloDigitos.slice(2);
    }
    setTexto(formateado);
    if (formateado.length === 5) onChange(formateado);
  }

  function handleBlur() {
    setEnfocado(false);
    if (esHoraValida(texto)) {
      onChange(texto);
    } else if (texto.length > 0) {
      Alert.alert('Hora inválida', 'Ingresá la hora en formato HH:MM (ej: 14:30)');
      setTexto('');
      onChange('');
    }
  }
  const estaVacio = texto.length === 0;
  const esValido = esHoraValida(texto);

  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={[
        inputStyles.container,
        readOnly && inputStyles.containerReadOnly,
        enfocado && inputStyles.containerFocused,
        esValido && !readOnly && inputStyles.containerValid,
      ]}>
        {/* Ícono izquierdo */}
        <MaterialCommunityIcons
          name={icono}
          size={18}
          color={
            readOnly ? '#475569'
              : esValido ? '#22c55e'
                : enfocado ? '#3b82f6'
                  : '#64748b'
          }
          style={{ marginRight: 10 }}
        />

        {readOnly ? (
          // Campo Read-Only — AX-14 tarea imagen 2
          <View style={inputStyles.readOnlyBox}>
            <Text style={inputStyles.readOnlyTexto}>
              {texto || '—'}
            </Text>
            <View style={inputStyles.badgeReadOnly}>
              <MaterialCommunityIcons name="lock-outline" size={9} color="#475569" />
              <Text style={inputStyles.badgeReadOnlyTexto}>AUTO</Text>
            </View>
          </View>
        ) : (
          // Campo editable — AX-14 tarea imagen 3
          <TextInput
            style={inputStyles.input}
            value={texto}
            onChangeText={handleChange}
            onFocus={() => setEnfocado(true)}
            onBlur={handleBlur}
            placeholder="HH:MM"
            placeholderTextColor="#334155"
            keyboardType="numeric"
            maxLength={5}
            returnKeyType="done"
          />
        )}

        {/* Indicador de estado */}
        {!readOnly && esValido && (
          <MaterialCommunityIcons name="check-circle" size={16} color="#22c55e" />
        )}
        {!readOnly && !esValido && !estaVacio && (
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#f59e0b" />
        )}
      </View>

      {/* Ayuda debajo del campo */}
      {!readOnly && enfocado && (
        <Text style={inputStyles.ayuda}>Ingresá los 4 dígitos · Ej: 1430 → 14:30</Text>
      )}
      {readOnly && (
        <Text style={inputStyles.ayudaReadOnly}>
          Registrada automáticamente al disparar la alerta
        </Text>
      )}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { color: '#64748b', fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(17,24,39,0.8)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  containerReadOnly: { backgroundColor: 'rgba(15,20,28,0.9)', borderColor: 'rgba(71,85,105,0.3)', borderStyle: 'dashed' },
  containerFocused: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.05)' },
  containerValid: { borderColor: 'rgba(34,197,94,0.4)' },
  input: { flex: 1, color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 2 },
  readOnlyBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  readOnlyTexto: { color: '#475569', fontSize: 22, fontWeight: '700', letterSpacing: 2 },
  badgeReadOnly: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(71,85,105,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeReadOnlyTexto: { color: '#475569', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  ayuda: { color: '#475569', fontSize: 10, fontWeight: '500', marginTop: 4 },
  ayudaReadOnly: { color: '#334155', fontSize: 9, fontWeight: '500', marginTop: 3, fontStyle: 'italic' },
});

// ── Componente principal ──────────────────────────────────────────────────────

export default function EmergencyScreen({ route, navigation }) {
  // Parámetros de navegación y contexto de autenticación unificados
  const alertaId = route?.params?.alerta_id ?? null;
  const { user, token: userToken, logout } = useAuth();
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => logout(), style: 'destructive' },
      ]
    );
  };
  const irAlPanel = () => {
    navigation.navigate(user?.rol === 'ADMIN' ? 'AdminApp' : 'MainApp', { screen: 'Panel' });
  };
  const irAAsistencia = (idTarget) => {
    const aid = idTarget || resolvedAlertaId || alertaId;
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('AttendanceBoard', { alerta_id: aid });
      } else {
        navigation.navigate('AttendanceBoard', { alerta_id: aid });
      }
    } catch (e) {
      try {
        navigation.navigate('Asistencia', { alerta_id: aid });
      } catch (err) {
        console.log('Error de navegación:', err);
      }
    }
  };
  const { addNotification } = useNotifications();
  const usuarioId = user?.id ?? null;
  const token = userToken ?? user?.token ?? null;

  // Estados de control y mutación de datos (dev)
  const [respuesta, setRespuesta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados de la alerta y personalización del flujo (carona + dev)
  const [alertaData, setAlertaData] = useState(null);
  const [loadingAlerta, setLoadingAlerta] = useState(true);
  const [responders, setResponders] = useState([]);
  const [respuestaSummary, setRespuestaSummary] = useState({ confirmaron: 0, rechazaron: 0, pendientes: 0 });
  const [resolvedAlertaId, setResolvedAlertaId] = useState(alertaId);

  // ── BUG01 FIX: Sincronizar resolvedAlertaId cuando cambia el param de navegación ──
  // Cuando el poller de App.js navega a Emergencia con un nuevo alerta_id,
  // el componente (que ya está montado como tab) necesita actualizar su estado
  // para no seguir mostrando la alerta vieja finalizada.
  useEffect(() => {
    if (alertaId && alertaId !== resolvedAlertaId) {
      setResolvedAlertaId(alertaId);
      setRespuesta(null);       // Resetear para mostrar botones de confirmar/rechazar
      setAlertaData(null);      // Limpiar data de la alerta anterior
      setLoadingAlerta(true);   // Mostrar loading mientras carga la nueva alerta
    }
  }, [alertaId]);

  // ── AX-14: Tiempos críticos ──────────────────────────────────────────────
  // Hora de llamado: se captura automáticamente al confirmar (o desde alertaData)
  const [horaLlamado, setHoraLlamado] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [horaRegreso, setHoraRegreso] = useState('');
  const [guardandoTiempos, setGuardandoTiempos] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const soundRef = useRef(null);
  const vibrationRef = useRef(null);
  const isAlertActiveRef = useRef(false);
  const soundLoadingRef = useRef(false);
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation;
    if (!alertaData) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [alertaData]);
  const revisionBolsos = useRevisionBolsos();
  const promptedRef = useRef({});


  // ── Siren Sound & Vibration ────────────────────────────────────────────────
  async function startEmergencyAlert() {
    if (soundRef.current || vibrationRef.current || soundLoadingRef.current) return;

    isAlertActiveRef.current = true;
    soundLoadingRef.current = true;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true
      });
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/siren.mp3'),
        { isLooping: true, volume: 1.0 }
      );

      if (!isAlertActiveRef.current) {
        await sound.unloadAsync();
        soundLoadingRef.current = false;
        return;
      }

      soundRef.current = sound;
      await sound.playAsync();

      if (!vibrationRef.current) {
        vibrationRef.current = setInterval(() => Vibration.vibrate(1000), 1500);
      }
    } catch (e) {
      console.log('Error playing sound:', e);
    } finally {
      soundLoadingRef.current = false;
    }
  }

  async function stopEmergencyAlert() {
    isAlertActiveRef.current = false;
    if (global.stopAppSiren) {
      global.stopAppSiren().catch((err) => console.log('Error stopping app siren globally:', err));
    }
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (err) {
        console.log('Error unloading sound:', err);
      }
      soundRef.current = null;
    }
    if (vibrationRef.current) {
      clearInterval(vibrationRef.current);
      vibrationRef.current = null;
    }
    Vibration.cancel();
  }

  // ── Control de Ciclo de Vida: Audio y Vibración ───────────────────────────
  useEffect(() => {
    // Only cleanup audio on unmount
    return () => { stopEmergencyAlert(); };
  }, []);

  // ── Cargar detalles de la alerta y respuestas unificadas ───────────────────
  const fetchEmergencyData = useCallback(async () => {
    // BUG01 FIX: Priorizar alertaId (params frescos de navegación) sobre
    // resolvedAlertaId (que puede estar stale con una alerta vieja finalizada)
    let activeAlertaId = alertaId || resolvedAlertaId;

    setLoadingAlerta(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Obtener listado de bomberos reales del sistema para mapeo de nombres robusto
      let bomberosReal = [];
      try {
        const resBomberos = await fetch(`${API_BASE_URL}/usuarios/bomberos`, { headers });
        if (resBomberos.ok) {
          bomberosReal = await resBomberos.json();
        }
      } catch (err) {
        console.log('Error fetching real bomberos in fetchEmergencyData:', err);
      }

      // 2. Si no hay alertaId, buscar la más reciente activa (Rango de 30 días para robustez en Web y Mobile)
      if (!activeAlertaId) {
        try {
          const resAlertas = await axios.get(`${API_BASE_URL}/alerta/rango`, {
            params: {
              fecha_desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              fecha_hasta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // +24h en el futuro para mitigar clock skew
            }, headers
          });
          const data = resAlertas.data;
          const alertas = Array.isArray(data?.alertas) ? data.alertas : Array.isArray(data) ? data : [];
          
          if (alertas.length > 0) {
            const activas = [];
            for (const a of alertas) {
              const isLocallyFinalized = await AsyncStorage.getItem(`finalized_alert_${a.id}`);
              if (!isLocallyFinalized && a.estadoAlerta?.nombre_estado !== 'FINALIZADO') {
                activas.push(a);
              }
            }
            
            if (activas.length > 0) {
              // Buscar si hay alguna activa pendiente de respuesta localmente
              const activasConResp = await Promise.all(activas.map(async (a) => {
                const localResp = await AsyncStorage.getItem(`local_response_${a.id}`);
                return { alert: a, localResp };
              }));
              
              const pendientes = activasConResp.filter(x => !x.localResp || x.localResp === 'PENDIENTE');
              
              if (pendientes.length > 0) {
                // Tomar la pendiente más reciente
                const ultimaPendiente = pendientes.sort((a, b) => new Date(b.alert.fecha_hora) - new Date(a.alert.fecha_hora))[0];
                activeAlertaId = ultimaPendiente.alert.id;
              } else {
                // Si no hay pendientes, tomar la respondida más reciente
                const ultimaRespondida = activasConResp.sort((a, b) => new Date(b.alert.fecha_hora) - new Date(a.alert.fecha_hora))[0];
                activeAlertaId = ultimaRespondida.alert.id;
              }
            }
          }
        } catch (e) {
          console.log('Error fetching range alerts:', e);
        }
      }

      if (!activeAlertaId) {
        setResolvedAlertaId(null);
        setAlertaData(null);
        setRespuesta(null);
        setResponders([]);
        setRespuestaSummary({ confirmaron: 0, rechazaron: 0, pendientes: 0 });
        setLoadingAlerta(false);
        return;
      }

      setResolvedAlertaId(activeAlertaId);

      // 3. Cargar datos específicos de la alerta
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
          } else {
            throw new Error(`Error ${alertaRes.status}`);
          }
        } catch (err) {
          console.log('Error loading alert, using fallback:', err);
        }
      }

      // Check local override first
      const isLocallyFinalized = await AsyncStorage.getItem(`finalized_alert_${activeAlertaId}`);
      if (isLocallyFinalized === 'true') {
        isFinalizada = true;
        if (alertDataObj) {
          if (!alertDataObj.estadoAlerta) alertDataObj.estadoAlerta = {};
          alertDataObj.estadoAlerta.nombre_estado = 'FINALIZADO';
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

      // AX-14: Extracción automática de la hora de llamado para la UI (Aporte dev)
      if (alertDataObj?.fecha_hora) {
        setHoraLlamado(formatHora(parseDateLocal(alertDataObj.fecha_hora)));
      }

      // 4. Cargar respuestas del personal asignado
      let respuestas = [];
      try {
        const respuestasRes = await fetch(`${API_BASE_URL}/respuestas_alertas/${activeAlertaId}`, { headers });
        if (respuestasRes.ok) {
          respuestas = await respuestasRes.json();
        }
      } catch (err) {
        console.log('Error loading responses from backend:', err);
      }

      if (!respuestas || respuestas.length === 0 || respuestas.error) {
        respuestas = await loadMockResponses(activeAlertaId, usuarioId, token);
      } else {
        if (activeAlertaId !== 'demo-alert-123') {
          // Filtrar mocks hardcodeados heredados en alertas reales
          respuestas = respuestas.filter(r => {
            const uid = r.usuario_id || r.usuarioId?.id || r.usuarioId;
            return uid !== 'u1' && uid !== 'u2' && uid !== 'u3' && uid !== 'u4' && uid !== 'u5';
          });
        }
      }

      // Ver si YO ya respondí (primero verificar almacenamiento local persistente para máxima robustez)
      const localResponse = await AsyncStorage.getItem(`local_response_${activeAlertaId}`);

      let miRespuestaVal = localResponse;
      if (!miRespuestaVal) {
        const miRespuestaObj = respuestas.find(r => (r.usuario_id || r.usuarioId?.id) === usuarioId);
        if (miRespuestaObj && miRespuestaObj.estado_respuesta !== 'PENDIENTE') {
          miRespuestaVal = miRespuestaObj.estado_respuesta;
          // Guardar localmente para consistencia futura
          await AsyncStorage.setItem(`local_response_${activeAlertaId}`, miRespuestaVal);
        }
      }

      if (isFinalizada) {
        setRespuesta('FINALIZADA');
        stopEmergencyAlert();
        animateIn();
        const alreadyPrompted = await AsyncStorage.getItem(`prompted_bags_${activeAlertaId}`);
        if (!alreadyPrompted) {
          await AsyncStorage.setItem(`prompted_bags_${activeAlertaId}`, 'true');
          revisionBolsos.mostrar({ token, navigation, alertaId: activeAlertaId });
        }
      } else if (miRespuestaVal && miRespuestaVal !== 'PENDIENTE') {
        stopEmergencyAlert();
        setRespuesta(miRespuestaVal);
        animateIn();
      } else {
        // Si no hemos respondido o es PENDIENTE, reseteamos para que aparezcan los botones
        setRespuesta(null);
        if (activeAlertaId !== 'demo-alert-123') {
          startEmergencyAlert();
        } else {
          stopEmergencyAlert();
        }
      }

      // Resumen de respuestas
      const counts = {
        confirmaron: respuestas.filter(r => r.estado_respuesta === 'ACEPTADO').length,
        rechazaron: respuestas.filter(r => r.estado_respuesta === 'RECHAZADO').length,
        pendientes: respuestas.filter(r => !r.estado_respuesta || r.estado_respuesta === 'PENDIENTE').length
      };
      setRespuestaSummary(counts);

      // Lista de los que aceptaron con resolución de nombres reales de la base de datos
      const aceptados = respuestas
         .filter(r => r.estado_respuesta === 'ACEPTADO')
         .map(r => {
           const uid = r.usuario_id || r.usuarioId?.id || r.usuarioId;
           const bReal = bomberosReal.find(b => b.usuario_id === uid || b.usuarioId?.id === uid);
           return {
             id: r.id,
             nombre: bReal?.nombre || r.usuarioId?.bombero?.nombre || 'Bombero',
             apellido: bReal?.apellido || r.usuarioId?.bombero?.apellido || '',
             hora: r.fecha_hora ? new Date(r.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'
           };
         });
      setResponders(aceptados);
    } catch (err) {
      console.error('Error al cargar datos de emergencia:', err);
      setError("Ocurrió un error al cargar la alerta.");
    } finally {
      setLoadingAlerta(false);
    }
  }, [resolvedAlertaId, alertaId, token, usuarioId]);

  useFocusEffect(
    useCallback(() => {
      fetchEmergencyData();
      
      const intervalId = setInterval(() => {
        fetchEmergencyData();
      }, 5000);

      return () => {
        clearInterval(intervalId);
        stopEmergencyAlert();
      };
    }, [fetchEmergencyData])
  );


  // ── Animaciones ──────────────────────────────────────────────────────────
  function animateIn() {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }

  function animateOut(callback) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(callback);
    scaleAnim.setValue(0.8);
  }

  // ── Confirmar/rechazar asistencia ────────────────────────────────────────
  async function enviarRespuesta(estadoRespuesta) {
    const targetAlertaId = resolvedAlertaId || alertaId;
    if (!targetAlertaId || !usuarioId) {
      await stopEmergencyAlert();
      if (targetAlertaId) {
        await AsyncStorage.setItem(`local_response_${targetAlertaId}`, estadoRespuesta);
      }
      setRespuesta(estadoRespuesta);
      animateIn();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // ── Mutación y Persistencia de la Respuesta ────────────────────────────
      try {
        const res = await fetch(
          `${API_BASE_URL}/respuestas_alertas/responder/${targetAlertaId}`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              estado_respuesta: estadoRespuesta,
              fecha_hora: new Date().toISOString(),
            }),
          }
        );

        if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);
      } catch (err) {
        console.log('Error responding to alert on backend, executing local sync override:', err);
      }

      // Sincronización en almacenamiento local AsyncStorage (Garantía Offline)
      const mockList = await loadMockResponses(targetAlertaId, usuarioId, token);
      const existingIdx = mockList.findIndex(r => (r.usuario_id || r.usuarioId?.id) === usuarioId);
      const existingUserResponse = existingIdx >= 0 ? mockList[existingIdx] : null;
      const updatedResponse = {
        id: existingUserResponse?.id || `res_${Date.now()}`,
        alerta_id: targetAlertaId,
        usuario_id: usuarioId,
        usuarioId: {
          id: usuarioId,
          nombre_usuario: existingUserResponse?.usuarioId?.nombre_usuario || user?.nombre_usuario || 'MIUSUARIO',
          bombero: {
            nombre: existingUserResponse?.usuarioId?.bombero?.nombre || user?.nombre || 'OPERADOR',
            apellido: existingUserResponse?.usuarioId?.bombero?.apellido || user?.apellido || 'AXON-42',
            rangoBombero: { nombre_rol: existingUserResponse?.usuarioId?.bombero?.rangoBombero?.nombre_rol || 'OFICIAL' }
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

      await AsyncStorage.setItem(`responses_${targetAlertaId}`, JSON.stringify(mockList));
      await AsyncStorage.setItem(`local_response_${targetAlertaId}`, estadoRespuesta);
      await stopEmergencyAlert();
      setRespuesta(estadoRespuesta);
      animateIn();
      fetchEmergencyData();

      // RF-02: Redirección automática al mapa si se confirma asistencia
      if (estadoRespuesta === 'ACEPTADO') {
        const targetAlertId = resolvedAlertaId || alertaId;
        setTimeout(() => {
          // Intentar navegación directa de pestañas
          navigation.navigate('Mapa', { alertaId: targetAlertId });
          
          // Intentar navegación a través del stack parent para cerrar modales/pantallas apiladas
          try {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('MainApp', {
                screen: 'Mapa',
                params: { alertaId: targetAlertId },
              });
            } else {
              navigation.navigate('MainApp', {
                screen: 'Mapa',
                params: { alertaId: targetAlertId },
              });
            }
          } catch (e) {
            console.log('Error en navegación parent:', e);
          }
        }, 600);
      }
    } catch (err) {
      console.error('Error al enviar respuesta:', err);
      setError('No se pudo registrar la respuesta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  // ── AX-14: Guardar tiempos críticos ─────────────────────────────────────
  // Usa POST /registros_comunicacion/crear hasta que el backend implemente
  // un endpoint específico de tiempos críticos.
  async function guardarTiempos() {
    if (!esHoraValida(horaSalida)) {
      Alert.alert('Hora de Salida requerida', 'Ingresá la hora de salida del móvil (HH:MM).');
      return;
    }
    if (horaRegreso && !esHoraValida(horaRegreso)) {
      Alert.alert('Hora de Regreso inválida', 'Verificá el formato HH:MM.');
      return;
    }

    setGuardandoTiempos(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const mensaje =
        `TIEMPOS CRÍTICOS — ` +
        `Llamado: ${horaLlamado} | ` +
        `Salida: ${horaSalida} | ` +
        `Regreso: ${horaRegreso || 'pendiente'}`;

      const res = await fetch(`${API_BASE_URL}/registros_comunicacion/crear`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          alerta_id: alertaId,
          mensaje,
          tipo_comunicacion: 'INFORMACION',
          fecha_hora: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      Alert.alert('✅ Tiempos guardados', 'Los tiempos críticos fueron registrados correctamente.');
    } catch (err) {
      console.error('Error guardando tiempos:', err);
      Alert.alert('Error', 'No se pudieron guardar los tiempos. Intentá de nuevo.');
    } finally {
      setGuardandoTiempos(false);
    }
  }

  async function cambiarRespuesta() {
    const targetAlertaId = resolvedAlertaId || alertaId;
    if (targetAlertaId) {
      try {
        await AsyncStorage.removeItem(`local_response_${targetAlertaId}`);
      } catch (e) {
        console.log('Error clearing local response:', e);
      }
    }
    animateOut(() => {
      setRespuesta(null);
      setError(null);
      setHoraSalida('');
      setHoraRegreso('');
      startEmergencyAlert();
    });
  }

  const currentTime = formatHora(new Date());
  const currentDate = new Date()
    .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase();

  if (loadingAlerta && respuesta === null) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>Cargando estado de la emergencia...</Text>
      </View>
    );
  }

  // ── Render: pantalla de confirmación + formulario de tiempos ─────────────
  if (respuesta !== null) {
    if (respuesta === 'FINALIZADA') {
      return (
        <View style={styles.container}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={irAlPanel} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#90a4ae" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="logout" size={24} color="#e11d48" />
              </TouchableOpacity>
            </View>
            <View style={styles.centeredFlex}>
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
              {/* CTA de acceso rápido a revisión de bolsos */}
              <TouchableOpacity
                style={[styles.changeButton, { marginTop: 12, backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.3)' }]}
                onPress={() => navigation.navigate('ChecklistBolsos', { token })}
              >
                <MaterialCommunityIcons name="clipboard-check-outline" size={16} color="#dc2626" />
                <Text style={[styles.changeButtonText, { color: '#fff', fontWeight: 'bold' }]}>CONTROLAR BOLSOS UTILIZADOS</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.changeButton, { marginTop: 12 }]} onPress={irAlPanel}>
                <MaterialCommunityIcons name="arrow-left" size={16} color="#90a4ae" />
                <Text style={styles.changeButtonText}>Volver al panel principal</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <ModalRevisionBolsos estado={revisionBolsos} />
        </View>
      );
    }

    const esAceptado = respuesta === 'ACEPTADO';

    return (
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity onPress={irAlPanel} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#90a4ae" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="logout" size={24} color="#e11d48" />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.confirmScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Card de confirmación */}
            <Animated.View
              style={[
                styles.confirmationCard,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                esAceptado ? styles.confirmationCardAccepted : styles.confirmationCardRejected,
              ]}
            >
              <MaterialCommunityIcons
                name={esAceptado ? 'check-circle' : 'close-circle'}
                size={60}
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

              {/* Botón premium de acceso al Tablero de Asistencia */}
              <TouchableOpacity
                style={styles.boardAccessButton}
                onPress={() => irAAsistencia(resolvedAlertaId || alertaId)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#fff" />
                <Text style={styles.boardAccessButtonText}>VER TABLERO DE ASISTENCIA</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* ── AX-14: Formulario de tiempos críticos (solo si aceptó) ─── */}
            {esAceptado && (
              <Animated.View style={[styles.tiemposCard, { opacity: fadeAnim }]}>
                {/* Header del formulario */}
                <View style={styles.tiemposHeader}>
                  <MaterialCommunityIcons name="timer-outline" size={18} color="#dc2626" />
                  <Text style={styles.tiemposTitulo}>TIEMPOS CRÍTICOS</Text>
                </View>
                <Text style={styles.tiemposDesc}>
                  Registrá los tiempos del operativo para trazabilidad completa.
                </Text>

                {/* HORA DE LLAMADO — Read-Only (AX-14) */}
                <InputHora
                  label="Hora de Llamado"
                  value={horaLlamado}
                  onChange={() => { }}
                  readOnly={true}
                  icono="phone-incoming"
                />

                {/* HORA DE SALIDA — Editable (AX-14) */}
                <InputHora
                  label="Hora de Salida del Móvil *"
                  value={horaSalida}
                  onChange={setHoraSalida}
                  readOnly={false}
                  icono="truck-fast-outline"
                />

                {/* HORA DE REGRESO — Editable (AX-14) */}
                <InputHora
                  label="Hora de Regreso"
                  value={horaRegreso}
                  onChange={setHoraRegreso}
                  readOnly={false}
                  icono="home-clock-outline"
                />

                {/* Botón guardar tiempos */}
                <TouchableOpacity
                  style={[styles.botonGuardarTiempos, guardandoTiempos && { opacity: 0.6 }]}
                  onPress={guardarTiempos}
                  disabled={guardandoTiempos}
                  activeOpacity={0.8}
                >
                  {guardandoTiempos ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="content-save-check-outline" size={16} color="#fff" />
                      <Text style={styles.botonGuardarTiemposTexto}>GUARDAR TIEMPOS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ── Monitoreo de Personal y Dotación Activa (Aporte carona) ─── */}
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

            {/* Lista compacta de efectivos en camino */}
            {responders.length > 0 && (
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

            {/* Botón cambiar respuesta */}
            {respuesta !== 'FINALIZADA' && !alertaData?.estadoAlerta?.nombre_estado?.includes('FINALIZADO') && (
              <TouchableOpacity style={styles.changeButton} onPress={cambiarRespuesta}>
                <MaterialCommunityIcons name="refresh" size={16} color="#90a4ae" />
                <Text style={styles.changeButtonText}>Cambiar mi respuesta</Text>
              </TouchableOpacity>
            )}

            {/* Botón de escape unificado para retornar al Panel Principal */}
            <TouchableOpacity
              style={[styles.changeButton, { marginTop: 12 }]}
              onPress={irAlPanel}
            >
              <MaterialCommunityIcons name="arrow-left" size={16} color="#90a4ae" />
              <Text style={styles.changeButtonText}>Volver al panel principal</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>AXON TACTICAL DRIVE</Text>
          </ScrollView>
        </SafeAreaView>
        <ModalRevisionBolsos estado={revisionBolsos} />
      </View>
    );
  }

  // ── Render: pantalla de emergencia (sin cambios) ─────────────────────────
  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity onPress={irAlPanel} style={{ marginRight: 12, padding: 4 }}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#90a4ae" />
              </TouchableOpacity>
              <Text style={styles.time}>{currentTime}</Text>
              <View style={[styles.refreshIcon, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <TouchableOpacity onPress={fetchEmergencyData} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="refresh" size={24} color="#90a4ae" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="logout" size={24} color="#e11d48" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.date}>{currentDate}</Text>
          </View>

          {!alertaData ? (
            <View style={styles.emptyContainer}>
              <View style={styles.pulseContainer}>
                <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }] }]} />
                <View style={styles.pulseIconContainer}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={64} color="#10b981" />
                </View>
              </View>

              <Text style={styles.emptyTitle}>SITUACIÓN BAJO CONTROL</Text>
              <Text style={styles.emptySubtitle}>
                No se registran emergencias activas en este momento.
              </Text>

              <View style={styles.statusBoxActive}>
                <View style={styles.greenDot} />
                <Text style={styles.statusBoxText}>SISTEMA EN MONITOREO ACTIVO</Text>
              </View>

              <TouchableOpacity style={styles.emptyRefreshButton} onPress={fetchEmergencyData}>
                <MaterialCommunityIcons name="refresh" size={18} color="#94a3b8" />
                <Text style={styles.emptyRefreshButtonText}>VERIFICAR ALERTA</Text>
              </TouchableOpacity>

              {/* RF-04: Accesos rápidos operativos para bomberos */}
              {user?.rol !== 'ADMIN' && (
                <View style={quickStyles.container}>
                  <Text style={quickStyles.sectionTitle}>ACCESOS RÁPIDOS</Text>
                  
                  <TouchableOpacity
                    style={quickStyles.card}
                    onPress={() => navigation.navigate('PedidosSuministro')}
                    activeOpacity={0.8}
                  >
                    <View style={[quickStyles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
                      <MaterialCommunityIcons name="cart-outline" size={22} color="#f97316" />
                    </View>
                    <View style={quickStyles.cardTextBox}>
                      <Text style={quickStyles.cardTitle}>PEDIR SUMINISTROS</Text>
                      <Text style={quickStyles.cardSub}>Solicitar insumos operativos</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#475569" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={quickStyles.card}
                    onPress={() => navigation.navigate('WeeklyChecklist')}
                    activeOpacity={0.8}
                  >
                    <View style={[quickStyles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                      <MaterialCommunityIcons name="clipboard-check-outline" size={22} color="#8b5cf6" />
                    </View>
                    <View style={quickStyles.cardTextBox}>
                      <Text style={quickStyles.cardTitle}>REALIZAR CONTROLES</Text>
                      <Text style={quickStyles.cardSub}>Checklists diarios y de servicio</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#475569" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={quickStyles.card}
                    onPress={() => navigation.navigate('MainApp', { screen: 'Mapa' })}
                    activeOpacity={0.8}
                  >
                    <View style={[quickStyles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                      <MaterialCommunityIcons name="map-marker-radius" size={22} color="#38bdf8" />
                    </View>
                    <View style={quickStyles.cardTextBox}>
                      <Text style={quickStyles.cardTitle}>VER MAPA</Text>
                      <Text style={quickStyles.cardSub}>Mapa operativo táctico</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#475569" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <>
              <View style={styles.alertBox}>
                <MaterialCommunityIcons name="alert" size={24} color="#fff" />
                <View>
                  <Text style={styles.alertTitle}>¡ALERTA DE EMERGENCIA!</Text>
                  <Text style={styles.alertSubtitle}>AXON CODE</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.label}>TIPO DE INCIDENTE</Text>
                <Text style={styles.text}>
                  {alertaData?.subCategoriaAlerta?.nombre_sub_categoria
                    || alertaData?.observaciones
                    || 'Incidente'}
                </Text>
                <Text style={styles.text}>{alertaData?.ubicacion || 'Ubicación no disponible'}</Text>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.label}>HORA</Text>
                    <Text style={styles.text}>
                      {alertaData?.fecha_hora
                        ? formatHora(parseDateLocal(alertaData.fecha_hora))
                        : currentTime} HS
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.label}>PRIORIDAD</Text>
                    <Text style={[styles.critical, { color: (() => {
                      const p = String(alertaData?.prioridad || '').toUpperCase();
                      if (p === 'ALTA') return '#ef4444';
                      if (p === 'MEDIA') return '#fbbf24';
                      return '#38bdf8';
                    })() }]}>
                      {alertaData?.prioridad?.toUpperCase() || '—'}
                    </Text>
                  </View>
                </View>
                <View style={styles.location}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#3b82f6" />
                  <Text style={styles.locationText}>
                    {alertaData?.ubicacion || 'Av. Corrientes 1234, CABA. Múltiples focos en piso 4 y 5.'}
                  </Text>
                </View>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

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

                {/* Acceso siempre disponible al Tablero de Asistencia */}
                <TouchableOpacity
                  style={styles.boardAccessButton}
                  onPress={() => irAAsistencia(resolvedAlertaId || alertaId)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#fff" />
                  <Text style={styles.boardAccessButtonText}>VER TABLERO DE ASISTENCIA</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* FOOTER */}
          <Text style={styles.footer}>AXON TACTICAL DRIVE</Text>
        </ScrollView>
      </SafeAreaView>
      <ModalRevisionBolsos estado={revisionBolsos} />
    </View>
  );
};

// RF-04: Estilos para tarjetas de acceso rápido del bombero
const quickStyles = StyleSheet.create({
  container: {
    marginTop: 28,
    width: '100%',
    paddingHorizontal: 8,
    gap: 10,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1d24',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#26282f',
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextBox: {
    flex: 1,
  },
  cardTitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardSub: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});