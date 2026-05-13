import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const { width } = Dimensions.get('window');

const PERSONNEL = [
  {
    id: '1',
    name: 'CAP. MENDOZA, R.',
    role: 'Móvil 12 - Dotación 04',
    status: 'EN SITIO',
    statusColor: '#475569',
    icon: 'fire-truck',
  },
  {
    id: '2',
    name: 'SGT. ESPINOZA, J.',
    role: 'Móvil 05 - Soporte Médico',
    status: 'EN CAMINO',
    statusColor: '#0f766e',
    icon: 'ambulance',
  },
  {
    id: '3',
    name: 'OF. TORRES, L.',
    role: 'Seguridad Perimetral',
    status: 'ASIGNADO',
    statusColor: '#334155',
    icon: 'shield-check',
  },
  {
    id: '4',
    name: 'SUB-OF. GOMEZ, F.',
    role: 'Móvil 08 - Logística',
    status: 'EN SITIO',
    statusColor: '#475569',
    icon: 'truck-cargo-container',
  },
];

export default function AlertDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const alertaId = route?.params?.alerta_id ?? null;
  const { token } = useAuth();

  const [alerta, setAlerta] = useState(null);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!alertaId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const [alertaRes, respuestasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/alerta/${alertaId}`, { headers }),
        fetch(`${API_BASE_URL}/respuestas_alertas/${alertaId}`, { headers })
      ]);

      if (alertaRes.ok) {
        setAlerta(await alertaRes.json());
      }
      
      if (respuestasRes.ok) {
        const respuestas = await respuestasRes.json();
        const aceptados = respuestas
          .filter(r => r.estado_respuesta === 'ACEPTADO')
          .map((r, i) => ({
            id: r.id || String(i),
            name: `${r.usuarioId?.bombero?.nombre || 'B.'} ${r.usuarioId?.bombero?.apellido || ''}`.trim(),
            role: r.usuarioId?.bombero?.rangoBombero?.nombre_rol || 'Bombero',
            status: 'EN CAMINO',
            statusColor: '#0f766e',
            icon: 'account',
            hora: new Date(r.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
        setResponders(aceptados);
      }
    } catch (err) {
      console.log('Error fetching alert details', err);
    } finally {
      setLoading(false);
    }
  }, [alertaId, token]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail])
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  if (!alerta) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Alerta no encontrada</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#e11d48' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121417" />
      
{/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.headerLeft}>
           <TouchableOpacity onPress={() => navigation?.goBack()}>
               <MaterialCommunityIcons name="arrow-left" size={24} color="#e11d48" />
           </TouchableOpacity>
            <Text style={styles.headerTitle}>DETALLE DE EMERGENCIA</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Alerts')}>
            <MaterialCommunityIcons name="bell" size={22} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Perfil')}>
            <MaterialCommunityIcons name="account" size={20} color="#e2e8f0" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Alert Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardLeftBorder} />
          <View style={styles.mainCardContent}>
            <View style={styles.titleRow}>
              <Text style={styles.mainTitle}>{alerta?.observaciones || 'Incidente'}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{alerta?.estado_alerta_id === 'FINALIZADO' ? 'FINALIZADO' : 'ACTIVA'}</Text>
              </View>
            </View>
            
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color="#94a3b8" />
              <Text style={styles.locationText}>{alerta?.ubicacion || 'Ubicación no especificada'}</Text>
            </View>

            <View style={styles.timeStatsBox}>
              <View style={styles.timeStatItem}>
                <Text style={styles.timeLabel}>LLAMADO</Text>
                <Text style={styles.timeValueRed}>
                  {alerta?.fecha_hora ? new Date(alerta.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} HS
                </Text>
              </View>
              <View style={styles.timeStatItemRight}>
                <Text style={styles.timeLabel}>TRANSCURRIDO</Text>
                <Text style={styles.timeValueWhite}>--:--</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logistics Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="archive" size={20} color="#e2e8f0" />
            <Text style={styles.sectionTitle}>LOGÍSTICA Y SUMINISTROS</Text>
          </View>

          <View style={styles.logisticsItem}>
            <View style={[styles.logisticsIcon, { backgroundColor: '#1e3a8a' }]}>
              <MaterialCommunityIcons name="water" size={18} color="#60a5fa" />
            </View>
            <View>
              <Text style={styles.logisticsTitle}>Abastecimiento Hídrico</Text>
              <Text style={styles.logisticsSubtitle}>Móvil 08 - En ruta</Text>
            </View>
          </View>

          <View style={styles.logisticsItem}>
            <View style={[styles.logisticsIcon, { backgroundColor: '#451a1a' }]}>
              <MaterialCommunityIcons name="account-group" size={18} color="#fca5a5" />
            </View>
            <View>
              <Text style={styles.logisticsTitle}>Refuerzo de Personal</Text>
              <Text style={styles.logisticsSubtitle}>Dotación B - Solicitado</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.requestButton}>
            <Text style={styles.requestButtonText}>+ SOLICITAR RECURSOS</Text>
          </TouchableOpacity>
        </View>

        {/* Live Tracking Map Placeholder */}
        <View style={styles.mapContainer}>
          {/* Map Background Simulation */}
          <View style={styles.mapBackgroundOverlay} />
          
          <View style={styles.liveBadge}>
            <View style={styles.redDot} />
            <Text style={styles.liveText}>LIVE TRACKING</Text>
          </View>

          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapFab}>
              <MaterialCommunityIcons name="layers" size={22} color="#e2e8f0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapFab}>
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#e2e8f0" />
            </TouchableOpacity>
          </View>

          <View style={styles.impactCard}>
            <Text style={styles.impactLabel}>RADIO DE IMPACTO</Text>
            <Text style={styles.impactValue}>250 METROS</Text>
          </View>
        </View>

        {/* Personnel Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-group" size={20} color="#e2e8f0" />
            <Text style={styles.sectionTitle}>PERSONAL EN RESPUESTA</Text>
          </View>

          {responders.map((person) => (
            <View key={person.id} style={styles.personnelCard}>
              <View style={styles.personTopRow}>
                <Text style={styles.personName}>{person.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: person.statusColor }]}>
                  <Text style={styles.statusText}>{person.status}</Text>
                </View>
              </View>
              <View style={styles.personRoleRow}>
                <MaterialCommunityIcons name={person.icon} size={16} color="#94a3b8" />
                <Text style={styles.personRoleText}>{person.role} ({person.hora})</Text>
              </View>
            </View>
          ))}
          {responders.length === 0 && (
             <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 10 }}>No hay personal en respuesta aún.</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.fakeBottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation?.navigate('PersonnelStatus')}
        >
          <MaterialCommunityIcons name="view-grid" size={24} color="#64748b" />
          <Text style={styles.navLabel}>STATUS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation?.navigate('PersonnelStatus')}
        >
          <MaterialCommunityIcons name="account-group" size={24} color="#64748b" />
          <Text style={styles.navLabel}>UNITS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sosContainer}
          onPress={() => navigation?.navigate('NewAlert')}
        >
           <MaterialCommunityIcons name="asterisk" size={28} color="#e11d48" />
           <Text style={styles.sosLabel}>SOS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="archive" size={24} color="#64748b" />
          <Text style={styles.navLabel}>LOGISTICS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation?.navigate('Mapa')}
        >
          <MaterialCommunityIcons name="compass" size={24} color="#64748b" />
          <Text style={styles.navLabel}>MAP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#e11d48', 
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    padding: 4,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#2d333b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentScroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100, // For the bottom nav
  },
  mainCard: {
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 24,
  },
  cardLeftBorder: {
    width: 4,
    backgroundColor: '#e11d48',
  },
  mainCardContent: {
    flex: 1,
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mainTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
  },
  levelBadge: {
    backgroundColor: '#b91c1c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  levelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  locationText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  timeStatsBox: {
    backgroundColor: '#13141a',
    borderRadius: 6,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeStatItem: {
    flex: 1,
  },
  timeStatItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timeLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  timeValueRed: {
    color: '#fca5a5',
    fontSize: 16,
    fontWeight: '800',
  },
  timeValueWhite: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionContainer: {
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  logisticsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  logisticsIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logisticsTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  logisticsSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
  },
  requestButton: {
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  requestButtonText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  mapContainer: {
    height: 250,
    backgroundColor: '#1a1d24',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#26282f',
  },
  mapBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1d24',
    opacity: 0.8,
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fca5a5',
  },
  liveText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mapControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    gap: 8,
  },
  mapFab: {
    width: 40,
    height: 40,
    backgroundColor: '#2d333b',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#2d333b',
    padding: 12,
    borderRadius: 4,
  },
  impactLabel: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  impactValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  personnelCard: {
    borderLeftWidth: 2,
    borderLeftColor: '#334155',
    paddingLeft: 16,
    marginBottom: 20,
  },
  personTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  personName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  personRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personRoleText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  fakeBottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: '#1b1d24',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#26282f',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  navLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sosContainer: {
    backgroundColor: '#2d333b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 2,
    flex: 1.2,
  },
  sosLabel: {
    color: '#e11d48',
    fontSize: 10,
    fontWeight: '800',
  }
});
