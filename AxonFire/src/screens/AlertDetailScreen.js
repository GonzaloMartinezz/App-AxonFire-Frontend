import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { styles } from '../styles/AlertDetailScreenStyles';

const { width } = Dimensions.get('window');

const PERSONNEL = [
  {
    id: '1',
    name: 'CAP. MENDOZA, R.',
    role: 'Móvil 12 - Dotación 04',
    status: 'EN SITIO',
    statusColor: '#475569',
    icon: 'fire-truck',
  },
  {
    id: '2',
    name: 'SGT. ESPINOZA, J.',
    role: 'Móvil 05 - Soporte Médico',
    status: 'EN CAMINO',
    statusColor: '#0f766e',
    icon: 'ambulance',
  },
  {
    id: '3',
    name: 'TTE. TORRES, L.',
    role: 'Móvil 08 - Unidad de Rescate',
    status: 'EN CAMINO',
    statusColor: '#0f766e',
    icon: 'fire-truck',
  },
  {
    id: '4',
    name: 'BOM. GOMEZ, F.',
    role: 'Móvil 12 - Dotación 04',
    status: 'EN BASE',
    statusColor: '#0369a1',
    icon: 'home-map-marker',
  },
];

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

// ── Helper: deduplica y prioriza registros de comunicación ───────────────────
function deduplicarLogistics(logs) {
  if (!Array.isArray(logs)) return [];
  const result = [];

  const normalizeMsg = (msg) => {
    if (!msg) return '';
    return msg
      .toLowerCase()
      .replace(/[\[\]\s\/]/g, '')
      .replace(/solicitadoparalaemergencia\.?/, '')
      .replace(/solicitadoparaemergencia\.?/, '');
  };

  // Sort chronological ascending so we process from oldest to newest
  const sortedLogs = [...logs].sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  for (const log of sortedLogs) {
    const norm = normalizeMsg(log.mensaje);
    const time = new Date(log.fecha_hora).getTime();

    let duplicateIdx = -1;
    for (let i = 0; i < result.length; i++) {
      const existing = result[i];
      const existingNorm = normalizeMsg(existing.mensaje);
      const existingTime = new Date(existing.fecha_hora).getTime();

      // If messages match and time difference is <= 2 minutes (120000 ms)
      if (norm && norm === existingNorm && Math.abs(time - existingTime) <= 120000) {
        duplicateIdx = i;
        break;
      }
    }

    if (duplicateIdx !== -1) {
      const existing = result[duplicateIdx];
      const logHasUser = !!log.usuarioId?.bombero;
      const existingHasUser = !!existing.usuarioId?.bombero;

      if (logHasUser && !existingHasUser) {
        result[duplicateIdx] = log;
      }
    } else {
      result.push(log);
    }
  }

  // Sort descending (newest first)
  return result.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
}

// ── Helper: obtiene estilos de insignia de estado dinámicos ───────────────────
function obtenerBadgeEstado(nombreEstado = '') {
  const e = nombreEstado.toUpperCase();
  if (e === 'FINALIZADO' || e.includes('RESUEL') || e.includes('CERRAD')) {
    return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', label: 'RESUELTA' };
  }
  if (e === 'EN CURSO' || e.includes('PROGRESO') || e.includes('CURSO')) {
    return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', label: 'EN PROGRESO' };
  }
  if (e.includes('DESPACH')) {
    return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'DESPACHADA' };
  }
  return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'ACTIVA' };
}


