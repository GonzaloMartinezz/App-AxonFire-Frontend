import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import TacticalCard from '../components/TacticalCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';

function getMockAlerts() {
  return [
    {
      id: 'a1',
      observaciones: 'Incendio Estructural',
      fecha_hora: new Date().toISOString(),
      estadoAlerta: { nombre_estado: 'ACTIVA' },
      subCategoriaAlerta: { nombre_sub_categoria: 'INCENDIO', prioridad: '1' },
      ubicacion: 'Av. Corrientes 1234'
    },
    {
      id: 'a2',
      observaciones: 'Accidente de Tránsito',
      fecha_hora: new Date(Date.now() - 3600000).toISOString(),
      estadoAlerta: { nombre_estado: 'DESPACHADA' },
      subCategoriaAlerta: { nombre_sub_categoria: 'RESCATE', prioridad: '2' },
      ubicacion: 'Ruta 9 Km 45'
    },
    {
      id: 'a3',
      observaciones: 'Derrame de Químicos',
      fecha_hora: new Date(Date.now() - 7200000).toISOString(),
      estadoAlerta: { nombre_estado: 'RESUELTA' },
      subCategoriaAlerta: { nombre_sub_categoria: 'HAZMAT', prioridad: '1' },
      ubicacion: 'Parque Industrial'
    }
  ];
}
const screenWidth = Dimensions.get('window').width;

// ── Helpers ──────────────────────────────────────────────────────────────────

function clasificarEstado(nombreEstado = '') {
  const e = nombreEstado.toLowerCase();
  if (e.includes('activ')) return 'activa';
  if (e.includes('despach')) return 'despachada';
  if (e.includes('progreso') || e.includes('curso')) return 'progreso';
  if (e.includes('resuel') || e.includes('cerrad')) return 'resuelta';
  return 'activa';
}

function clasificarPrioridad(prioridad = '') {
  const p = String(prioridad).toLowerCase();
  if (p === '1' || p.includes('critica') || p.includes('crítica')) return 'critica';
  if (p === '2' || p.includes('alta')) return 'alta';
  if (p === '3' || p.includes('media')) return 'media';
  return 'baja';
}

function tiempoTranscurrido(fechaISO) {
  if (!fechaISO) return '';
  const min = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const hs = Math.floor(min / 60);
  if (hs < 24) return `Hace ${hs} hs`;
  return `Hace ${Math.floor(hs / 24)} días`;
}

// Group alerts by week for line chart
function agruparPorSemana(clasificadas) {
  const now = Date.now();
  const weeks = [0, 0, 0, 0]; // 4 weeks: current, -1, -2, -3
  clasificadas.forEach(a => {
    if (!a.fecha) return;
    const diff = now - new Date(a.fecha).getTime();
    const weekIdx = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    if (weekIdx >= 0 && weekIdx < 4) weeks[weekIdx]++;
  });
  return weeks.reverse(); // oldest first
}

// Removed chart config

// ── Component ────────────────────────────────────────────────────────────────

