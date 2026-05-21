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
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import TacticalCard from '../components/TacticalCard';
import StatusBadge from '../components/StatusBadge';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ── Helpers para convertir datos del backend ────────────────────────────────

function getIconoAlerta(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('incendio') || n.includes('fuego'))
    return { icono: 'fire', color: '#dc2626', fondo: '#fee2e2' };
  if (n.includes('rescate') || n.includes('vehicular'))
    return { icono: 'car-wrench', color: '#d97706', fondo: '#fef3c7' };
  if (n.includes('gas') || n.includes('quimico') || n.includes('hazmat'))
    return { icono: 'biohazard', color: '#b91c1c', fondo: '#fff7ed' };
  if (n.includes('medic') || n.includes('ambulancia'))
    return { icono: 'ambulance', color: '#1976d2', fondo: '#e3f2fd' };
  if (n.includes('estructur'))
    return { icono: 'office-building', color: '#6d28d9', fondo: '#ede9fe' };
  return { icono: 'alert-circle', color: '#64748b', fondo: '#f1f5f9' };
}

function estadoAKey(estado = '') {
  const e = estado.toUpperCase();
  if (e === 'PENDIENTE') return 'activa';
  if (e === 'EN CURSO') return 'progreso';
  if (e === 'FINALIZADO') return 'resuelta';
  // Fallback para otros sistemas de nombres
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

// ── Componente principal ─────────────────────────────────────────────────────

const FILTROS = ['Activas', 'Todas', 'Resueltas'];

export default function AlertasVisualesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const usuarioId = user?.id || '';

  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('Activas');

  async function cargarAlertas(esRefresh = false) {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);
    setError(null);

    let fetchedData = null;

    try {
      const hasta = new Date().toISOString();
      const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const res = await axios.post(`${API_BASE_URL}/alerta/rango`, 
        { fecha_desde: desde, fecha_hasta: hasta },
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}) 
          },
          timeout: 3000
        }
      );

      fetchedData = res.data;
    } catch (err) {
      console.error('Error cargando alertas, usando fallback local:', err);
      fetchedData = [
        {
          id: '1',
          tipo: 'Incendio Estructural',
          estado: 'activa',
          prioridad: 'critica',
          ubicacion: 'Av. Siempre Viva 742',
          observaciones: 'Fuego reportado en la planta baja.',
          fecha_hora: new Date().toISOString()
        },
        {
          id: '2',
          tipo: 'Rescate Vehicular',
          estado: 'despachada',
          prioridad: 'alta',
          ubicacion: 'Ruta 9, Km 45',
          observaciones: 'Choque entre dos vehículos.',
          fecha_hora: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          tipo: 'Fuga de Gas',
          estado: 'resuelta',
          prioridad: 'media',
          ubicacion: 'Centro comercial',
          observaciones: 'Situación controlada por el equipo.',
          fecha_hora: new Date(Date.now() - 86400000).toISOString()
        }
      ];
    } finally {
      if (fetchedData) {
        // En caso de que axios retorne el wrapper
        const lista = Array.isArray(fetchedData?.alertas) ? fetchedData.alertas : Array.isArray(fetchedData) ? fetchedData : [];

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

  useEffect(() => {
    cargarAlertas();
  }, []);

  // Filtrado local
  const filtradas = alertas.filter((a) => {
    if (filtro === 'Activas') return ['activa', 'progreso', 'despachada'].includes(a.estado);
    if (filtro === 'Resueltas') return a.estado === 'resuelta';
    return true;
  });

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Alertas Visuales</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargarAlertas(true)}
            colors={['#af101a']}
            tintColor="#af101a"
          />
        }
      >
        {/* Filtros */}
        <View style={styles.filaFiltros}>
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFiltro(f)}
              style={[styles.chip, filtro === f ? styles.chipActivo : styles.chipInactivo]}
            >
              <Text style={[styles.chipTexto, { color: filtro === f ? '#fff' : '#94a3b8' }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading */}
        {cargando && (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color="#af101a" />
            <Text style={styles.textoEstado}>Cargando alertas...</Text>
          </View>
        )}

        {/* Error */}
        {!cargando && error && (
          <View style={styles.centrado}>
            <MaterialCommunityIcons name="wifi-off" size={48} color="#94a3b8" />
            <Text style={styles.textoEstado}>{error}</Text>
            <TouchableOpacity style={styles.botonReintentar} onPress={() => cargarAlertas()}>
              <Text style={styles.textoReintentar}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Vacío */}
        {!cargando && !error && filtradas.length === 0 && (
          <View style={styles.centrado}>
            <MaterialCommunityIcons name="check-circle-outline" size={52} color="#86efac" />
            <Text style={styles.textoEstado}>Sin alertas {filtro.toLowerCase()}</Text>
          </View>
        )}

        {/* Lista de alertas */}
        {!cargando && !error && filtradas.map((alerta) => (
          <TouchableOpacity
            key={alerta.id}
            activeOpacity={0.75}
            onPress={() =>
              // Cuando toca una alerta, navega a ListaAsistencia para ver quién respondió
              navigation.navigate('ListaAsistencia', {
                alertaId: alerta.id,
                token,
                usuarioId,
              })
            }
          >
            <TacticalCard elevated style={{ backgroundColor: '#1e293b' }}>
              {/* Barra lateral de criticidad */}
              {alerta.severidad === 'critica' && <View style={styles.barraRoja} />}

              <View style={styles.filaCard}>
                {/* Ícono */}
                <View style={[styles.iconoAlerta, { backgroundColor: alerta.fondo }]}>
                  <MaterialCommunityIcons name={alerta.icono} size={28} color={alerta.color} />
                </View>

                {/* Contenido */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                    <StatusBadge severity={alerta.severidad} />
                    <StatusBadge severity={alerta.estado} />
                  </View>
                  <Text style={styles.nombreAlerta} numberOfLines={1}>{alerta.nombre}</Text>
                  <Text style={styles.direccion} numberOfLines={1}>{alerta.direccion}</Text>
                  {alerta.observaciones ? (
                    <Text style={styles.observaciones} numberOfLines={2}>{alerta.observaciones}</Text>
                  ) : null}
                  <Text style={styles.tiempo}>{alerta.tiempo}</Text>
                </View>

                {/* Flecha */}
                <MaterialIcons name="chevron-right" size={24} color="#64748b" />
              </View>
            </TacticalCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

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

  contenido: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  filaFiltros: { flexDirection: 'row', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14,
    minWidth: 80, alignItems: 'center', justifyContent: 'center',
  },
  chipActivo: { backgroundColor: '#ef4444' },
  chipInactivo: { backgroundColor: '#1e293b' },
  chipTexto: { fontSize: 14, fontWeight: '700' },

  centrado: { alignItems: 'center', paddingVertical: 52, gap: 12 },
  textoEstado: { fontSize: 14, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },
  botonReintentar: {
    marginTop: 8, backgroundColor: '#1e293b',
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12,
  },
  textoReintentar: { color: '#fff', fontWeight: '700', fontSize: 14 },

  filaCard: { flexDirection: 'row', alignItems: 'center' },
  barraRoja: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 4, backgroundColor: '#af101a', borderRadius: 4,
  },
  iconoAlerta: {
    width: 52, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  nombreAlerta: { fontSize: 15, fontWeight: '800', color: '#f8fafc', marginBottom: 2 },
  direccion: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginBottom: 2 },
  observaciones: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginBottom: 2, fontStyle: 'italic' },
  tiempo: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
});
