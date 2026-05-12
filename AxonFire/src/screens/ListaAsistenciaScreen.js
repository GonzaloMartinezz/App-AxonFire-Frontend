import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from '../theme';
import TacticalCard from '../components/TacticalCard';

import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Configuración visual por estado de respuesta
const CONFIG_ESTADO = {
  ACEPTADO:  { icono: 'check-circle',  color: '#388e3c', fondo: '#e8f5e9', texto: 'Confirmó'  },
  RECHAZADO: { icono: 'close-circle',  color: '#af101a', fondo: '#fce4ec', texto: 'Rechazó'   },
  PENDIENTE: { icono: 'clock-outline',  color: '#F57C00', fondo: '#fff3e0', texto: 'Pendiente' },
};

function tiempoTranscurrido(fechaISO) {
  if (!fechaISO) return '—';
  const min = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  return `Hace ${Math.floor(min / 60)} hs`;
}

export default function ListaAsistenciaScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const usuarioId = user?.id || '';

  // Estos params llegan cuando navegás desde AlertsScreen o desde el menú
  // pasándole el id de la alerta que querés ver
  const alertaId = route?.params?.alertaId;

  const [alerta, setAlerta] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  // Si el usuario actual ya respondió, guardamos su estado para ocultar los botones
  const [miRespuesta, setMiRespuesta] = useState(null);

  // ── Cargar la alerta ──────────────────────────────────────────────────────
  async function cargarAlerta() {
    if (!alertaId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/alerta/${alertaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerta(res.data);
    } catch (err) {
      console.error('Error cargando alerta:', err);
    }
  }

  // ── Cargar las respuestas (la lista de asistencia) ────────────────────────
  async function cargarRespuestas(esRefresh = false) {
    if (!alertaId) return;
    if (esRefresh) setRefrescando(true);
    else setCargando(true);

    try {
      // Traemos las respuestas específicas de esta alerta
      const res = await axios.get(`${API_BASE_URL}/respuestas_alertas/${alertaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];

      setRespuestas(data);

      // Verificamos si el usuario actual ya respondió
      const yaRespondi = data.find(
        (r) => r.usuario_id === usuarioId || r.usuarioId === usuarioId
      );
      if (yaRespondi) setMiRespuesta(yaRespondi.estado_respuesta);

    } catch (err) {
      console.error('Error cargando respuestas:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }

  useEffect(() => {
    cargarAlerta();
    cargarRespuestas();
  }, []);

  // ── Responder a la alerta ─────────────────────────────────────────────────
  async function responder(estado) {
    if (!usuarioId) {
      Alert.alert('Error', 'No se encontró tu usuario. Volvé a iniciar sesión.');
      return;
    }

    setRespondiendo(true);
    try {
      await axios.post(
        `${API_BASE_URL}/respuestas_alertas/responder/${alertaId}/${usuarioId}`,
        {
          estado_respuesta: estado,
          fecha_hora: new Date().toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMiRespuesta(estado);
      cargarRespuestas(true);

      Alert.alert(
        estado === 'ACEPTADO' ? '✅ Confirmado' : '❌ Rechazado',
        estado === 'ACEPTADO'
          ? 'Tu asistencia quedó registrada.'
          : 'Rechazaste la alerta. Quedó registrado.'
      );
    } catch (err) {
      console.error('Error al responder:', err);
      Alert.alert('Error', 'No se pudo enviar tu respuesta. Intentá de nuevo.');
    } finally {
      setRespondiendo(false);
    }
  }

  function confirmarRespuesta(estado) {
    Alert.alert(
      estado === 'ACEPTADO' ? 'Confirmar asistencia' : 'Rechazar alerta',
      estado === 'ACEPTADO'
        ? '¿Confirmás que vas a responder a esta emergencia?'
        : '¿Estás seguro que querés rechazar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: estado === 'ACEPTADO' ? 'Confirmar' : 'Rechazar',
          style: estado === 'ACEPTADO' ? 'default' : 'destructive',
          onPress: () => responder(estado),
        },
      ]
    );
  }

  // ── Contadores ────────────────────────────────────────────────────────────
  const confirmaron = respuestas.filter(r => r.estado_respuesta === 'ACEPTADO').length;
  const rechazaron = respuestas.filter(r => r.estado_respuesta === 'RECHAZADO').length;
  const pendientes = respuestas.filter(r => !r.estado_respuesta || r.estado_respuesta === 'PENDIENTE').length;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#263238" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Lista de Asistencia</Text>
        <TouchableOpacity style={styles.botonRefresh} onPress={() => cargarRespuestas(true)}>
          <MaterialCommunityIcons name="refresh" size={20} color="#263238" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargarRespuestas(true)}
            colors={['#af101a']}
            tintColor="#af101a"
          />
        }
      >
        {/* Info de la alerta */}
        {alerta && (
          <TacticalCard elevated style={{ marginBottom: 16 }}>
            <Text style={styles.labelSeccion}>ALERTA</Text>
            <Text style={styles.tituloAlerta}>
              {alerta.subCategoriaAlerta?.nombre || alerta.tipo || 'Emergencia'}
            </Text>
            <View style={styles.filaInfo}>
              <MaterialCommunityIcons name="map-marker" size={14} color="#94a3b8" />
              <Text style={styles.textoInfo}>{alerta.ubicacion || 'Sin ubicación'}</Text>
            </View>
            {alerta.observaciones ? (
              <View style={[styles.filaInfo, { marginTop: 4 }]}>
                <MaterialCommunityIcons name="text" size={14} color="#94a3b8" />
                <Text style={styles.textoInfo}>{alerta.observaciones}</Text>
              </View>
            ) : null}
          </TacticalCard>
        )}

        {/* Botones de respuesta (solo si el usuario todavía no respondió) */}
        {alertaId && !miRespuesta && (
          <View style={styles.filaAcciones}>
            <TouchableOpacity
              style={styles.botonRechazar}
              onPress={() => confirmarRespuesta('RECHAZADO')}
              disabled={respondiendo}
            >
              <MaterialCommunityIcons name="close" size={20} color="#af101a" />
              <Text style={styles.textoRechazar}>No puedo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonAceptar}
              onPress={() => confirmarRespuesta('ACEPTADO')}
              disabled={respondiendo}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#af101a', '#d32f2f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientAceptar}
              >
                {respondiendo ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                    <Text style={styles.textoAceptar}>VOY</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Mensaje si ya respondió */}
        {miRespuesta && (
          <View style={[
            styles.cardMiRespuesta,
            { backgroundColor: miRespuesta === 'ACEPTADO' ? '#e8f5e9' : '#fce4ec' }
          ]}>
            <MaterialCommunityIcons
              name={miRespuesta === 'ACEPTADO' ? 'check-circle' : 'close-circle'}
              size={22}
              color={miRespuesta === 'ACEPTADO' ? '#388e3c' : '#af101a'}
            />
            <Text style={[
              styles.textoMiRespuesta,
              { color: miRespuesta === 'ACEPTADO' ? '#388e3c' : '#af101a' }
            ]}>
              {miRespuesta === 'ACEPTADO' ? 'Ya confirmaste tu asistencia' : 'Rechazaste esta alerta'}
            </Text>
          </View>
        )}

        {/* Resumen numérico */}
        <Text style={styles.labelSeccion}>RESUMEN</Text>
        <View style={styles.filaResumen}>
          <View style={styles.itemResumen}>
            <Text style={[styles.resumenNumero, { color: '#388e3c' }]}>{confirmaron}</Text>
            <Text style={styles.resumenLabel}>Van</Text>
          </View>
          <View style={styles.resumenSeparador} />
          <View style={styles.itemResumen}>
            <Text style={[styles.resumenNumero, { color: '#F57C00' }]}>{pendientes}</Text>
            <Text style={styles.resumenLabel}>Pendientes</Text>
          </View>
          <View style={styles.resumenSeparador} />
          <View style={styles.itemResumen}>
            <Text style={[styles.resumenNumero, { color: '#af101a' }]}>{rechazaron}</Text>
            <Text style={styles.resumenLabel}>No van</Text>
          </View>
        </View>

        {/* Lista de bomberos */}
        <Text style={[styles.labelSeccion, { marginTop: Spacing.lg }]}>BOMBEROS ({respuestas.length})</Text>

        {cargando ? (
          <ActivityIndicator size="small" color="#af101a" style={{ marginTop: 16 }} />
        ) : respuestas.length === 0 ? (
          <View style={styles.centrado}>
            <MaterialCommunityIcons name="account-clock-outline" size={44} color="#cfd8dc" />
            <Text style={styles.textoVacio}>Nadie respondió todavía</Text>
          </View>
        ) : (
          <TacticalCard elevated>
            {respuestas.map((r, idx) => {
              const estado = r.estado_respuesta || 'PENDIENTE';
              const cfg = CONFIG_ESTADO[estado] || CONFIG_ESTADO.PENDIENTE;

              // Construimos el nombre con lo que venga del backend
              const nombre =
                r.usuario?.bombero?.nombre
                  ? `${r.usuario.bombero.nombre} ${r.usuario.bombero.apellido || ''}`.trim()
                  : r.usuario?.nombre_usuario || `Bombero ${String(r.usuario_id || '').slice(0, 6)}`;

              const rango = r.usuario?.bombero?.rangoBombero?.nombre_rol || '';

              return (
                <View key={r.id || idx}>
                  <View style={styles.filaBombero}>
                    <View style={[styles.avatarBombero, { backgroundColor: cfg.fondo }]}>
                      <MaterialCommunityIcons name="account" size={20} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nombreBombero} numberOfLines={1}>{nombre}</Text>
                      {rango ? <Text style={styles.rangoBombero}>{rango}</Text> : null}
                      <Text style={styles.horaBombero}>{tiempoTranscurrido(r.fecha_hora)}</Text>
                    </View>
                    <View style={[styles.badgeEstado, { backgroundColor: cfg.fondo }]}>
                      <MaterialCommunityIcons name={cfg.icono} size={14} color={cfg.color} />
                      <Text style={[styles.textoBadge, { color: cfg.color }]}>{cfg.texto}</Text>
                    </View>
                  </View>
                  {/* Línea separadora entre bomberos, menos en el último */}
                  {idx < respuestas.length - 1 && <View style={styles.lineaSeparadora} />}
                </View>
              );
            })}
          </TacticalCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  botonVolver: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  tituloHeader: { fontSize: 17, fontWeight: '800', color: Colors.onSurface },
  botonRefresh: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },

  contenido: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  labelSeccion: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: Spacing.sm,
  },
  tituloAlerta: {
    fontSize: 18, fontWeight: '900', color: Colors.onSurface,
    marginTop: 4, marginBottom: 8, lineHeight: 24,
  },
  filaInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  textoInfo: { fontSize: 13, color: '#94a3b8', fontWeight: '500', flex: 1 },

  filaAcciones: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  botonRechazar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, backgroundColor: '#fce4ec', borderRadius: 16,
  },
  textoRechazar: { fontSize: 13, fontWeight: '900', color: '#af101a' },
  botonAceptar: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  gradientAceptar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
  },
  textoAceptar: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 0.4 },

  cardMiRespuesta: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 16, marginBottom: 20,
  },
  textoMiRespuesta: { fontSize: 14, fontWeight: '700' },

  filaResumen: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    justifyContent: 'space-around', alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  itemResumen: { alignItems: 'center', flex: 1 },
  resumenNumero: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  resumenLabel: {
    fontSize: 10, fontWeight: '700', color: '#90a4ae',
    textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2,
  },
  resumenSeparador: { width: 1, height: 32, backgroundColor: '#f1f5f9' },

  centrado: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  textoVacio: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },

  filaBombero: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  avatarBombero: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  nombreBombero: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  rangoBombero: {
    fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1,
  },
  horaBombero: { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
  badgeEstado: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  textoBadge: { fontSize: 11, fontWeight: '700' },
  lineaSeparadora: { height: 1, backgroundColor: Colors.surfaceContainerLow, marginVertical: 2 },
});
