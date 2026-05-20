import React, { useState, useRef, useEffect } from 'react';
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

  const estaVacio   = texto.length === 0;
  const esValido    = esHoraValida(texto);

  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={[
        inputStyles.container,
        readOnly  && inputStyles.containerReadOnly,
        enfocado  && inputStyles.containerFocused,
        esValido  && !readOnly && inputStyles.containerValid,
      ]}>
        {/* Ícono izquierdo */}
        <MaterialCommunityIcons
          name={icono}
          size={18}
          color={
            readOnly    ? '#475569'
            : esValido  ? '#22c55e'
            : enfocado  ? '#3b82f6'
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
  wrapper:    { marginBottom: 16 },
  label:      { color: '#64748b', fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  container:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(17,24,39,0.8)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  containerReadOnly: { backgroundColor: 'rgba(15,20,28,0.9)', borderColor: 'rgba(71,85,105,0.3)', borderStyle: 'dashed' },
  containerFocused:  { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.05)' },
  containerValid:    { borderColor: 'rgba(34,197,94,0.4)' },
  input:      { flex: 1, color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 2 },
  readOnlyBox:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  readOnlyTexto:    { color: '#475569', fontSize: 22, fontWeight: '700', letterSpacing: 2 },
  badgeReadOnly:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(71,85,105,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeReadOnlyTexto: { color: '#475569', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  ayuda:            { color: '#475569', fontSize: 10, fontWeight: '500', marginTop: 4 },
  ayudaReadOnly:    { color: '#334155', fontSize: 9, fontWeight: '500', marginTop: 3, fontStyle: 'italic' },
});

// ── Componente principal ──────────────────────────────────────────────────────

export default function EmergencyScreen({ route }) {
  const alertaId = route?.params?.alerta_id ?? null;
  const { user }  = useAuth();
  const usuarioId = user?.id    ?? null;
  const token     = user?.token ?? null;

  const [respuesta, setRespuesta]         = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [alertaData, setAlertaData]       = useState(null);
  const [loadingAlerta, setLoadingAlerta] = useState(false);

  // ── AX-14: Tiempos críticos ──────────────────────────────────────────────
  // Hora de llamado: se captura automáticamente al confirmar (o desde alertaData)
  const [horaLlamado, setHoraLlamado]   = useState('');
  const [horaSalida, setHoraSalida]     = useState('');
  const [horaRegreso, setHoraRegreso]   = useState('');
  const [guardandoTiempos, setGuardandoTiempos] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const soundRef  = useRef(null);
  const vibrationRef = useRef(null);

  // ── Sonido y vibración ───────────────────────────────────────────────────
  const startEmergencyAlert = async () => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/siren.mp3'),
        { isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
      await sound.playAsync();
      vibrationRef.current = setInterval(() => Vibration.vibrate(1000), 1500);
    } catch (e) { console.log('Error playing sound:', e); }
  };

  const stopEmergencyAlert = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (vibrationRef.current) { clearInterval(vibrationRef.current); vibrationRef.current = null; }
    Vibration.cancel();
  };

  useEffect(() => {
    startEmergencyAlert();
    return () => { stopEmergencyAlert(); };
  }, []);

  // ── Cargar alerta ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!alertaId) return;
    const fetchAlerta = async () => {
      setLoadingAlerta(true);
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/alerta/${alertaId}`, { headers });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setAlertaData(data);

        // AX-14: extraemos la hora de llamado automáticamente del backend
        if (data?.fecha_hora) {
          setHoraLlamado(formatHora(new Date(data.fecha_hora)));
        }
      } catch (err) {
        console.error('Error al cargar alerta:', err);
      } finally {
        setLoadingAlerta(false);
      }
    };
    fetchAlerta();
  }, [alertaId, token]);

  // ── Animaciones ──────────────────────────────────────────────────────────
  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };

  const animateOut = (callback) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(callback);
    scaleAnim.setValue(0.8);
  };

  // ── Confirmar/rechazar asistencia ────────────────────────────────────────
  const enviarRespuesta = async (estadoRespuesta) => {
    if (!alertaId || !usuarioId) {
      await stopEmergencyAlert();
      // AX-14: capturamos la hora de llamado si no vino del backend
      if (!horaLlamado) setHoraLlamado(formatHora(new Date()));
      setRespuesta(estadoRespuesta);
      animateIn();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE_URL}/respuestas_alertas/responder/${alertaId}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            estado_respuesta: estadoRespuesta,
            fecha_hora: new Date().toISOString(),
          }),
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);

      await stopEmergencyAlert();
      // AX-14: si no se cargó del backend, capturamos ahora
      if (!horaLlamado) setHoraLlamado(formatHora(new Date()));
      setRespuesta(estadoRespuesta);
      animateIn();
    } catch (err) {
      console.error('Error al enviar respuesta:', err);
      setError('No se pudo registrar la respuesta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // ── AX-14: Guardar tiempos críticos ─────────────────────────────────────
  // Usa POST /registros_comunicacion/crear hasta que el backend implemente
  // un endpoint específico de tiempos críticos.
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
  };

  const cambiarRespuesta = () => {
    animateOut(() => {
      setRespuesta(null);
      setError(null);
      setHoraSalida('');
      setHoraRegreso('');
      startEmergencyAlert();
    });
  };

  const currentTime = formatHora(new Date());
  const currentDate = new Date()
    .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase();

  // ── Render: pantalla de confirmación + formulario de tiempos ─────────────
  if (respuesta !== null) {
    const esAceptado = respuesta === 'ACEPTADO';

    return (
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
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

                {/* HORA DE LLAMADO — Read-Only (AX-14 tarea imagen 2) */}
                <InputHora
                  label="Hora de Llamado"
                  value={horaLlamado}
                  onChange={() => {}} // no-op, es read-only
                  readOnly={true}
                  icono="phone-incoming"
                />

                {/* HORA DE SALIDA — Editable (AX-14 tarea imagen 3) */}
                <InputHora
                  label="Hora de Salida del Móvil *"
                  value={horaSalida}
                  onChange={setHoraSalida}
                  readOnly={false}
                  icono="truck-fast-outline"
                />

                {/* HORA DE REGRESO — Editable (AX-14 tarea imagen 3) */}
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
                  {guardandoTiempos
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <MaterialCommunityIcons name="content-save-check-outline" size={16} color="#fff" />
                        <Text style={styles.botonGuardarTiemposTexto}>GUARDAR TIEMPOS</Text>
                      </>
                  }
                </TouchableOpacity>
              </Animated.View>
            )}

            <TouchableOpacity style={styles.changeButton} onPress={cambiarRespuesta}>
              <MaterialCommunityIcons name="refresh" size={16} color="#90a4ae" />
              <Text style={styles.changeButtonText}>Cambiar mi respuesta</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>AXON TACTICAL DRIVE</Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Render: pantalla de emergencia (sin cambios) ─────────────────────────
  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.time}>{currentTime}</Text>
            <Text style={styles.date}>{currentDate}</Text>
          </View>

          <View style={styles.alertBox}>
            <MaterialCommunityIcons name="alert" size={24} color="#fff" />
            <View>
              <Text style={styles.alertTitle}>¡ALERTA DE EMERGENCIA!</Text>
              <Text style={styles.alertSubtitle}>AXON CODE</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>TIPO DE INCIDENTE</Text>
            <Text style={styles.text}>{alertaData?.observaciones || 'Incendio Estructural - Edificio'}</Text>
            <Text style={styles.text}>{alertaData?.ubicacion || 'Ubicación no disponible'}</Text>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>HORA</Text>
                <Text style={styles.text}>
                  {alertaData?.fecha_hora
                    ? formatHora(new Date(alertaData.fecha_hora))
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

          {error && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.buttonDisabled]}
              onPress={() => enviarRespuesta('ACEPTADO')}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
              }
              <Text style={styles.buttonText}>CONFIRMAR ASISTENCIA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rejectButton, loading && styles.buttonDisabled]}
              onPress={() => enviarRespuesta('RECHAZADO')}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialCommunityIcons name="close-circle-outline" size={20} color="#fff" />
              }
              <Text style={styles.buttonText}>RECHAZAR</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>AXON TACTICAL DRIVE</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0a0f12', padding: 20 },
  confirmScroll:   { flexGrow: 1, paddingBottom: 40 },

  header:          { alignItems: 'center', marginBottom: 20 },
  time:            { fontSize: 48, color: '#fff', fontWeight: 'bold' },
  date:            { color: '#90a4ae', fontSize: 12, letterSpacing: 2 },
  alertBox:        { flexDirection: 'row', gap: 10, backgroundColor: '#dc2626', padding: 16, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  alertTitle:      { color: '#fff', fontWeight: 'bold' },
  alertSubtitle:   { color: '#fecaca', fontSize: 12 },
  card:            { backgroundColor: 'rgba(17,24,39,0.7)', padding: 20, borderRadius: 16, marginBottom: 20 },
  label:           { color: '#90a4ae', fontSize: 10, marginBottom: 4 },
  text:            { color: '#fff', marginBottom: 4 },
  critical:        { color: '#ef4444', fontWeight: 'bold' },
  row:             { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  location:        { flexDirection: 'row', gap: 8, marginTop: 10 },
  locationText:    { color: '#cfd8dc', flex: 1 },
  errorBox:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText:       { color: '#ef4444', fontSize: 13, flex: 1 },
  actions:         { marginTop: 30, gap: 10, paddingBottom: 20 },
  confirmButton:   { backgroundColor: '#dc2626', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  rejectButton:    { backgroundColor: '#1f2937', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  buttonDisabled:  { opacity: 0.6 },
  buttonText:      { color: '#fff', fontWeight: 'bold' },
  footer:          { textAlign: 'center', color: '#455a64', marginTop: 20, fontSize: 10 },

  // Confirmación
  confirmationCard:         { width: '100%', borderRadius: 24, padding: 32, alignItems: 'center', gap: 10, borderWidth: 1, marginBottom: 20 },
  confirmationCardAccepted: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  confirmationCardRejected: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  confirmationTitle:        { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 6 },
  confirmationSubtitle:     { color: '#90a4ae', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  confirmationBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 6 },
  confirmationTime:         { color: '#90a4ae', fontSize: 12 },
  changeButton:             { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(144,164,174,0.3)', alignSelf: 'center', marginTop: 8 },
  changeButtonText:         { color: '#90a4ae', fontSize: 14 },

  // ── AX-14: Card de tiempos críticos ──────────────────────────────────────
  tiemposCard: {
    backgroundColor: 'rgba(17,24,39,0.85)',
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)',
  },
  tiemposHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6,
  },
  tiemposTitulo: {
    color: '#dc2626', fontSize: 11, fontWeight: '900', letterSpacing: 1.2,
  },
  tiemposDesc: {
    color: '#475569', fontSize: 11, fontWeight: '500',
    marginBottom: 20, lineHeight: 16,
  },
  botonGuardarTiempos: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#dc2626',
    borderRadius: 10, paddingVertical: 14, marginTop: 4,
  },
  botonGuardarTiemposTexto: {
    color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1,
  },
});