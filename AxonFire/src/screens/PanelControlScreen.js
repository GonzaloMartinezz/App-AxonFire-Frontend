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
// ── Helpers ──────────────────────────────────────────────────────────────────

function clasificarEstado(nombreEstado = '') {
  const e = nombreEstado.toUpperCase();
  if (e === 'PENDIENTE') return 'activa';
  if (e === 'EN CURSO') return 'progreso';
  if (e === 'FINALIZADO') return 'resuelta';
  
  if (e.includes('ACTIV')) return 'activa';
  if (e.includes('DESPACH')) return 'despachada';
  if (e.includes('PROGRESO') || e.includes('CURSO')) return 'progreso';
  if (e.includes('RESUEL') || e.includes('CERRAD')) return 'resuelta';
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

function getAlertIcon(tipo = '') {
  const t = tipo.toLowerCase();
  if (t.includes('incendio') || t.includes('fuego')) return { icon: 'fire', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  if (t.includes('rescate') || t.includes('accidente') || t.includes('vehicular')) return { icon: 'car-wrench', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' };
  if (t.includes('gas') || t.includes('quimico') || t.includes('hazmat')) return { icon: 'biohazard', color: '#fca5a5', bg: 'rgba(252, 165, 165, 0.12)' };
  if (t.includes('medic') || t.includes('ambulancia')) return { icon: 'ambulance', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
  return { icon: 'alert-circle', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' };
}

function getPriorityColor(prioridad = '') {
  const p = String(prioridad).toLowerCase();
  if (p === 'critica' || p.includes('1')) return '#ef4444';
  if (p === 'alta' || p.includes('2')) return '#fbbf24';
  if (p === 'media' || p.includes('3')) return '#38bdf8';
  return '#6ee7b7';
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PanelControlScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();

  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  async function cargarDatos(esRefresh = false) {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);
    setError(null);

    try {
      const hasta = new Date().toISOString();
      const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const res = await axios.post(
        `${API_BASE_URL}/alerta/rango`,
        { fecha_desde: desde, fecha_hasta: hasta },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 15000,
        }
      );

      const data = res.data;
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

  async function limpiarBaseDeDatos() {
    Alert.alert(
      "BORRÓN PARA TEST",
      "¿Deseas eliminar todo el historial de pruebas para iniciar un test limpio? Esta acción borrará todas las alertas y registros de comunicación.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "BORRAR TODO", 
          style: "destructive",
          onPress: async () => {
            setCargando(true);
            try {
              await axios.delete(`${API_BASE_URL}/alerta/limpiar`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert("Éxito", "La base de datos ha sido limpiada.");
              cargarDatos();
            } catch (err) {
              console.error('Error limpiando base de datos:', err);
              Alert.alert("Error", "No se pudo limpiar la base de datos.");
            } finally {
              setCargando(false);
            }
          }
        }
      ]
    );
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const clasificadas = alertas.map((a) => ({
    id: a.id,
    estado: clasificarEstado(a.estadoAlerta?.nombre_estado || a.estadoAlerta?.nombre || a.estado || ''),
    prioridad: clasificarPrioridad(a.prioridad || a.subCategoriaAlerta?.prioridad || ''),
    tipo: a.subCategoriaAlerta?.nombre_sub_categoria || a.subCategoriaAlerta?.nombre || a.observaciones || 'Sin tipo',
    fecha: a.fecha_hora,
    ubicacion: a.ubicacion || 'Sin ubicación',
    observaciones: a.observaciones || '',
  }));

  const totalAlertas = clasificadas.length;
  const cantActivas = clasificadas.filter(a => a.estado === 'activa' || a.estado === 'progreso').length;
  const cantDespachadas = clasificadas.filter(a => a.estado === 'despachada').length;
  const cantResueltas = clasificadas.filter(a => a.estado === 'resuelta').length;

  const resolucionRate = totalAlertas > 0 ? (cantResueltas / totalAlertas) * 100 : 0;

  const ultimasAlertas = [...clasificadas]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1c23" />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <MaterialCommunityIcons name="monitor-dashboard" size={22} color="#e11d48" />
          <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => {
              Alert.alert(
                "Vista Operativa",
                "¿Deseas visualizar la aplicación con el rol de Bombero Operativo?",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Cambiar Vista", onPress: () => navigation.navigate('MainApp') }
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-switch" size={20} color="#dc2626" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => cargarDatos(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="refresh" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargarDatos(true)}
            colors={['#dc2626']}
            tintColor="#dc2626"
          />
        }
      >
        {cargando ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.textoCarga}>Cargando datos del panel...</Text>
          </View>
        ) : error ? (
          <View style={styles.centrado}>
            <MaterialCommunityIcons name="wifi-off" size={48} color="#ef4444" />
            <Text style={styles.textoCarga}>{error}</Text>
            <TouchableOpacity style={styles.botonReintentar} onPress={() => cargarDatos()}>
              <Text style={styles.textoReintentar}>REINTENTAR</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.titleLeftGroup}>
                <View style={styles.redAccent} />
                <View>
                  <Text style={styles.headerLabel}>SISTEMA DE MONITOREO</Text>
                  <Text style={styles.mainTitle}>PANEL DE{"\n"}CONTROL</Text>
                </View>
              </View>
            </View>

            {/* ── Stat grande: total de alertas con barra de resolución ── */}
            <View style={styles.totalCard}>
              <View style={styles.totalLeft}>
                <Text style={styles.totalLabel}>ALERTAS REGISTRADAS (ÚLTIMOS 30 DÍAS)</Text>
                <Text style={styles.totalValue}>{String(totalAlertas).padStart(2, '0')}</Text>
              </View>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.progressBarLabel}>EFICIENCIA DE RESOLUCIÓN</Text>
                  <Text style={[styles.progressBarPercent, { color: '#10b981' }]}>{resolucionRate.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${resolucionRate}%` }]} />
                </View>
              </View>
            </View>

            {/* ── Stats por estado interactivos ────────────────────────── */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>ESTADOS DE EMERGENCIA</Text>
            </View>

            <View style={styles.grilla}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('AlertasVisuales', { filtro: 'Activas' })}
                style={[styles.cardStat, { borderLeftColor: '#ef4444' }]}
              >
                <View style={styles.cardStatHeader}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
                  <Text style={styles.statNumero}>{cantActivas}</Text>
                </View>
                <Text style={styles.statLabel}>Activas</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('AlertasVisuales', { filtro: 'Despachadas' })}
                style={[styles.cardStat, { borderLeftColor: '#3b82f6' }]}
              >
                <View style={styles.cardStatHeader}>
                  <MaterialCommunityIcons name="truck-delivery" size={20} color="#3b82f6" />
                  <Text style={styles.statNumero}>{cantDespachadas}</Text>
                </View>
                <Text style={styles.statLabel}>Despachadas</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('AlertasVisuales', { filtro: 'Resueltas' })}
                style={[styles.cardStat, { borderLeftColor: '#10b981' }]}
              >
                <View style={styles.cardStatHeader}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                  <Text style={styles.statNumero}>{cantResueltas}</Text>
                </View>
                <Text style={styles.statLabel}>Resueltas</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('AlertasVisuales', { filtro: 'Todas' })}
                style={[styles.cardStat, { borderLeftColor: '#94a3b8' }]}
              >
                <View style={styles.cardStatHeader}>
                  <MaterialCommunityIcons name="clipboard-list" size={20} color="#94a3b8" />
                  <Text style={styles.statNumero}>{totalAlertas}</Text>
                </View>
                <Text style={styles.statLabel}>Total</Text>
              </TouchableOpacity>
            </View>

            {/* ── Acceso a Centro Logístico ───────────────────────────────── */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Logistica')}
              style={styles.logisticCard}
            >
              <View style={styles.logisticCardLeft}>
                <View style={styles.logisticIconBg}>
                  <MaterialCommunityIcons name="truck-delivery" size={22} color="#fff" />
                </View>
                <View style={styles.logisticDetails}>
                  <Text style={styles.logisticCardTitle}>CENTRO LOGÍSTICO</Text>
                  <Text style={styles.logisticCardSub}>Control de móviles, checklists de servicio y refuerzos</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#64748b" />
            </TouchableOpacity>

            {/* ── Acceso a Gestión de Personal ────────────────────────────── */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Personal')}
              style={[styles.logisticCard, { marginTop: 8 }]}
            >
              <View style={styles.logisticCardLeft}>
                <View style={[styles.logisticIconBg, { backgroundColor: '#4f46e5' }]}>
                  <MaterialCommunityIcons name="account-group" size={22} color="#fff" />
                </View>
                <View style={styles.logisticDetails}>
                  <Text style={styles.logisticCardTitle}>GESTIÓN DE PERSONAL</Text>
                  <Text style={styles.logisticCardSub}>Administración de bomberos, rangos y estado operativo</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#64748b" />
            </TouchableOpacity>

            {/* ── Actividad reciente ────────────────────────────────────── */}
            <View style={[styles.sectionHeader, { marginTop: 28 }]}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>ACTIVIDAD RECIENTE</Text>
              <TouchableOpacity onPress={limpiarBaseDeDatos} style={styles.botonTest}>
                <MaterialCommunityIcons name="delete-sweep" size={14} color="#e11d48" />
                <Text style={styles.botonTestText}>LIMPIAR</Text>
              </TouchableOpacity>
            </View>

            {ultimasAlertas.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="shield-check" size={40} color="#334155" />
                <Text style={styles.textoVacio}>Sin actividad registrada</Text>
              </View>
            ) : (
              ultimasAlertas.map((a, idx) => {
                const iconInfo = getAlertIcon(a.tipo);
                const priorityColor = getPriorityColor(a.prioridad);
                return (
                  <TouchableOpacity 
                    key={a.id || idx} 
                    onPress={() => navigation.navigate('AlertDetail', { alerta_id: a.id })} 
                    activeOpacity={0.8}
                    style={[styles.alertCard, { borderLeftColor: priorityColor }]}
                  >
                    <View style={styles.alertCardLeft}>
                      <View style={[styles.alertIconBg, { backgroundColor: iconInfo.bg }]}>
                        <MaterialCommunityIcons name={iconInfo.icon} size={22} color={iconInfo.color} />
                      </View>
                      <View style={styles.alertDetails}>
                        <Text style={styles.alertTitle} numberOfLines={1}>{a.tipo.toUpperCase()}</Text>
                        <Text style={styles.alertSubtitle} numberOfLines={1}>{a.ubicacion}</Text>
                        <View style={styles.alertBadgesRow}>
                          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                            <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
                              {a.prioridad.toUpperCase()}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: a.estado === 'resuelta' ? '#064e3b' : '#451a1a' }]}>
                            <Text style={[styles.statusBadgeText, { color: a.estado === 'resuelta' ? '#10b981' : '#fca5a5' }]}>
                              {a.estado.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.alertCardRight}>
                      <Text style={styles.alertTime}>{tiempoTranscurrido(a.fecha)}</Text>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#64748b" />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16181d' },

  // Top Bar
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
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarTitle: {
    color: '#e11d48',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconBtn: {
    padding: 4,
  },

  contenido: { padding: 24 },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  titleLeftGroup: {
    flexDirection: 'row',
    flex: 1,
  },
  redAccent: {
    width: 3,
    backgroundColor: '#dc2626',
    marginRight: 12,
    marginTop: 4,
  },
  headerLabel: {
    fontSize: 10,
    color: '#fca5a5',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 33,
  },

  centrado: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  textoCarga: { fontSize: 12, color: '#64748b', marginTop: 12 },
  botonReintentar: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#26282f',
    borderRadius: 4,
  },
  textoReintentar: { color: '#e2e8f0', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  // Total Card
  totalCard: {
    backgroundColor: '#1b1d24',
    borderRadius: 6,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#26282f',
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
  totalLeft: { marginBottom: 16 },
  totalLabel: { fontSize: 9, color: '#94a3b8', letterSpacing: 1, fontWeight: '700', marginBottom: 6 },
  totalValue: { fontSize: 32, fontWeight: '900', color: '#fff' },
  progressBarLabel: { fontSize: 8, color: '#94a3b8', fontWeight: '800', letterSpacing: 0.5 },
  progressBarPercent: { fontSize: 10, fontWeight: '900' },
  progressBarBg: { height: 6, backgroundColor: '#26282f', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },

  // Section Header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionLine: { width: 6, height: 18, borderRadius: 3, backgroundColor: '#dc2626', marginRight: 10 },
  sectionTitle: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 2, flex: 1 },

  // Grilla
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardStat: {
    width: '48%',
    backgroundColor: '#1b1d24',
    borderRadius: 6,
    padding: 14,
    borderLeftWidth: 3,
    gap: 8,
    borderWidth: 1,
    borderColor: '#26282f',
  },
  cardStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statNumero: { fontSize: 24, fontWeight: '900', color: '#f8fafc' },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Alert Card (Actividad Reciente)
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#1b1d24',
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#26282f',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIconBg: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  alertTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 4,
  },
  alertBadgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  priorityBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  alertCardRight: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  textoVacio: { fontSize: 12, color: '#64748b', fontWeight: '800', letterSpacing: 0.5 },
  
  botonTest: {
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  botonTestText: { fontSize: 9, color: '#e11d48', fontWeight: '900', letterSpacing: 0.5 },
  logisticCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1b1d24',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#26282f',
    borderLeftWidth: 3,
    borderLeftColor: '#e11d48',
    padding: 16,
    marginBottom: 20,
    marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#e11d48', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 3 },
      web: { boxShadow: '0px 4px 12px rgba(225, 29, 72, 0.08)' }
    }),
  },
  logisticCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  logisticIconBg: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logisticDetails: {
    flex: 1,
    gap: 2,
  },
  logisticCardTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  logisticCardSub: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 15,
  },
});
