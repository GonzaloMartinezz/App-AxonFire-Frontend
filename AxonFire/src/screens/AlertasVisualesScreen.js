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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ── Helpers ─────────────────────────────────────────────────────

function getIconoAlerta(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('incendio') || n.includes('fuego'))
    return { icono: 'fire', color: '#fca5a5', fondo: '#2d1515' };
  if (n.includes('rescate') || n.includes('vehicular'))
    return { icono: 'car-wrench', color: '#fbbf24', fondo: '#271e05' };
  if (n.includes('gas') || n.includes('quimico') || n.includes('hazmat'))
    return { icono: 'biohazard', color: '#f87171', fondo: '#2d1515' };
  if (n.includes('medic') || n.includes('ambulancia'))
    return { icono: 'ambulance', color: '#38bdf8', fondo: '#0f2a3a' };
  if (n.includes('estructur'))
    return { icono: 'office-building', color: '#c084fc', fondo: '#1a0a2e' };
  return { icono: 'alert-circle', color: '#94a3b8', fondo: '#1b1d24' };
}

function estadoAKey(estado = '') {
  const e = estado.toUpperCase();
  if (e === 'PENDIENTE') return 'activa';
  if (e === 'EN CURSO') return 'progreso';
  if (e === 'FINALIZADO') return 'resuelta';
  if (e.includes('ACTIV')) return 'activa';
  if (e.includes('DESPACH')) return 'despachada';
  if (e.includes('PROGRESO') || e.includes('CURSO')) return 'progreso';
  if (e.includes('RESUEL') || e.includes('CERRAD')) return 'resuelta';
  return 'activa';
}

