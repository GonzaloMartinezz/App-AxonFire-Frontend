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
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import TacticalCard from '../components/TacticalCard';
import StatusBadge from '../components/StatusBadge';

import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ── Helpers ──────────────────────────────────────────────────────────────────

// Convierte el estado que viene del backend a un key que yo pueda contar
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

// ── Componente principal ─────────────────────────────────────────────────────

export default function PanelControlScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [alertas, setAlertas] = useState([]);
  const [totalBomberos, setTotalBomberos] = useState(0);
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

      const [resAlertas, resBomberos] = await Promise.all([
        axios.post(`${API_BASE_URL}/alerta/rango`, 
          { fecha_desde: desde, fecha_hasta: hasta },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(`${API_BASE_URL}/usuarios/bomberos`, 
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);
      
      const data = resAlertas.data.alertas || [];
      setAlertas(Array.isArray(data) ? data : []);
      setTotalBomberos(resBomberos.data?.length || 0);
    } catch (err) {
      console.error('Error cargando datos del panel:', err);
      setError('No se pudo conectar al servidor.');
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

  // ── Cálculo de estadísticas ───────────────────────────────────────────────

  // Clasificamos cada alerta para poder contarlas
  const clasificadas = alertas.map((a) => ({
    id: a.id,
    estado: clasificarEstado(a.estadoAlerta?.nombre_estado || a.estado || ''),
    prioridad: clasificarPrioridad(a.prioridad || a.subCategoriaAlerta?.prioridad || ''),
    tipo: a.subCategoriaAlerta?.nombre_sub_categoria || a.tipo || 'Sin tipo',
    fecha: a.fecha_hora,
    ubicacion: a.ubicacion || 'Sin ubicación',
    observaciones: a.observaciones || '',
  }));

  const totalAlertas = clasificadas.length;
  const cantActivas = clasificadas.filter(a => a.estado === 'activa' || a.estado === 'progreso').length;
  const cantDespachadas = clasificadas.filter(a => a.estado === 'despachada').length;
  const cantResueltas = clasificadas.filter(a => a.estado === 'resuelta').length;
  const cantCriticas = clasificadas.filter(a => a.prioridad === 'critica').length;
  const cantAltas = clasificadas.filter(a => a.prioridad === 'alta').length;
  const cantMedias = clasificadas.filter(a => a.prioridad === 'media').length;
  const cantBajas = clasificadas.filter(a => a.prioridad === 'baja').length;

  // Las últimas 5 alertas para mostrar el historial reciente
  const ultimasAlertas = clasificadas
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  // Distribución por tipo (ej: Incendio vs Rescate)
  const countIncendios = clasificadas.filter(a => a.tipo.toLowerCase().includes('incendio') || a.tipo.toLowerCase().includes('fuego')).length;
  const countRescates = clasificadas.filter(a => a.tipo.toLowerCase().includes('rescate') || a.tipo.toLowerCase().includes('vehicular')).length;
  
  const pctIncendios = totalAlertas > 0 ? Math.round((countIncendios / totalAlertas) * 100) : 0;
  const pctRescates = totalAlertas > 0 ? Math.round((countRescates / totalAlertas) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.tituloHeader}>AXON FIRE - DASHBOARD</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.navigate('Personal')}>
            <MaterialCommunityIcons name="account-group" size={22} color="#263238" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.navigate('MainApp')}>
            <MaterialCommunityIcons name="fire-truck" size={22} color="#263238" />
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
            {/* ── Stats principales ───────────────────────────── */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <TacticalCard elevated>
                  <Text style={styles.labelStat}>ALERTAS (30D)</Text>
                  <Text style={styles.numeroGrande}>{totalAlertas}</Text>
                </TacticalCard>
              </View>
              <View style={{ flex: 1 }}>
                <TacticalCard elevated>
                  <Text style={styles.labelStat}>PERSONAL</Text>
                  <Text style={styles.numeroGrande}>{totalBomberos}</Text>
                </TacticalCard>
              </View>
            </View>

            {/* ── Stats por estado ──────────────────────────────────────── */}
            <Text style={styles.tituloSeccion}>POR ESTADO</Text>
            <View style={styles.grilla}>
              <View style={[styles.cardStat, { backgroundColor: '#fce4ec' }]}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#af101a" />
                <Text style={[styles.statNumero, { color: '#af101a' }]}>{cantActivas}</Text>
                <Text style={styles.statLabel}>Activas</Text>
              </View>
              <View style={[styles.cardStat, { backgroundColor: '#e3f2fd' }]}>
                <MaterialCommunityIcons name="truck-delivery" size={24} color="#1976d2" />
                <Text style={[styles.statNumero, { color: '#1976d2' }]}>{cantDespachadas}</Text>
                <Text style={styles.statLabel}>Despachadas</Text>
              </View>
              <View style={[styles.cardStat, { backgroundColor: '#e8f5e9' }]}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#388e3c" />
                <Text style={[styles.statNumero, { color: '#388e3c' }]}>{cantResueltas}</Text>
                <Text style={styles.statLabel}>Resueltas</Text>
              </View>
              <View style={[styles.cardStat, { backgroundColor: '#f1f5f9' }]}>
                <MaterialCommunityIcons name="clipboard-list" size={24} color="#64748b" />
                <Text style={[styles.statNumero, { color: '#64748b' }]}>{totalAlertas}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {/* ── Distribución por tipo ──────────────────────────────────── */}
            <Text style={styles.tituloSeccion}>DISTRIBUCIÓN DE EMERGENCIAS</Text>
            <TacticalCard elevated>
              <View style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>INCENDIOS</Text>
                  <Text style={[styles.barPercent, { color: '#af101a' }]}>{pctIncendios}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pctIncendios}%`, backgroundColor: '#af101a' }]} />
                </View>
              </View>

              <View style={[styles.barItem, { marginTop: 16 }]}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>RESCATES / OTROS</Text>
                  <Text style={[styles.barPercent, { color: '#1976d2' }]}>{pctRescates}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pctRescates}%`, backgroundColor: '#1976d2' }]} />
                </View>
              </View>
            </TacticalCard>

            {/* ── Stats por severidad ──────────────────────────────────── */}
            <Text style={styles.tituloSeccion}>POR SEVERIDAD</Text>
            <TacticalCard elevated>
              <View style={styles.filaSeveridad}>
                <View style={styles.itemSeveridad}>
                  <View style={[styles.punto, { backgroundColor: '#af101a' }]} />
                  <Text style={styles.severidadNumero}>{cantCriticas}</Text>
                  <Text style={styles.severidadLabel}>Críticas</Text>
                </View>
                <View style={styles.separador} />
                <View style={styles.itemSeveridad}>
                  <View style={[styles.punto, { backgroundColor: '#f97316' }]} />
                  <Text style={styles.severidadNumero}>{cantAltas}</Text>
                  <Text style={styles.severidadLabel}>Altas</Text>
                </View>
                <View style={styles.separador} />
                <View style={styles.itemSeveridad}>
                  <View style={[styles.punto, { backgroundColor: '#eab308' }]} />
                  <Text style={styles.severidadNumero}>{cantMedias}</Text>
                  <Text style={styles.severidadLabel}>Medias</Text>
                </View>
                <View style={styles.separador} />
                <View style={styles.itemSeveridad}>
                  <View style={[styles.punto, { backgroundColor: '#94a3b8' }]} />
                  <Text style={styles.severidadNumero}>{cantBajas}</Text>
                  <Text style={styles.severidadLabel}>Bajas</Text>
                </View>
              </View>
            </TacticalCard>

            {/* ── Últimas alertas ──────────────────────────────────────── */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.md }}>
              <Text style={[styles.tituloSeccion, { marginTop: 0, marginBottom: 0 }]}>ACTIVIDAD RECIENTE</Text>
              <TouchableOpacity onPress={limpiarBaseDeDatos} style={styles.botonTest}>
                <MaterialCommunityIcons name="delete-sweep" size={14} color="#fff" />
                <Text style={{ fontSize: 9, color: '#fff', fontWeight: '900', letterSpacing: 0.5 }}>BORRÓN PARA TEST</Text>
              </TouchableOpacity>
            </View>
            {ultimasAlertas.length === 0 ? (
              <Text style={styles.textoVacio}>Sin actividad registrada</Text>
            ) : (
              ultimasAlertas.map((a, idx) => (
                <TouchableOpacity key={a.id || idx} onPress={() => navigation.navigate('AlertDetail', { alerta_id: a.id })}>
                  <TacticalCard>
                    <View style={styles.filaActividad}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                           <View style={[styles.miniPunto, { backgroundColor: a.prioridad === 'critica' ? '#af101a' : '#f97316' }]} />
                           <Text style={styles.tipoActividad}>{a.tipo}</Text>
                        </View>
                        <Text style={styles.ubicacionActividad} numberOfLines={1}>{a.ubicacion}</Text>
                        <Text style={styles.obsActividad} numberOfLines={1}>{a.observaciones}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <StatusBadge severity={a.estado} />
                        <Text style={styles.tiempoActividad}>{tiempoTranscurrido(a.fecha)}</Text>
                      </View>
                    </View>
                  </TacticalCard>
                </TouchableOpacity>
              ))
            )}
          </>
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
    color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 4,
  },
  numeroGrande: {
    fontSize: 48, fontWeight: '900', color: Colors.onSurface, letterSpacing: -1,
  },

  tituloSeccion: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    color: Colors.onSurface, textTransform: 'uppercase',
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

  filaSeveridad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  itemSeveridad: { alignItems: 'center', flex: 1, gap: 4 },
  punto: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  severidadNumero: { fontSize: 22, fontWeight: '900', color: Colors.onSurface },
  severidadLabel: {
    fontSize: 10, fontWeight: '700', color: '#90a4ae',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  separador: { width: 1, height: 36, backgroundColor: Colors.surfaceContainerLow },

  filaActividad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  tipoActividad: { fontSize: 14, fontWeight: '800', color: Colors.onSurface, textTransform: 'uppercase' },
  ubicacionActividad: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 2 },
  obsActividad: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  miniPunto: { width: 6, height: 6, borderRadius: 3 },
  tiempoActividad: { fontSize: 10, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' },
  textoVacio: { fontSize: 13, color: '#94a3b8', fontWeight: '600', textAlign: 'center', paddingVertical: 20 },
  botonTest: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Barras de progreso
  barItem: { width: '100%' },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barTitle: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 0.5 },
  barPercent: { fontSize: 11, fontWeight: '900' },
  barTrack: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});