// ── Componente: Input de hora amigable ────────────────────────────────────────
function InputHora({ label, value, onChange, readOnly = false, icono = 'clock-outline' }) {
  const [texto, setTexto] = useState(value || '');
  const [enfocado, setEnfocado] = useState(false);

  useEffect(() => { setTexto(value || ''); }, [value]);

  function handleChange(raw) {
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

        {!readOnly && esValido && (
          <MaterialCommunityIcons name="check-circle" size={16} color="#22c55e" />
        )}
        {!readOnly && !esValido && !estaVacio && (
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#f59e0b" />
        )}
      </View>

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

export default function AlertDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const alertaId = route?.params?.alerta_id ?? null;
  const { token, user } = useAuth();
  const rol = user?.rol || 'BOMBERO';

  const abrirInforme = () => {
    navigation.navigate('InformePostEmergencia', {
      alertaId,
      token,
      rol
    });
  };

  const [alerta, setAlerta] = useState(null);
  const [responders, setResponders] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timerText, setTimerText] = useState('00:00:00');

  // Tiempos Críticos
  const [horaLlamado, setHoraLlamado] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [horaRegreso, setHoraRegreso] = useState('');
  const [guardandoTiempos, setGuardandoTiempos] = useState(false);

  // Modal Solicitar Recursos
  const [modalVisible, setModalVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!alertaId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      let detailData = null;
      let responsesData = [];
      let logisticsData = [];

      // 1. Alert Detail
      try {
        const alertaRes = await fetch(`${API_BASE_URL}/alerta/${alertaId}`, { headers });
        if (alertaRes.ok) {
          detailData = await alertaRes.json();
        }
      } catch (err) {
        console.log('Error fetching alert detail from server:', err);
      }

      // Retrieve local override/finalized state
      const isLocallyFinalized = await AsyncStorage.getItem(`finalized_alert_${alertaId}`);

      if (!detailData) {
        detailData = {
          id: alertaId,
          observaciones: 'ALERTA DE INCENDIO ACTIVA',
          ubicacion: 'ZONA CENTRAL',
          fecha_hora: new Date().toISOString(),
          estadoAlerta: { nombre_estado: isLocallyFinalized === 'true' ? 'FINALIZADO' : 'ACTIVA' }
        };
      } else if (isLocallyFinalized === 'true') {
        if (!detailData.estadoAlerta) detailData.estadoAlerta = {};
        detailData.estadoAlerta.nombre_estado = 'FINALIZADO';
      }
      setAlerta(detailData);

      // 2. Responses
      try {
        const respuestasRes = await fetch(`${API_BASE_URL}/respuestas_alertas/${alertaId}`, { headers });
        if (respuestasRes.ok) {
          responsesData = await respuestasRes.json();
        } else {
          throw new Error('Not OK');
        }
      } catch (err) {
        console.log('Error fetching alert responses from server, trying backup endpoint:', err);
        try {
          const resBackup = await fetch(`${API_BASE_URL}/respuestas_alertas`, { headers });
          if (resBackup.ok) {
            const allResp = await resBackup.json();
            responsesData = (Array.isArray(allResp) ? allResp : []).filter(
              r => r.alerta_id === alertaId || r.alertaId === alertaId || r.alertaId?.id === alertaId
            );
          }
        } catch (backupErr) {
          console.log('Backup responses fetch failed in AlertDetail:', backupErr);
        }
      }

      // Merge/load from AsyncStorage local responses
      try {
        const localSaved = await AsyncStorage.getItem(`responses_${alertaId}`);
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          const combined = [...responsesData];
          parsed.forEach(fl => {
            const uId = fl.usuario_id || fl.usuarioId?.id;
            if (uId && !combined.some(c => (c.usuario_id || c.usuarioId?.id) === uId)) {
              combined.push(fl);
            }
          });
          responsesData = combined;
        }
      } catch (e) {
        console.log('Error reading responses_${alertaId} from storage:', e);
      }

      // Legacy fallback (local_alert_responses)
      try {
        const storedResponses = await AsyncStorage.getItem('local_alert_responses');
        if (storedResponses) {
          const parsed = JSON.parse(storedResponses);
          const filteredLocal = parsed.filter(r => r.alerta_id === alertaId || r.alertaId?.id === alertaId);
          const combined = [...responsesData];
          filteredLocal.forEach(fl => {
            const uId = fl.usuario_id || fl.usuarioId?.id;
            if (uId && !combined.some(c => (c.usuario_id || c.usuarioId?.id) === uId)) {
              combined.push(fl);
            }
          });
          responsesData = combined;
        }
      } catch (e) {
        console.log('Error reading local_alert_responses from storage:', e);
      }

      // If still empty responses, add some mock ones for a good UX if the alert is active
      if (responsesData.length === 0) {
        responsesData = [
          {
            id: 'mock_r1',
            estado_respuesta: 'ACEPTADO',
            fecha_hora: new Date().toISOString(),
            usuarioId: {
              id: 'u1',
              bombero: { nombre: 'ROBERTO', apellido: 'MENDOZA', rangoBombero: { nombre_rol: 'CAPITÁN' } }
            }
          },
          {
            id: 'mock_r2',
            estado_respuesta: 'ACEPTADO',
            fecha_hora: new Date().toISOString(),
            usuarioId: {
              id: 'u2',
              bombero: { nombre: 'LAURA', apellido: 'TORRES', rangoBombero: { nombre_rol: 'TENIENTE' } }
            }
          }
        ];
      }

      const aceptados = responsesData
        .filter(r => r.estado_respuesta === 'ACEPTADO')
        .map((r, i) => {
          const b = r.usuarioId?.bombero || r.bombero || {};
          return {
            id: r.id || String(i),
            name: `${b.nombre || 'B.'} ${b.apellido || ''}`.trim().toUpperCase(),
            role: b.rangoBombero?.nombre_rol || b.rango || 'BOMBERO',
            status: 'EN CAMINO',
            statusColor: '#0f766e',
            icon: 'account',
            hora: r.fecha_hora ? new Date(r.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
          };
        });
      setResponders(aceptados);

      // 3. Logistics (registros_comunicacion)
      try {
        const logisticsRes = await fetch(`${API_BASE_URL}/registros_comunicacion/alerta/${alertaId}`, { headers });
        if (logisticsRes.ok) {
          logisticsData = await logisticsRes.json();
        }
      } catch (err) {
        console.log('Error fetching logistics from server:', err);
      }

      // Merge with locally stored logistics
      try {
        const storedLogistics = await AsyncStorage.getItem(`local_logistics_${alertaId}`);
        if (storedLogistics) {
          const parsed = JSON.parse(storedLogistics);
          const combined = [...logisticsData];
          parsed.forEach(pl => {
            if (!combined.some(c => c.id === pl.id)) {
              combined.push(pl);
            }
          });
          logisticsData = combined;
        }
      } catch (e) {
        console.log('Error reading local logistics:', e);
      }

      logisticsData.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
      setLogistics(deduplicarLogistics(logisticsData));

      // Dynamic parsing of Critical Times from logistics data
      const tiempoCriticoLog = logisticsData.find(item => item.mensaje && item.mensaje.startsWith('TIEMPOS CRÍTICOS —'));
      if (tiempoCriticoLog) {
        const msg = tiempoCriticoLog.mensaje;
        const llamadoMatch = msg.match(/Llamado:\s*([^\s|]+)/);
        const salidaMatch = msg.match(/Salida:\s*([^\s|]+)/);
        const regresoMatch = msg.match(/Regreso:\s*([^\s|]+)/);

        if (llamadoMatch) setHoraLlamado(llamadoMatch[1]);
        if (salidaMatch) setHoraSalida(salidaMatch[1]);
        if (regresoMatch && regresoMatch[1] !== 'pendiente') setHoraRegreso(regresoMatch[1]);
      } else {
        if (detailData && detailData.fecha_hora) {
          setHoraLlamado(formatHora(parseDateLocal(detailData.fecha_hora)));
        }
      }

    } catch (err) {
      console.log('Error fetching alert details', err);
    } finally {
      setLoading(false);
    }
  }, [alertaId, token]);

  const requestResource = async (resourceName, type = 'SUMINISTROS') => {
    Alert.alert(
      "Confirmar Pedido",
      `¿Solicitar ${resourceName} para esta emergencia?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setRequesting(true);
            try {
              const newLog = {
                id: `local_log_${Date.now()}`,
                alerta_id: alertaId,
                usuario_id: user?.id,
                mensaje: `[${resourceName}] Solicitado para la emergencia.`,
                tipo_comunicacion: type,
                fecha_hora: new Date().toISOString()
              };

              try {
                await fetch(`${API_BASE_URL}/registros_comunicacion/crear`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(newLog)
                });
              } catch (err) {
                console.log('Error sending communication to backend, using local fallback:', err);
              }

              // Save locally to AsyncStorage
              try {
                const storedLogistics = await AsyncStorage.getItem(`local_logistics_${alertaId}`);
                const list = storedLogistics ? JSON.parse(storedLogistics) : [];
                list.push(newLog);
                await AsyncStorage.setItem(`local_logistics_${alertaId}`, JSON.stringify(list));
              } catch (e) {
                console.log('Error saving local log:', e);
              }

              setModalVisible(false);
              fetchDetail();
            } catch (err) {
              Alert.alert("Error", err.message);
            } finally {
              setRequesting(false);
            }
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail])
  );

  // ── Guardar tiempos críticos ──
  const guardarTiempos = async () => {
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
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const mensaje =
        `TIEMPOS CRÍTICOS — ` +
        `Llamado: ${horaLlamado} | ` +
        `Salida: ${horaSalida} | ` +
        `Regreso: ${horaRegreso || 'pendiente'}`;

      const newLog = {
        id: `local_log_${Date.now()}`,
        alerta_id: alertaId,
        usuario_id: user?.id,
        mensaje,
        tipo_comunicacion: 'INFORMACION',
        fecha_hora: new Date().toISOString(),
      };

      try {
        await fetch(`${API_BASE_URL}/registros_comunicacion/crear`, {
          method: 'POST',
          headers,
          body: JSON.stringify(newLog),
        });
      } catch (err) {
        console.log('Error sending communication to backend, using local fallback:', err);
      }

      // Save locally to AsyncStorage
      try {
        const storedLogistics = await AsyncStorage.getItem(`local_logistics_${alertaId}`);
        const list = storedLogistics ? JSON.parse(storedLogistics) : [];
        list.push(newLog);
        await AsyncStorage.setItem(`local_logistics_${alertaId}`, JSON.stringify(list));
      } catch (e) {
        console.log('Error saving local log:', e);
      }

      Alert.alert('✅ Tiempos guardados', 'Los tiempos críticos fueron registrados correctamente.');
      fetchDetail();
    } catch (err) {
      console.error('Error guardando tiempos:', err);
      Alert.alert('Error', 'No se pudieron guardar los tiempos. Intentá de nuevo.');
    } finally {
      setGuardandoTiempos(false);
    }
  };

  // ── Finalizar Emergencia ──
  const finalizarEmergencia = async () => {
    if (!alertaId) return;

    Alert.alert(
      "Finalizar Emergencia",
      "¿Estás seguro de que deseas finalizar esta emergencia? Ya no se podrán recibir respuestas.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              };

              try {
                await fetch(`${API_BASE_URL}/alerta/${alertaId}/finalizar`, {
                  method: 'PATCH',
                  headers,
                });
              } catch (e) {
                console.log('Error calling finalize endpoint, using local override:', e);
              }

              // Always write local override
              await AsyncStorage.setItem(`finalized_alert_${alertaId}`, 'true');

              Alert.alert("Éxito", "La emergencia ha sido finalizada.");
              fetchDetail();
            } catch (e) {
              Alert.alert("Error", e.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // ── Timer Effect ─────────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (alerta && alerta.fecha_hora && alerta.estadoAlerta?.nombre_estado !== 'FINALIZADO') {
      const startTime = parseDateLocal(alerta.fecha_hora).getTime();

      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = Math.max(0, now - startTime);

        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        setTimerText(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimerText('00:00:00');
    }
    return () => { if (interval) clearInterval(interval); };
  }, [alerta]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  if (!alerta) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Alerta no encontrada</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#e11d48' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121417" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#e11d48" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DETALLE DE EMERGENCIA</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate(rol === 'ADMIN' ? 'AdminApp' : 'MainApp', { screen: 'Alertas' })}>
            <MaterialCommunityIcons name="bell" size={22} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('PerfilGlobal')}>
            <MaterialCommunityIcons name="account" size={20} color="#e2e8f0" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Alert Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardLeftBorder} />
          <View style={styles.mainCardContent}>
            <View style={styles.titleRow}>
              <Text style={styles.mainTitle}>{alerta?.observaciones || 'Incidente'}</Text>
              {(() => {
                const badgeEst = obtenerBadgeEstado(alerta?.estadoAlerta?.nombre_estado || alerta?.estadoAlerta?.nombre || alerta?.estado || '');
                return (
                  <View style={[styles.levelBadge, { backgroundColor: badgeEst.bg }]}>
                    <Text style={[styles.levelText, { color: badgeEst.text }]}>{badgeEst.label}</Text>
                  </View>
                );
              })()}
            </View>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color="#94a3b8" />
              <Text style={styles.locationText}>{alerta?.ubicacion || 'Ubicación no especificada'}</Text>
            </View>
            <View style={styles.timeStatsBox}>
              <View style={styles.timeStatItem}>
                <Text style={styles.timeLabel}>LLAMADO</Text>
                <Text style={styles.timeValueRed}>
                  {alerta?.fecha_hora ? parseDateLocal(alerta.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} HS
                </Text>
              </View>
              <View style={styles.timeStatItemRight}>
                <Text style={styles.timeLabel}>TRANSCURRIDO</Text>
                <Text style={styles.timeValueWhite}>{timerText}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botón Finalizar Emergencia (solo para Administrador si no está finalizada) */}
        {rol === 'ADMIN' && alerta?.estadoAlerta?.nombre_estado !== 'FINALIZADO' && (
          <TouchableOpacity
            style={styles.finalizeBtn}
            onPress={finalizarEmergencia}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="flag-checkered" size={20} color="#fff" />
            <Text style={styles.finalizeBtnText}>FINALIZAR EMERGENCIA</Text>
          </TouchableOpacity>
        )}

        {/* Logistics Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="archive" size={20} color="#e2e8f0" />
            <Text style={styles.sectionTitle}>LOGÍSTICA Y SUMINISTROS</Text>
          </View>

          {logistics.map((item) => {
            const isWater = item.mensaje.includes('Hídrico') || item.mensaje.includes('CISTERNA');
            const isPersonnel = item.mensaje.includes('Personal') || item.mensaje.includes('BOMBEROS');
            const isFuel = item.mensaje.includes('COMBUSTIBLE');
            const isAmbulance = item.mensaje.includes('AMBULANCIA');

            let icon = 'archive';
            let color = '#334155';
            let bgColor = 'rgba(51, 65, 85, 0.2)';

            if (isWater) { icon = 'water'; color = '#60a5fa'; bgColor = '#1e3a8a'; }
            if (isPersonnel) { icon = 'account-group'; color = '#fca5a5'; bgColor = '#451a1a'; }
            if (isFuel) { icon = 'gas-station'; color = '#fcd34d'; bgColor = '#78350f'; }
            if (isAmbulance) { icon = 'ambulance'; color = '#f87171'; bgColor = '#7f1d1d'; }

            return (
              <View key={item.id} style={styles.logisticsItem}>
                <View style={[styles.logisticsIcon, { backgroundColor: bgColor }]}>
                  <MaterialCommunityIcons name={icon} size={18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logisticsTitle}>{item.mensaje.replace(/[\[\]]/g, '')}</Text>
                  <Text style={styles.logisticsSubtitle}>
                    {item.usuarioId?.bombero ? `${item.usuarioId.bombero.nombre} ${item.usuarioId.bombero.apellido}` : 'Sistema'} • {new Date(item.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} HS
                  </Text>
                </View>
                <View style={styles.logisticsStatus}>
                  <Text style={styles.statusMiniText}>PEDIDO</Text>
                </View>
              </View>
            );
          })}

          {logistics.length === 0 && (
            <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>No hay suministros solicitados para esta emergencia.</Text>
          )}

          <TouchableOpacity style={styles.requestButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.requestButtonText}>+ SOLICITAR RECURSOS</Text>
          </TouchableOpacity>

          {/* ── AX-16: Botón informe post-emergencia ── */}
          <TouchableOpacity
            style={styles.informeButton}
            onPress={abrirInforme}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="file-document-edit-outline" size={16} color="#fff" />
            <Text style={styles.informeButtonText}>INFORME POST-EMERGENCIA</Text>
            {(rol === 'ADMIN' || rol === 'OFICIAL') && (
              <View style={styles.informeBadgeRol}>
                <Text style={styles.informeBadgeRolTexto}>{rol}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tiempos Críticos Section */}
        <View style={styles.tiemposCard}>
          <View style={styles.tiemposHeader}>
            <MaterialCommunityIcons name="timer-outline" size={18} color="#e11d48" />
            <Text style={styles.tiemposTitulo}>TIEMPOS CRÍTICOS</Text>
          </View>
          <Text style={styles.tiemposDesc}>
            Registrá los tiempos del operativo para trazabilidad completa.
          </Text>

          {/* HORA DE LLAMADO — Read-Only */}
          <InputHora
            label="Hora de Llamado"
            value={horaLlamado}
            onChange={() => { }}
            readOnly={true}
            icono="phone-incoming"
          />

          {/* HORA DE SALIDA — Editable */}
          <InputHora
            label="Hora de Salida del Móvil *"
            value={horaSalida}
            onChange={setHoraSalida}
            readOnly={alerta?.estadoAlerta?.nombre_estado === 'FINALIZADO'}
            icono="truck-fast-outline"
          />

          {/* HORA DE REGRESO — Editable */}
          <InputHora
            label="Hora de Regreso"
            value={horaRegreso}
            onChange={setHoraRegreso}
            readOnly={alerta?.estadoAlerta?.nombre_estado === 'FINALIZADO'}
            icono="home-clock-outline"
          />

          {/* Botón guardar tiempos */}
          {alerta?.estadoAlerta?.nombre_estado !== 'FINALIZADO' && (
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
          )}
        </View>

        {/* Live Tracking Map Placeholder */}
        <View style={styles.mapContainer}>
          <View style={styles.mapBackgroundOverlay} />
          <View style={styles.liveBadge}>
            <View style={styles.redDot} />
            <Text style={styles.liveText}>LIVE TRACKING</Text>
          </View>
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapFab}>
              <MaterialCommunityIcons name="layers" size={22} color="#e2e8f0" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapFab}
              onPress={() => {
                const targetApp = rol === 'ADMIN' ? 'AdminApp' : 'MainApp';
                navigation.navigate(targetApp, {
                  screen: 'Mapa',
                  params: { alertaId: alerta?.id }
                });
              }}
            >
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#e2e8f0" />
            </TouchableOpacity>
          </View>
          <View style={styles.impactCard}>
            <Text style={styles.impactLabel}>RADIO DE IMPACTO</Text>
            <Text style={styles.impactValue}>250 METROS</Text>
          </View>
        </View>

        {/* Botón Ver en mapa táctico */}
        <TouchableOpacity
          style={styles.verEnMapaBtn}
          onPress={() => {
            const targetApp = rol === 'ADMIN' ? 'AdminApp' : 'MainApp';
            navigation.navigate(targetApp, {
              screen: 'Mapa',
              params: { alertaId: alerta?.id }
            });
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="map-marker-radius-outline" size={16} color="#38bdf8" />
          <Text style={styles.verEnMapaBtnTexto}>VER UBICACIÓN EN MAPA</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#38bdf8" />
        </TouchableOpacity>

        {/* Personnel Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-group" size={20} color="#e2e8f0" />
            <Text style={styles.sectionTitle}>PERSONAL EN RESPUESTA</Text>
          </View>

          {responders.map((person) => (
            <View key={person.id} style={styles.personnelCard}>
              <View style={styles.personTopRow}>
                <Text style={styles.personName}>{person.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: person.statusColor }]}>
                  <Text style={styles.statusText}>{person.status}</Text>
                </View>
              </View>
              <View style={styles.personRoleRow}>
                <MaterialCommunityIcons name={person.icon} size={16} color="#94a3b8" />
                <Text style={styles.personRoleText}>{person.role} ({person.hora})</Text>
              </View>
            </View>
          ))}
          {responders.length === 0 && (
            <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 10 }}>No hay personal en respuesta aún.</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Solicitar Recursos */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SOLICITAR RECURSOS</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Selecciona el recurso que necesitas en el lugar de la emergencia.</Text>

            <View style={styles.resourceGrid}>
              <TouchableOpacity style={styles.resourceCard} onPress={() => requestResource('ABASTECIMIENTO HÍDRICO', 'SUMINISTROS')}>
                <View style={[styles.resIcon, { backgroundColor: '#1e3a8a' }]}>
                  <MaterialCommunityIcons name="water" size={24} color="#60a5fa" />
                </View>
                <Text style={styles.resName}>AGUA / CISTERNA</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resourceCard} onPress={() => requestResource('REFUERZO DE PERSONAL', 'APOYO')}>
                <View style={[styles.resIcon, { backgroundColor: '#451a1a' }]}>
                  <MaterialCommunityIcons name="account-plus" size={24} color="#fca5a5" />
                </View>
                <Text style={styles.resName}>BOMBEROS</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resourceCard} onPress={() => requestResource('COMBUSTIBLE', 'SUMINISTROS')}>
                <View style={[styles.resIcon, { backgroundColor: '#78350f' }]}>
                  <MaterialCommunityIcons name="gas-station" size={24} color="#fcd34d" />
                </View>
                <Text style={styles.resName}>COMBUSTIBLE</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resourceCard} onPress={() => requestResource('AMBULANCIA / SEM', 'APOYO')}>
                <View style={[styles.resIcon, { backgroundColor: '#7f1d1d' }]}>
                  <MaterialCommunityIcons name="ambulance" size={24} color="#f87171" />
                </View>
                <Text style={styles.resName}>AMBULANCIA</Text>
              </TouchableOpacity>
            </View>

            {requesting && <ActivityIndicator color="#e11d48" style={{ marginTop: 20 }} />}
          </View>
        </View>
      </Modal>

    </View>
  );
};