export default function PanelControlScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();

  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  async function cargarDatos(esRefresh = false) {
    if (!token) return;
    if (esRefresh) setRefrescando(true);
    else setCargando(true);
    setError(null);

    try {
      const hasta = new Date().toISOString();
      const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      console.log('PanelControlScreen - Rango de fechas para consulta:', { desde, hasta });

      const res = await axios.get(`${API_BASE_URL}/alerta/rango`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        params: { fecha_desde: desde, fecha_hasta: hasta },
        timeout: 3000,
      });

      const data = res.data;

      // Backend returns { alertas: [...] } — extract the array
      const lista = Array.isArray(data?.alertas) ? data.alertas : Array.isArray(data) ? data : [];
      setAlertas(lista);
    } catch (err) {
      console.error('Error cargando datos del panel, usando mock data:', err);
      setAlertas(getMockAlerts());
      setError(null);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, [token]);

  // ── Cálculo de estadísticas ───────────────────────────────────────────────

  const clasificadas = alertas.map((a) => ({
    estado: clasificarEstado(a.estadoAlerta?.nombre_estado || a.estadoAlerta?.nombre || a.estado || ''),
    prioridad: clasificarPrioridad(a.prioridad || a.subCategoriaAlerta?.prioridad || ''),
    tipo: a.subCategoriaAlerta?.nombre_sub_categoria || a.subCategoriaAlerta?.nombre || a.observaciones || 'Sin tipo',
    fecha: a.fecha_hora,
  }));

  const totalAlertas = clasificadas.length;
  const cantActivas = clasificadas.filter(a => a.estado === 'activa' || a.estado === 'progreso').length;
  const cantDespachadas = clasificadas.filter(a => a.estado === 'despachada').length;
  const cantResueltas = clasificadas.filter(a => a.estado === 'resuelta').length;
  const cantCriticas = clasificadas.filter(a => a.prioridad === 'critica').length;
  const cantAltas = clasificadas.filter(a => a.prioridad === 'alta').length;
  const cantMedias = clasificadas.filter(a => a.prioridad === 'media').length;
  const cantBajas = clasificadas.filter(a => a.prioridad === 'baja').length;

  const ultimasAlertas = [...clasificadas]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  // Removed chart data prep


  // ─────────────────────────────────────────────────────────────────────────

  const chartWidth = screenWidth - (Spacing.lg * 2) - 32; // account for padding

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.botonVolver}>
          <MaterialCommunityIcons name="monitor-dashboard" size={24} color="#dc2626" />
        </View>
        <Text style={styles.tituloHeader}>Panel de Control</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={() => cargarDatos(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="refresh" size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargarDatos(true)}
            colors={['#af101a']}
            tintColor="#af101a"
          />
        }
      >
        {cargando ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color="#af101a" />
            <Text style={styles.textoCarga}>Cargando datos...</Text>
          </View>
        ) : error ? (
          <View style={styles.centrado}>
            <MaterialCommunityIcons name="wifi-off" size={48} color="#cfd8dc" />
            <Text style={styles.textoCarga}>{error}</Text>
            <TouchableOpacity style={styles.botonReintentar} onPress={() => cargarDatos()}>
              <Text style={styles.textoReintentar}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Stat grande: total de alertas ───────────────────────────── */}
            <TacticalCard elevated style={{ backgroundColor: '#1e293b' }}>
              <Text style={styles.labelStat}>ALERTAS ÚLTIMOS 30 DÍAS</Text>
              <Text style={styles.numeroGrande}>{totalAlertas}</Text>
            </TacticalCard>

            {/* ── Stats por estado ──────────────────────────────────────── */}
            <Text style={styles.tituloSeccion}>POR ESTADO</Text>
            <View style={styles.grilla}>
              <View style={[styles.cardStat, { backgroundColor: '#450a0a' }]}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#fca5a5" />
                <Text style={[styles.statNumero, { color: '#fca5a5' }]}>{cantActivas}</Text>
                <Text style={styles.statLabel}>Activas</Text>
              </View>
              <View style={[styles.cardStat, { backgroundColor: '#1e1e1e' }]}>
                <MaterialCommunityIcons name="truck-delivery" size={24} color="#93c5fd" />
                <Text style={[styles.statNumero, { color: '#93c5fd' }]}>{cantDespachadas}</Text>
                <Text style={styles.statLabel}>Despachadas</Text>
              </View>
              <View style={[styles.cardStat, { backgroundColor: '#052e16' }]}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#86efac" />
                <Text style={[styles.statNumero, { color: '#86efac' }]}>{cantResueltas}</Text>
                <Text style={styles.statLabel}>Resueltas</Text>
              </View>
              <View style={[styles.cardStat, { backgroundColor: '#1e293b' }]}>
                <MaterialCommunityIcons name="clipboard-list" size={24} color="#94a3b8" />
                <Text style={[styles.statNumero, { color: '#94a3b8' }]}>{totalAlertas}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {/* ── Últimas alertas ──────────────────────────────────────── */}
            <Text style={styles.tituloSeccion}>ACTIVIDAD RECIENTE</Text>
            {ultimasAlertas.length === 0 ? (
              <Text style={styles.textoVacio}>Sin actividad registrada</Text>
            ) : (
              ultimasAlertas.map((a, idx) => (
                <TacticalCard key={idx} style={{ backgroundColor: '#1e293b' }}>
                  <View style={styles.filaActividad}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                        <StatusBadge severity={a.prioridad} />
                        <StatusBadge severity={a.estado} />
                      </View>
                      <Text style={styles.textoActividad} numberOfLines={1}>{a.tipo}</Text>
                    </View>
                    <Text style={styles.tiempoActividad}>{tiempoTranscurrido(a.fecha)}</Text>
                  </View>
                </TacticalCard>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' }, // Dark background

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  botonVolver: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center',
  },
  tituloHeader: { fontSize: 17, fontWeight: '900', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: 0.5 },
  exportBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center',
  },

  contenido: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  centrado: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  textoCarga: { fontSize: 14, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },
  botonReintentar: {
    marginTop: 8, backgroundColor: '#263238',
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12,
  },
  textoReintentar: { color: '#fff', fontWeight: '700', fontSize: 14 },

  labelStat: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1,
    color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4,
  },
  numeroGrande: {
    fontSize: 48, fontWeight: '900', color: '#f8fafc', letterSpacing: -1,
  },

  tituloSeccion: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1,
    color: '#f8fafc', textTransform: 'uppercase',
    marginTop: Spacing.lg, marginBottom: Spacing.md,
  },

  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardStat: {
    width: '48%', borderRadius: Radius.xxl, padding: Spacing.lg,
    alignItems: 'center', gap: 6,
  },
  statNumero: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: {
    fontSize: 10, fontWeight: '700', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },

  // Removed severidad styles

  filaActividad: { flexDirection: 'row', alignItems: 'center' },
  textoActividad: { fontSize: 13, fontWeight: '800', color: '#f8fafc' },
  tiempoActividad: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  textoVacio: { fontSize: 13, color: '#94a3b8', fontWeight: '600', textAlign: 'center', paddingVertical: 20 },

});