function prioridadAKey(prioridad = '') {
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

// Badge de severidad
const SEVERIDAD_CONFIG = {
  critica:    { label: 'CRÍTICA',    color: '#fca5a5', bg: '#2d1515' },
  alta:       { label: 'ALTA',       color: '#fbbf24', bg: '#271e05' },
  media:      { label: 'MEDIA',      color: '#38bdf8', bg: '#0f2a3a' },
  baja:       { label: 'BAJA',       color: '#94a3b8', bg: '#1e293b' },
  activa:     { label: 'ACTIVA',     color: '#fca5a5', bg: '#2d1515' },
  progreso:   { label: 'EN CURSO',   color: '#fbbf24', bg: '#271e05' },
  despachada: { label: 'DESPACHADA', color: '#38bdf8', bg: '#0f2a3a' },
  resuelta:   { label: 'RESUELTA',   color: '#34d399', bg: '#0a2518' },
};

function SeveridadBadge({ type }) {
  const cfg = SEVERIDAD_CONFIG[type] || SEVERIDAD_CONFIG.baja;
  return (
    <View style={[badgeStyle.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[badgeStyle.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const badgeStyle = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  text: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});

// ── Filtros ─────────────────────────────────────────────────────
const FILTROS = ['Activas', 'Despachadas', 'Resueltas', 'Todas'];

// ── Componente principal ─────────────────────────────────────────
export default function AlertasVisualesScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const usuarioId = user?.id || '';

  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('Activas');

  useEffect(() => {
    if (route?.params?.filtro) setFiltro(route.params.filtro);
  }, [route?.params?.filtro]);

  async function cargarAlertas(esRefresh = false) {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);
    setError(null);

    let fetchedData = null;

    try {
      const hasta = new Date().toISOString();
      const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await axios.get(`${API_BASE_URL}/alerta/rango`, {
          params: { fecha_desde: desde, fecha_hasta: hasta },
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 15000,
        }
      );
      fetchedData = res.data;
    } catch (err) {
      console.error('Error cargando alertas, usando fallback local:', err);
      fetchedData = [
        {
          id: '1', tipo: 'Incendio Estructural', estado: 'activa', prioridad: 'critica',
          ubicacion: 'Av. Siempre Viva 742', observaciones: 'Fuego en planta baja.',
          fecha_hora: new Date().toISOString(),
        },
        {
          id: '2', tipo: 'Rescate Vehicular', estado: 'despachada', prioridad: 'alta',
          ubicacion: 'Ruta 9, Km 45', observaciones: 'Choque entre dos vehículos.',
          fecha_hora: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3', tipo: 'Fuga de Gas', estado: 'resuelta', prioridad: 'media',
          ubicacion: 'Centro comercial', observaciones: 'Situación controlada.',
          fecha_hora: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
    } finally {
      if (fetchedData) {
        const lista = Array.isArray(fetchedData?.alertas)
          ? fetchedData.alertas
          : Array.isArray(fetchedData) ? fetchedData : [];

        const normalizadas = lista.map((item) => {
          const nombre = item.subCategoriaAlerta?.nombre || item.tipo || 'Emergencia';
          const estado = item.estadoAlerta?.nombre || item.estado || '';
          const prioridad = item.prioridad || item.subCategoriaAlerta?.prioridad || '';
          return {
            id: item.id,
            nombre,
            direccion: item.ubicacion || 'Sin ubicación',
            observaciones: item.observaciones || '',
            tiempo: tiempoTranscurrido(item.fecha_hora),
            severidad: prioridadAKey(prioridad),
            estado: estadoAKey(estado),
            ...getIconoAlerta(nombre),
            raw: item,
          };
        });
        setAlertas(normalizadas);
      }
      setCargando(false);
      setRefrescando(false);
    }
  }

  useEffect(() => { cargarAlertas(); }, []);

  const filtradas = alertas.filter((a) => {
    if (filtro === 'Activas') return ['activa', 'progreso'].includes(a.estado);
    if (filtro === 'Despachadas') return a.estado === 'despachada';
    if (filtro === 'Resueltas') return a.estado === 'resuelta';
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#16181d" />

      {/* ── Top Bar ────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>ALERTAS VISUALES</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => cargarAlertas(true)} disabled={refrescando}>
          <MaterialCommunityIcons name="refresh" size={18} color={refrescando ? '#334155' : '#64748b'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargarAlertas(true)}
            colors={['#dc2626']}
            tintColor="#dc2626"
          />
        }
      >
        {/* ── Header ───────────────────────────────────── */}
        <Text style={styles.pageLabel}>OPERACIONES</Text>
        <Text style={styles.pageTitle}>HISTORIAL DE{'\n'}ALERTAS</Text>

        {/* ── Filtros ──────────────────────────────────── */}
        <View style={styles.filtersRow}>
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFiltro(f)}
              style={[styles.filterChip, filtro === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filtro === f && styles.filterChipTextActive]}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Loading ───────────────────────────────────── */}
        {cargando && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.stateText}>Cargando alertas...</Text>
          </View>
        )}

        {/* ── Error ─────────────────────────────────────── */}
        {!cargando && error && (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="wifi-off" size={48} color="#334155" />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => cargarAlertas()}>
              <Text style={styles.retryText}>REINTENTAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Vacío ─────────────────────────────────────── */}
        {!cargando && !error && filtradas.length === 0 && (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color="#052e16" />
            <Text style={styles.stateText}>Sin alertas {filtro.toLowerCase()}</Text>
          </View>
        )}

        {/* ── Lista de alertas ─────────────────────────── */}
        {!cargando && !error && filtradas.map((alerta) => (
          <TouchableOpacity
            key={alerta.id}
            activeOpacity={0.75}
            onPress={() =>
              navigation.navigate('ListaAsistencia', {
                alertaId: alerta.id,
                token,
                usuarioId,
              })
            }
          >
            <View style={styles.alertCard}>
              {/* Barra lateral de criticidad */}
              {alerta.severidad === 'critica' && <View style={styles.barraRoja} />}

              <View style={styles.alertRow}>
                {/* Ícono */}
                <View style={[styles.alertIconBox, { backgroundColor: alerta.fondo }]}>
                  <MaterialCommunityIcons name={alerta.icono} size={24} color={alerta.color} />
                </View>

                {/* Contenido */}
                <View style={{ flex: 1 }}>
                  <View style={styles.badgesRow}>
                    <SeveridadBadge type={alerta.severidad} />
                    <SeveridadBadge type={alerta.estado} />
                  </View>
                  <Text style={styles.alertNombre} numberOfLines={1}>{alerta.nombre}</Text>
                  <Text style={styles.alertDireccion} numberOfLines={1}>{alerta.direccion}</Text>
                  {alerta.observaciones ? (
                    <Text style={styles.alertObs} numberOfLines={2}>{alerta.observaciones}</Text>
                  ) : null}
                  <Text style={styles.alertTiempo}>{alerta.tiempo}</Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={20} color="#334155" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16181d' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1a1c23',
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  scrollContent: { padding: 24 },

  pageLabel: {
    fontSize: 10,
    color: '#fca5a5',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
    lineHeight: 30,
    marginBottom: 24,
  },

  // Filters
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
  },
  filterChipActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // States
  centered: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  stateText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryText: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
  },

  // Alert cards
  alertCard: {
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  barraRoja: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#dc2626',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  alertIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  alertNombre: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 2,
  },
  alertDireccion: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  alertObs: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  alertTiempo: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
});
