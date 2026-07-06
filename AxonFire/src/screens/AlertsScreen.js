import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { styles } from '../styles/AlertsScreenStyles';

const { width } = Dimensions.get('window');

const FILTERS_CONFIG = [
  { label: 'Activas', filterFn: (a) => ['activa', 'progreso', 'despachada'].includes(a.status) },
  { label: 'Todas', filterFn: (a) => true },
  { label: 'Resueltas', filterFn: (a) => a.status === 'resuelta' },
];

// Helpers para clasificación unificada
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

const StatusBadge = ({ severity, type = 'severity' }) => {
  const getBadgeStyle = () => {
    switch (severity) {
      case 'critica':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'CRÍTICA' };
      case 'alta':
        return { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', label: 'ALTA' };
      case 'activa':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'ACTIVA' };
      case 'despachada':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'DESPACHADA' };
      case 'progreso':
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', label: 'EN PROGRESO' };
      case 'resuelta':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', label: 'RESUELTA' };
      default:
        return { bg: '#26282f', text: '#94a3b8', label: severity.toUpperCase() };
    }
  };

  const config = getBadgeStyle();
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

export default function AlertsScreen({ navigation, route }) {
  const [activeFilter, setActiveFilter] = useState(route?.params?.filtro || 'Activas');
  const [showMenu, setShowMenu] = useState(false);
  const insets = useSafeAreaInsets();
  const isCurrentlyAdmin = navigation.getState()?.routeNames?.includes('Panel');

  const { token, user } = useAuth();

  useEffect(() => {
    if (route?.params?.filtro) {
      setActiveFilter(route.params.filtro);
    }
  }, [route?.params?.filtro]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchAlerts();
    }, [token])
  );

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/alerta/rango`, {
        params: {
          fecha_desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          fecha_hasta: new Date().toISOString()
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && (res.data.alertas || Array.isArray(res.data))) {
        const list = Array.isArray(res.data.alertas) ? res.data.alertas : Array.isArray(res.data) ? res.data : [];

        const mappedAlerts = await Promise.all(list.map(async (a) => {
          const tipo = a.subCategoriaAlerta?.nombre_sub_categoria || a.subCategoriaAlerta?.nombre || a.observaciones || 'Incidente General';

          // Check local finalized override
          const isLocallyFinalized = await AsyncStorage.getItem(`finalized_alert_${a.id}`);
          const rawStatus = isLocallyFinalized === 'true' ? 'FINALIZADO' : (a.estadoAlerta?.nombre_estado || a.estadoAlerta?.nombre || a.estado || '');

          const estado = clasificarEstado(rawStatus);
          const prioridad = clasificarPrioridad(a.prioridad || a.subCategoriaAlerta?.prioridad || '');

          return {
            id: a.id,
            type: tipo,
            severity: prioridad,
            status: estado,
            address: a.ubicacion || 'Ubicación no especificada',
            timeAgo: new Date(a.fecha_hora).toLocaleDateString(),
            fecha_hora: a.fecha_hora,
            ...getAlertIcon(tipo)
          };
        }));

        mappedAlerts.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
        setAlerts(mappedAlerts);
      }
    } catch (e) {
      console.log('Error fetching alerts', e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const config = FILTERS_CONFIG.find(f => f.label === activeFilter);
    return config ? config.filterFn(a) : true;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1c23" />

      {/* Top Bar / Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <MaterialCommunityIcons name="monitor-dashboard" size={22} color={isCurrentlyAdmin ? "#e11d48" : "#0284c7"} />
          <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <View style={styles.topBarRight}>
          {user?.rol === 'ADMIN' && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowMenu(!showMenu)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="menu" size={20} color={isCurrentlyAdmin ? "#e11d48" : "#0284c7"} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              if (isCurrentlyAdmin) {
                navigation?.navigate('Panel');
              } else {
                navigation?.navigate('Mapa');
              }
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="home" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>



      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveWrapper}>

          {/* Dropdown Menu */}
          {showMenu && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation?.navigate('AddFirefighter');
                }}
              >
                <MaterialCommunityIcons name="account-multiple-plus" size={18} color="#e11d48" />
                <Text style={styles.dropdownItemText}>Cargar Bomberos</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation?.navigate('NewAlert');
                }}
              >
                <MaterialCommunityIcons name="alert-plus" size={18} color="#e11d48" />
                <Text style={styles.dropdownItemText}>Cargar Emergencia</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation?.navigate('WeeklyChecklist', { initialTab: 'diario' });
                }}
              >
                <MaterialCommunityIcons name="clipboard-check-outline" size={18} color="#e11d48" />
                <Text style={styles.dropdownItemText}>Cargar Inventario</Text>
              </TouchableOpacity>

              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation?.navigate('PedidosSuministro');
                }}
              >
                <MaterialCommunityIcons name="truck-outline" size={18} color="#e11d48" />
                <Text style={styles.dropdownItemText}>Pedidos Suministro</Text>
              </TouchableOpacity>

              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation?.navigate('WeeklyChecklist', { initialTab: 'inventario' });
                }}
              >
                <MaterialCommunityIcons name="calendar-check" size={18} color="#e11d48" />
                <Text style={styles.dropdownItemText}>Checklist Semanal</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation?.navigate('Reports');
                }}
              >
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#e11d48" />
                <Text style={styles.dropdownItemText}>Reportes Legales</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Title Section (Alineación con Panel de Control) */}
          <View style={styles.headerRow}>
            <View style={styles.titleLeftGroup}>
              <View style={styles.redAccent} />
              <View>
                <Text style={styles.headerLabel}>MONITOREO EN VIVO</Text>
                <Text style={styles.mainTitle}>CENTRO DE{"\n"}ALERTAS</Text>
              </View>
            </View>
          </View>

          {/* Filter Section */}
          <View style={styles.filterSection}>
            {FILTERS_CONFIG.map((f) => {
              const count = alerts.filter(f.filterFn).length;
              const isActive = activeFilter === f.label;
              return (
                <TouchableOpacity
                  key={f.label}
                  onPress={() => setActiveFilter(f.label)}
                  style={[
                    styles.filterChip,
                    isActive ? styles.filterChipActive : styles.filterChipInactive
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.filterRow}>
                    <Text style={[
                      styles.filterText,
                      isActive ? styles.filterTextActive : styles.filterTextInactive
                    ]}>
                      {f.label}
                    </Text>
                    {count > 0 && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{count}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Alert List */}
          {loading ? (
            <View style={styles.centrado}>
              <ActivityIndicator size="large" color="#dc2626" />
              <Text style={styles.textoCarga}>Cargando centro de alertas...</Text>
            </View>
          ) : filteredAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="shield-check" size={48} color="#334155" />
              <Text style={styles.textoVacio}>No hay alertas registradas</Text>
            </View>
          ) : (
            <View style={styles.alertList}>
              {filteredAlerts.map((alert) => {
                const priorityColor = getPriorityColor(alert.severity);
                return (
                  <TouchableOpacity
                    key={alert.id}
                    style={[styles.alertCard, { borderLeftColor: priorityColor }]}
                    activeOpacity={0.8}
                    onPress={() => navigation?.navigate('AlertDetail', { alerta_id: alert.id })}
                  >
                    <View style={[styles.iconBox, { backgroundColor: alert.bg }]}>
                      <MaterialCommunityIcons name={alert.icon} size={24} color={alert.color} />
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.tagRow}>
                        <StatusBadge severity={alert.severity} />
                        <StatusBadge severity={alert.status} type="status" />
                      </View>

                      <Text style={styles.alertType} numberOfLines={1}>{alert.type.toUpperCase()}</Text>
                      <Text style={styles.address} numberOfLines={1}>{alert.address}</Text>
                    </View>

                    <View style={styles.alertCardRight}>
                      <Text style={styles.timeAgo}>{alert.timeAgo}</Text>
                      <MaterialIcons name="chevron-right" size={20} color="#64748b" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

