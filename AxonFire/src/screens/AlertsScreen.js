import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Mock data according to the screenshot
const ALERTS = [
  {
    id: '1',
    type: 'Incendio Estructural - Edificio ...',
    severity: 'critica',
    status: 'activa',
    address: 'Av. Corrientes 1500, CABA',
    timeAgo: 'Hace 17 horas',
    icon: 'fire',
    iconColor: '#dc2626',
    iconBg: '#fee2e2',
  },
  {
    id: '2',
    type: 'Rescate Vehicular - Autopista',
    severity: 'alta',
    status: 'despachada',
    address: 'Autopista 25 de Mayo, Km 3',
    timeAgo: 'Hace 17 horas',
    icon: 'car-wrench',
    iconColor: '#d97706',
    iconBg: '#fef3c7',
  },
  {
    id: '3',
    type: 'Fuga de Gas - Zona Comercial',
    severity: 'alta',
    status: 'progreso',
    address: 'Calle Juramento 2800, Belgrano',
    timeAgo: 'Hace 17 horas',
    icon: 'biohazard',
    iconColor: '#b91c1c',
    iconBg: '#fff7ed',
  },
];

const FILTERS = [
  { label: 'Activas', count: 3 },
  { label: 'Todas', count: null },
  { label: 'Resueltas', count: null },
];

const StatusBadge = ({ severity, type = 'severity' }) => {
  const getBadgeStyle = () => {
    switch (severity) {
      case 'critica':
        return { bg: '#af101a', text: '#fff', label: 'CRÍTICA' };
      case 'alta':
        return { bg: '#f97316', text: '#fff', label: 'ALTA' };
      case 'activa':
        return { bg: '#fce7f3', text: '#af101a', label: 'Activa' };
      case 'despachada':
        return { bg: '#fef3c7', text: '#92400e', label: 'Despachada' };
      case 'progreso':
        return { bg: '#dbeafe', text: '#1e40af', label: 'En Progreso' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563', label: severity.toUpperCase() };
    }
  };

  const config = getBadgeStyle();
  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderRadius: 8 }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

export default function AlertsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('Activas');
  const [showMenu, setShowMenu] = useState(false);
  const insets = useSafeAreaInsets();

  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/alerta/rango`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          fecha_desde: "2020-01-01",
          fecha_hasta: "2030-01-01"
        }
      });
      if (res.data && res.data.alertas) {
        // Map backend alerts to frontend format
        const mappedAlerts = res.data.alertas.map(a => ({
          id: a.id,
          type: a.observaciones || 'Incidente General',
          severity: 'alta', // default or mapped based on subcat
          status: a.estado_alerta_id === '3' ? 'resueltas' : 'activa',
          address: a.ubicacion || 'Ubicación no especificada',
          timeAgo: new Date(a.fecha_hora).toLocaleDateString(),
          icon: 'fire',
          iconColor: '#dc2626',
          iconBg: '#fee2e2'
        }));
        setAlerts(mappedAlerts);
      }
    } catch (e) {
      console.log('Error fetching alerts', e.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveWrapper}>
          {/* Header Bar */}
          <View style={{ zIndex: 100, position: 'relative' }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => setShowMenu(!showMenu)}
              >
                <MaterialCommunityIcons name="menu" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => navigation?.navigate('Mapa')}
              >
                <MaterialCommunityIcons name="home" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {showMenu && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowMenu(false);
                    navigation?.navigate('AddFirefighter');
                  }}
                >
                  <MaterialCommunityIcons name="account-multiple-plus" size={20} color="#263238" />
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
                  <MaterialCommunityIcons name="alert-plus" size={20} color="#263238" />
                  <Text style={styles.dropdownItemText}>Cargar Emergencia</Text>
                </TouchableOpacity>
                <View style={styles.dropdownDivider} />
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowMenu(false);
                    navigation?.navigate('Checklist');
                  }}
                >
                  <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#263238" />
                  <Text style={styles.dropdownItemText}>Cargar Inventario</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Alertas</Text>
            <Text style={styles.subtitle}>Centro de emergencias</Text>
          </View>

          {/* Filter Section */}
          <View style={styles.filterSection}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.label}
                onPress={() => setActiveFilter(f.label)}
                style={[
                  styles.filterChip,
                  activeFilter === f.label ? styles.filterChipActive : styles.filterChipInactive
                ]}
              >
                <View style={styles.filterRow}>
                  <Text style={[
                    styles.filterText,
                    activeFilter === f.label ? styles.filterTextActive : styles.filterTextInactive
                  ]}>
                    {f.label}
                  </Text>
                  {f.count && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{f.count}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Alert List */}
          <View style={styles.alertList}>
            {alerts.map((alert) => (
              <TouchableOpacity 
                key={alert.id} 
                style={styles.alertCard} 
                activeOpacity={0.7}
                onPress={() => navigation?.navigate('AlertDetail')}
              >
                <View style={[styles.iconBox, { backgroundColor: alert.iconBg }]}>
                  <MaterialCommunityIcons name={alert.icon} size={28} color={alert.iconColor} />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.tagRow}>
                      <StatusBadge severity={alert.severity} />
                      <StatusBadge severity={alert.status} type="status" />
                    </View>
                  </View>

                  <Text style={styles.alertType} numberOfLines={1}>{alert.type}</Text>
                  <Text style={styles.address} numberOfLines={1}>{alert.address}</Text>
                  <Text style={styles.timeAgo}>{alert.timeAgo}</Text>
                </View>

                <MaterialIcons name="chevron-right" size={24} color="#cfd8dc" style={styles.chevron} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 600, // For desktop responsiveness
    alignSelf: 'center',
  },
  menuButton: {
    backgroundColor: '#263238',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
      }
    })
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
      }
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#263238',
  },
  titleSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#90a4ae',
    marginTop: 4,
    fontWeight: '500',
  },
  filterSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#263238',
  },
  filterChipInactive: {
    backgroundColor: '#f1f5f9',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterTextInactive: {
    color: '#90a4ae',
  },
  countBadge: {
    backgroundColor: '#af101a',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  alertList: {
    gap: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 4px 10px rgba(0,0,0,0.05)',
      }
    })
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertType: {
    fontSize: 16,
    fontWeight: '800',
    color: '#263238',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
});
