import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function AdminEquipmentScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token || '';

  const [activeTab, setActiveTab] = useState('moviles'); // 'moviles' | 'base'
  const [herramientas, setHerramientas] = useState([]);
  const [loadingBase, setLoadingBase] = useState(false);

  useEffect(() => {
    if (activeTab === 'base') fetchHerramientas();
  }, [activeTab]);

  const fetchHerramientas = async () => {
    setLoadingBase(true);
    try {
      const res = await fetch(`${API_BASE_URL}/herramientas/`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) { const data = await res.json(); setHerramientas(Array.isArray(data) ? data : []); }
    } catch (e) { console.warn('Error fetching herramientas:', e); }
    finally { setLoadingBase(false); }
  };

  const getStockColor = (qty) => qty > 5 ? '#22c55e' : qty > 0 ? '#eab308' : '#dc2626';
  const getStockLabel = (qty) => qty > 5 ? 'ÓPTIMO' : qty > 0 ? 'BAJO' : 'SIN STOCK';

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
        navigation.replace('Login');
      }
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro que deseas cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => navigation.replace('Login'), style: 'destructive' }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#16181d" />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
           <Image source={{ uri: 'https://randomuser.me/api/portraits/men/41.jpg' }} style={styles.avatarTop} />
           <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('MainApp')}>
            <MaterialCommunityIcons name="monitor-dashboard" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={confirmLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <Text style={styles.subtitle}>MANDO Y CONTROL</Text>
        <Text style={styles.mainTitle}>GESTIÓN DE{'\n'}EQUIPOS</Text>
        <Text style={styles.descText}>
          Supervisión en tiempo real de la flota táctica y activos críticos del Sector 7G.
        </Text>

        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>AGREGAR EQUIPO</Text>
        </TouchableOpacity>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, activeTab === 'moviles' && styles.tabActive]} onPress={() => setActiveTab('moviles')}>
            <MaterialCommunityIcons name="fire-truck" size={16} color={activeTab === 'moviles' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'moviles' && styles.tabTextActive]}>MÓVILES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'base' && styles.tabActive]} onPress={() => setActiveTab('base')}>
            <MaterialCommunityIcons name="warehouse" size={16} color={activeTab === 'base' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'base' && styles.tabTextActive]}>INVENTARIO BASE</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'moviles' ? (
          <>
            {/* Móvil 12 Card */}
            <View style={styles.vehicleCard}>
              <View style={styles.vehicleLeftBorder} />
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=600&auto=format&fit=crop' }} 
                style={styles.vehicleImg} 
              />
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleTitleRow}>
                  <Text style={styles.vehicleName}>Móvil 12</Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#dc2626' }]}>
                    <Text style={styles.statusTextWhite}>OPERATIVO</Text>
                  </View>
                </View>
                <Text style={styles.vehicleType}>UNIDAD DE ATAQUE RÁPIDO</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>COMBUSTIBLE</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: '85%', backgroundColor: '#dc2626' }]} />
                    </View>
                    <Text style={styles.statValue}>85%</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>AGUA</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: '100%', backgroundColor: '#3b82f6' }]} />
                    </View>
                    <Text style={styles.statValue}>100%</Text>
                  </View>
                </View>
                <View style={styles.vehicleActions}>
                  <TouchableOpacity style={styles.vehicleBtn}>
                    <Text style={styles.vehicleBtnText}>BITÁCORA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.vehicleBtn}>
                    <Text style={styles.vehicleBtnText}>PERSONAL</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Móvil 05 Card */}
            <View style={styles.vehicleCard}>
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleTitleRow}>
                  <Text style={styles.vehicleName}>Móvil 05</Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#334155' }]}>
                    <Text style={styles.statusTextWhite}>MANTENIMIENTO</Text>
                  </View>
                </View>
                <Text style={styles.vehicleType}>ESCALA TELESCÓPICA</Text>
                <View style={styles.warningRow}>
                  <MaterialCommunityIcons name="alert-triangle" size={14} color="#fca5a5" />
                  <Text style={styles.warningText}>Revisión de sistema hidráulico en curso</Text>
                </View>
                <TouchableOpacity style={styles.fullWidthBtn}>
                  <Text style={styles.fullWidthBtnText}>VER REPORTE</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Herramientas Críticas */}
            <Text style={styles.sectionTitle}>HERRAMIENTAS CRÍTICAS</Text>

            <View style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <View style={styles.toolIconBox}><MaterialCommunityIcons name="diving-scuba-tank" size={20} color="#93c5fd" /></View>
                <View style={styles.toolBadge}><Text style={styles.toolBadgeText}>14 UNIDADES</Text></View>
              </View>
              <Text style={styles.toolName}>Equipos ERA</Text>
              <Text style={styles.toolDesc}>Protección respiratoria autónoma</Text>
              <View style={styles.toolFooter}>
                <View style={styles.dotsRow}>
                  <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
                  <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
                  <View style={[styles.dot, { backgroundColor: '#eab308' }]} />
                </View>
                <Text style={styles.toolStatusText}>ESTADO ÓPTIMO</Text>
              </View>
            </View>

            <View style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <View style={styles.toolIconBoxRed}><MaterialCommunityIcons name="home" size={20} color="#dc2626" /></View>
                <View style={styles.toolBadgeRed}><Text style={styles.toolBadgeTextRed}>450m TOTAL</Text></View>
              </View>
              <Text style={styles.toolName}>Mangueras 1.5"</Text>
              <Text style={styles.toolDesc}>Líneas de ataque directo</Text>
              <View style={styles.barBgRed}>
                <View style={[styles.barFill, { width: '80%', backgroundColor: '#dc2626' }]} />
              </View>
            </View>

            <View style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <View style={styles.toolIconBox}><MaterialCommunityIcons name="radio-handheld" size={20} color="#93c5fd" /></View>
                <View style={styles.toolBadge}><Text style={styles.toolBadgeText}>22 ACTIVOS</Text></View>
              </View>
              <Text style={styles.toolName}>Comunicaciones</Text>
              <Text style={styles.toolDesc}>Terminales tácticos UHF</Text>
              <View style={styles.toolStatusRow}>
                <View style={[styles.dotSmall, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.toolStatusTextWhite}>SEÑAL ENCRIPTADA</Text>
              </View>
            </View>

            <View style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <MaterialCommunityIcons name="wrench" size={24} color="#f8fafc" />
                <View style={styles.toolBadgeDark}><Text style={styles.toolBadgeTextWhite}>SET HOLMATRO</Text></View>
              </View>
              <Text style={styles.toolName}>Extricación</Text>
              <Text style={styles.toolDesc}>Equipos de rescate pesado</Text>
              <Text style={styles.warningTextSmall}>REQUIERE CALIBRACIÓN</Text>
            </View>
          </>
        ) : (
          <>
            {/* BASE INVENTORY TAB */}
            <View style={styles.baseHeader}>
              <MaterialCommunityIcons name="warehouse" size={20} color="#93c5fd" />
              <Text style={styles.baseHeaderText}>STOCK MAESTRO DEL CUARTEL</Text>
            </View>

            {loadingBase ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 12, fontWeight: '600' }}>Cargando inventario...</Text>
              </View>
            ) : herramientas.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="package-variant" size={48} color="#334155" />
                <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>No hay herramientas registradas</Text>
              </View>
            ) : (
              herramientas.map((h) => {
                const stockColor = getStockColor(h.cantidad_disponible);
                const stockLabel = getStockLabel(h.cantidad_disponible);
                const maxQty = Math.max(...herramientas.map(x => x.cantidad_disponible || 1), 1);
                const barWidth = `${Math.round(((h.cantidad_disponible || 0) / maxQty) * 100)}%`;
                return (
                  <View key={h.id} style={styles.toolCard}>
                    <View style={styles.toolHeader}>
                      <View style={[styles.toolIconBox, { backgroundColor: `${stockColor}20` }]}>
                        <MaterialCommunityIcons name="package-variant-closed" size={20} color={stockColor} />
                      </View>
                      <View style={[styles.toolBadge, { backgroundColor: `${stockColor}20` }]}>
                        <Text style={[styles.toolBadgeText, { color: stockColor }]}>{h.cantidad_disponible} UDS</Text>
                      </View>
                    </View>
                    <Text style={styles.toolName}>{h.nombre_herramienta}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                      <View style={[styles.dotSmall, { backgroundColor: stockColor }]} />
                      <Text style={[styles.toolStatusTextWhite, { color: stockColor }]}>{stockLabel}</Text>
                    </View>
                    <View style={[styles.barBgRed, { marginTop: 8 }]}>
                      <View style={[styles.barFill, { width: barWidth, backgroundColor: stockColor }]} />
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181d',
  },
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
  avatarTop: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
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
  scrollContent: {
    padding: 24,
  },
  subtitle: {
    fontSize: 10,
    color: '#fca5a5',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
    lineHeight: 34,
    marginBottom: 12,
  },
  descText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    gap: 8,
    marginBottom: 32,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  vehicleCard: {
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  vehicleLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#dc2626',
    zIndex: 10,
  },
  vehicleImg: {
    width: '100%',
    height: 140,
    opacity: 0.8,
  },
  vehicleInfo: {
    padding: 20,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusTextWhite: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  vehicleType: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    color: '#f8fafc',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  barBg: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginBottom: 4,
  },
  barBgRed: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginTop: 12,
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'right',
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleBtn: {
    flex: 1,
    backgroundColor: '#26282f',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 4,
  },
  vehicleBtnText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  warningText: {
    color: '#fca5a5',
    fontSize: 11,
  },
  fullWidthBtn: {
    backgroundColor: '#26282f',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fullWidthBtnText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 16,
  },
  toolCard: {
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconBoxRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#451a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBadge: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  toolBadgeText: {
    color: '#93c5fd',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  toolBadgeRed: {
    backgroundColor: '#451a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  toolBadgeTextRed: {
    color: '#fca5a5',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  toolBadgeDark: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  toolBadgeTextWhite: {
    color: '#f8fafc',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  toolName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  toolDesc: {
    color: '#f8fafc',
    fontSize: 11,
  },
  toolFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  toolStatusText: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  toolStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toolStatusTextWhite: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  warningTextSmall: {
    color: '#fca5a5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#26282f',
  },
  tabActive: {
    backgroundColor: '#dc2626',
  },
  tabText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#fff',
  },
  baseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  baseHeaderText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
