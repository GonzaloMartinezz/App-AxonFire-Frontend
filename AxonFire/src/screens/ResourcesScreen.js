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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../theme';
import TacticalCard from '../components/TacticalCard';
import StatusBadge from '../components/StatusBadge';
import { API_BASE_URL } from '../config/api';

const REINFORCEMENTS = [
  { icon: 'water',         label: 'CISTERNA',    color: Colors.alertBlue     },
  { icon: 'gas-station',   label: 'COMBUSTIBLE', color: Colors.warningOrange },
  { icon: 'ambulance',     label: 'AMBULANCIA',  color: Colors.primary       },
  { icon: 'hammer-wrench', label: 'RESCATE',     color: Colors.secondary     },
];

const PENDING_REQUESTS = [
  {
    icon: 'ambulance', iconColor: Colors.primary,
    title: 'Ambulancia B-12', subtitle: 'DESPACHADA · 4 MIN', status: 'done',
  },
  {
    icon: 'water', iconColor: Colors.alertBlue,
    title: 'Cisterna de Agua', subtitle: 'ESPERANDO APROBACIÓN', status: 'pending',
  },
];

export default function ResourcesScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  // El token llega desde el navigator igual que en las otras pantallas
  const token = route?.params?.token || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const [camiones, setCamiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  async function cargarCamiones(esRefresh = false) {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);
    setError(null);

    try {
      // Solo los camiones ACTIVOS, listos para servicio
      const res = await fetch(`${API_BASE_URL}/camiones/activos`, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setCamiones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando camiones:', err);
      setError('No se pudieron cargar los móviles.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }

  useEffect(() => {
    cargarCamiones();
  }, []);

  // ── Navegar al checklist del camión ──────────────────────────────────────
  // Acá es donde se pasan los params que necesita ChecklistScreen
  function abrirChecklist(camion) {
    navigation.navigate('Checklist', {
      camionId:    camion.id,
      camionNombre: camion.nombre_camion,
      token,
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation?.navigate('Mapa')} style={styles.avatar}>
            <MaterialCommunityIcons name="home" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AXON FIRE</Text>
        </View>
        <TouchableOpacity style={styles.emergencyBtn}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargarCamiones(true)}
            colors={['#af101a']}
            tintColor="#af101a"
          />
        }
      >
        <Text style={styles.pageTitle}>Centro Logístico</Text>
        <Text style={styles.pageSubtitle}>SECTOR 4-ALPHA / RESPONDEDOR 102</Text>

        {/* ── Current Task ── */}
        <View style={styles.taskRow}>
          <View style={styles.taskCard}>
            <Text style={styles.taskLabel}>TAREA ACTUAL</Text>
            <Text style={styles.taskTitle}>Contención de{'\n'}Perímetro</Text>
            <View style={styles.trackingRow}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingText}>RASTREO ACTIVO</Text>
            </View>
          </View>
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>TIEMPO</Text>
            <Text style={styles.timeValue}>08:42</Text>
          </View>
        </View>

        {/* ── MÓVILES (camiones reales del backend) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MÓVILES</Text>
          {cargando
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={styles.cantidadCamiones}>{camiones.length} ACTIVOS</Text>
          }
        </View>

        {error && (
          <TouchableOpacity style={styles.errorCard} onPress={() => cargarCamiones()}>
            <MaterialCommunityIcons name="wifi-off" size={16} color="#f87171" />
            <Text style={styles.errorText}>{error} Tocá para reintentar.</Text>
          </TouchableOpacity>
        )}

        {!cargando && !error && camiones.length === 0 && (
          <View style={styles.vacioCamiones}>
            <MaterialCommunityIcons name="truck-remove-outline" size={32} color={Colors.onSurfaceVariant} />
            <Text style={styles.vacioText}>Sin móviles activos</Text>
          </View>
        )}

        {/* Un card por camión con botón de checklist */}
        {camiones.map((camion) => (
          <TacticalCard key={camion.id} elevated>
            <View style={styles.camionRow}>
              {/* Ícono y datos del camión */}
              <View style={styles.camionIcono}>
                <MaterialCommunityIcons name="fire-truck" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.camionNombre}>{camion.nombre_camion}</Text>
                <View style={styles.camionEstadoRow}>
                  <View style={[
                    styles.puntoCamion,
                    { backgroundColor: camion.estado === 'ACTIVO' ? '#22c55e' : '#94a3b8' }
                  ]} />
                  <Text style={styles.camionEstado}>{camion.estado}</Text>
                </View>
              </View>

              {/* Botón que lleva al ChecklistScreen con los params correctos */}
              <TouchableOpacity
                style={styles.botonChecklist}
                onPress={() => abrirChecklist(camion)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="clipboard-check-outline" size={15} color="#fff" />
                <Text style={styles.botonChecklistTexto}>CHECKLIST</Text>
              </TouchableOpacity>
            </View>
          </TacticalCard>
        ))}

        {/* ── Refuerzos ── */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.lg }]}>
          <Text style={styles.sectionTitle}>REFUERZOS</Text>
          <StatusBadge severity="critica" label="PRIORIDAD" />
        </View>

        <View style={styles.reinforcementGrid}>
          {REINFORCEMENTS.map((item) => (
            <TouchableOpacity key={item.label} style={styles.reinforcementCard}>
              <View style={[styles.reinforcementIcon, { backgroundColor: `${item.color}15` }]}>
                <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.reinforcementLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Request Button ── */}
        <TouchableOpacity style={{ marginTop: Spacing.lg }}>
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.requestBtn}
          >
            <MaterialCommunityIcons name="account-plus" size={22} color="#fff" />
            <Text style={styles.requestText}>SOLICITAR PERSONAL</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Pending Requests ── */}
        <Text style={styles.pendingTitle}>SOLICITUDES PENDIENTES</Text>
        {PENDING_REQUESTS.map((req, idx) => (
          <TacticalCard key={idx}>
            <View style={styles.requestRow}>
              <View style={[styles.requestIcon, { backgroundColor: `${req.iconColor}15` }]}>
                <MaterialCommunityIcons name={req.icon} size={20} color={req.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.requestTitle} numberOfLines={1}>{req.title}</Text>
                <Text style={styles.requestSub}>{req.subtitle}</Text>
              </View>
              {req.status === 'done'
                ? <MaterialIcons name="check-circle" size={22} color={Colors.success} />
                : <MaterialCommunityIcons name="sync" size={18} color={Colors.onSurfaceVariant} />
              }
            </View>
          </TacticalCard>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16, fontWeight: '900', letterSpacing: -0.5,
    color: Colors.onSurface, textTransform: 'uppercase',
  },
  emergencyBtn: {
    width: 36, height: 36, borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  pageTitle: {
    fontSize: 26, fontWeight: '900', letterSpacing: -0.4,
    color: Colors.onSurface, marginBottom: 3,
  },
  pageSubtitle: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1.2,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase',
    marginBottom: Spacing.lg,
  },
  taskRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  taskCard: {
    flex: 2, backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.xxl, padding: Spacing.md,
  },
  taskLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 4,
  },
  taskTitle: {
    fontSize: 14, fontWeight: '800', color: Colors.onSurface,
    lineHeight: 20, marginBottom: Spacing.xs,
  },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trackingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  trackingText: {
    fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 0.4,
  },
  timeCard: {
    flex: 1, backgroundColor: Colors.inverseSurface,
    borderRadius: Radius.xxl, padding: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1,
    color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 3,
  },
  timeValue: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },

  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    color: Colors.onSurface, textTransform: 'uppercase',
  },
  cantidadCamiones: {
    fontSize: 9, fontWeight: '800', letterSpacing: 0.8,
    color: '#22c55e', textTransform: 'uppercase',
  },

  // Error y vacío de camiones
  errorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1f1315', borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: '#dc2626',
  },
  errorText: { color: '#f87171', fontSize: 12, fontWeight: '600', flex: 1 },
  vacioCamiones: {
    alignItems: 'center', paddingVertical: 24, gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xxl, marginBottom: Spacing.md,
  },
  vacioText: {
    fontSize: 12, fontWeight: '700',
    color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // Card de cada camión
  camionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  camionIcono: {
    width: 42, height: 42, borderRadius: Radius.lg,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  camionNombre: {
    fontSize: 14, fontWeight: '800', color: Colors.onSurface, marginBottom: 3,
  },
  camionEstadoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  puntoCamion: { width: 6, height: 6, borderRadius: 3 },
  camionEstado: {
    fontSize: 9, fontWeight: '800', letterSpacing: 0.8,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase',
  },
  botonChecklist: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.lg,
  },
  botonChecklistTexto: {
    color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.6,
  },

  reinforcementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reinforcementCard: {
    width: '48%', backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.xxl, paddingVertical: Spacing.lg,
    alignItems: 'center', gap: 8,
  },
  reinforcementIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  reinforcementLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.6,
    color: Colors.onSurface, textTransform: 'uppercase',
  },
  requestBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: Radius.xxl,
    elevation: 8,
  },
  requestText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },
  pendingTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    color: Colors.onSurface, textTransform: 'uppercase',
    marginTop: Spacing.xl, marginBottom: Spacing.md,
  },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  requestIcon: {
    width: 38, height: 38, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  requestTitle: { fontSize: 13, fontWeight: '700', color: Colors.onSurface },
  requestSub: {
    fontSize: 9, fontWeight: '800', letterSpacing: 0.8,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase',
    marginTop: 1,
  },
});
