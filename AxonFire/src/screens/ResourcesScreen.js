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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

// ── Botones de refuerzo ───────────────────────────────────────────
const REINFORCEMENTS = [
  { icon: 'water',          label: 'CISTERNA',     color: '#38bdf8', bg: '#0f2a3a' },
  { icon: 'gas-station',    label: 'COMBUSTIBLE',  color: '#fbbf24', bg: '#271e05' },
  { icon: 'ambulance',      label: 'AMBULANCIA',   color: '#fca5a5', bg: '#2d1515' },
  { icon: 'hammer-wrench',  label: 'RESCATE',      color: '#34d399', bg: '#0a2518' },
];

export default function ResourcesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

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

  useEffect(() => { cargarCamiones(); }, []);

  function abrirChecklist(camion) {
    navigation.navigate('WeeklyChecklist', {
      camionId: camion.id,
      camionNombre: camion.nombre_camion,
      token,
    });
  }

  const handleRefuerzo = (label) => {
    Alert.alert(
      `Solicitar ${label}`,
      `¿Confirmar solicitud de refuerzo: ${label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', style: 'default' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#16181d" />

      {/* ── Top Bar ────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          {navigation?.canGoBack() ? (
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.navigate('Mapa')}>
              <MaterialCommunityIcons name="home" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
          <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => cargarCamiones(true)}
          disabled={refrescando}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={18}
            color={refrescando ? '#334155' : '#64748b'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargarCamiones(true)}
            colors={['#dc2626']}
            tintColor="#dc2626"
          />
        }
      >
        {/* ── Header ───────────────────────────────────── */}
        <Text style={styles.pageLabel}>LOGÍSTICA</Text>
        <Text style={styles.pageTitle}>CENTRO{'\n'}LOGÍSTICO</Text>

        {/* ── MÓVILES ──────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MÓVILES ACTIVOS</Text>
          {cargando
            ? <ActivityIndicator size="small" color="#dc2626" />
            : (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{camiones.length} LISTOS</Text>
              </View>
            )
          }
        </View>

        {/* Error */}
        {error && (
          <TouchableOpacity style={styles.errorCard} onPress={() => cargarCamiones()}>
            <MaterialCommunityIcons name="wifi-off" size={16} color="#f87171" />
            <Text style={styles.errorText}>{error} Toca para reintentar.</Text>
          </TouchableOpacity>
        )}

        {/* Vacío */}
        {!cargando && !error && camiones.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="truck-remove-outline" size={32} color="#334155" />
            <Text style={styles.emptyText}>SIN MÓVILES ACTIVOS</Text>
          </View>
        )}

        {/* Loading skeleton */}
        {cargando && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.loadingText}>Cargando móviles...</Text>
          </View>
        )}

        {/* Lista de camiones */}
        {!cargando && !error && camiones.map((camion) => (
          <View key={camion.id} style={styles.camionCard}>
            <View style={styles.camionLeftBorder} />
            <View style={styles.camionIconBox}>
              <MaterialCommunityIcons name="fire-truck" size={22} color="#dc2626" />
            </View>
            <View style={styles.camionInfo}>
              <Text style={styles.camionNombre}>{camion.nombre_camion?.toUpperCase()}</Text>
              <View style={styles.camionEstadoRow}>
                <View style={styles.dotGreen} />
                <Text style={styles.camionEstado}>OPERATIVO</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.botonChecklist}
              onPress={() => abrirChecklist(camion)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="clipboard-check-outline" size={14} color="#fff" />
              <Text style={styles.botonChecklistText}>CHECKLIST</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* ── Refuerzos ─────────────────────────────────── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>SOLICITAR REFUERZO</Text>
          <View style={[styles.countBadge, { backgroundColor: '#2d1515' }]}>
            <Text style={[styles.countBadgeText, { color: '#fca5a5' }]}>PRIORIDAD</Text>
          </View>
        </View>

        <View style={styles.reinforcementGrid}>
          {REINFORCEMENTS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.reinforcementCard}
              onPress={() => handleRefuerzo(item.label)}
              activeOpacity={0.75}
            >
              <View style={[styles.reinforcementIconBox, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={[styles.reinforcementLabel, { color: item.color }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Solicitar Personal ────────────────────────── */}
        <TouchableOpacity
          style={styles.personalBtn}
          onPress={() => Alert.alert('Solicitar Personal', '¿Confirmar solicitud de personal adicional?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar' },
          ])}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
          <Text style={styles.personalBtnText}>SOLICITAR PERSONAL</Text>
        </TouchableOpacity>

        {/* ── Gestión Administrativa de Recursos (Solo ADMIN) ── */}
        {user?.rol === 'ADMIN' && (
          <>
            <View style={[styles.sectionHeaderRow, { marginTop: 28, marginBottom: 12 }]}>
              <Text style={styles.sectionTitle}>OPERACIONES DE LOGÍSTICA</Text>
            </View>

            <View style={styles.adminActionGrid}>
              <TouchableOpacity
                style={[styles.adminActionCard, { borderLeftColor: '#f97316' }]}
                onPress={() => navigation.navigate('AdminEquipment')}
                activeOpacity={0.8}
              >
                <View style={styles.adminActionCardHeader}>
                  <View style={[styles.adminActionIconBg, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
                    <MaterialCommunityIcons name="package-variant-closed" size={18} color="#f97316" />
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#64748b" />
                </View>
                <Text style={styles.adminActionTitle}>Cargar Inventario</Text>
                <Text style={styles.adminActionSub}>Móviles y herramientas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminActionCard, { borderLeftColor: '#10b981' }]}
                onPress={() => navigation.navigate('PedidosSuministro')}
                activeOpacity={0.8}
              >
                <View style={styles.adminActionCardHeader}>
                  <View style={[styles.adminActionIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <MaterialCommunityIcons name="cart-outline" size={18} color="#10b981" />
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#64748b" />
                </View>
                <Text style={styles.adminActionTitle}>Pedidos Suministro</Text>
                <Text style={styles.adminActionSub}>Solicitud de insumos</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181d',
  },

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
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topBarTitle: {
    color: '#e11d48',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  iconBtn: { padding: 4 },
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
    marginBottom: 28,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.2,
  },
  countBadge: {
    backgroundColor: '#052e16',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  countBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22c55e',
    letterSpacing: 0.6,
  },

  // Error / empty / loading
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1b1d24',
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
  errorText: { color: '#f87171', fontSize: 12, fontWeight: '600', flex: 1 },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 1,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  loadingText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },

  // Camion cards
  camionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    marginBottom: 10,
    paddingRight: 14,
    overflow: 'hidden',
    gap: 12,
  },
  camionLeftBorder: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#22c55e',
  },
  camionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#2d1515',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  camionInfo: { flex: 1 },
  camionNombre: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  camionEstadoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  camionEstado: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22c55e',
    letterSpacing: 0.8,
  },
  botonChecklist: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  botonChecklistText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // Reinforcements
  reinforcementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  reinforcementCard: {
    width: '48%',
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    paddingVertical: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reinforcementIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reinforcementLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // Personal button
  personalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 6,
  },
  personalBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // ── Admin Logistics Actions ────────────────────────────
  adminActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  adminActionCard: {
    width: '48%',
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#26282f',
    borderLeftWidth: 3,
    gap: 6,
  },
  adminActionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminActionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminActionTitle: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  adminActionSub: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '500',
  },
});