import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

async function loadPersonnel(token) {
  let remote = [];
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/bomberos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      remote = Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.log('Error loading personnel from server:', err);
  }

  // Load from local storage
  let local = [];
  try {
    const stored = await AsyncStorage.getItem('local_firefighters');
    if (stored) local = JSON.parse(stored);
  } catch (e) {
    console.log('Error reading local firefighters:', e);
  }

  // If remote is empty, use mock list
  if (remote.length === 0) {
    remote = [
      { id: 'b1', nombre: 'ROBERTO', apellido: 'MENDOZA', rangoBombero: { nombre_rol: 'CAPITÁN' } },
      { id: 'b2', nombre: 'JORGE', apellido: 'ESPINOZA', rangoBombero: { nombre_rol: 'SARGENTO' } },
      { id: 'b3', nombre: 'LAURA', apellido: 'TORRES', rangoBombero: { nombre_rol: 'TENIENTE' } },
      { id: 'b4', nombre: 'FERNANDO', apellido: 'GOMEZ', rangoBombero: { nombre_rol: 'BOMBERO' } }
    ];
  }

  // Merge local and remote
  const all = [...remote];
  local.forEach(l => {
    if (!all.some(r => r.id === l.id || (r.nombre?.toLowerCase() === l.nombre?.toLowerCase() && r.apellido?.toLowerCase() === l.apellido?.toLowerCase()))) {
      all.push(l);
    }
  });

  return all;
}

export default function AdminPersonnelScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, logout } = useAuth();
  const [personnel, setPersonnel] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setError(null);
      const data = await loadPersonnel(token);
      setPersonnel(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPersonnel();
  };

  const confirmLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => logout().then(() => navigation.replace('Login')), style: 'destructive' }
      ]
    );
  };

  const getRangoColor = (rango) => {
    const rangoNombre = rango?.toUpperCase();
    if (['CAPITÁN', 'MAYOR', 'JEFE DE CUARTEL'].includes(rangoNombre)) return '#fca5a5';
    if (['TENIENTE', 'SARGENTO'].includes(rangoNombre)) return '#fbbf24';
    return '#6ee7b7';
  };

  const getStatusInfo = (item) => {
    return { isFree: false, status: 'ACTIVO', timeRest: 'EN SERVICIO' };
  };

  const filteredPersonnel = personnel.filter(person => {
    const fullName = `${person.nombre} ${person.apellido}`.toLowerCase();
    const username = person.usuarioId?.nombre_usuario?.toLowerCase() || '';
    const rango = person.rangoBombero?.nombre_rol?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || username.includes(query) || rango.includes(query);
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#16181d" />

      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <View style={styles.avatarTop} />
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />}
      >
        <Text style={styles.mainTitle}>GESTIÓN DE{'\n'}PERSONAL</Text>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AddFirefighter')}
        >
          <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>ALTA DE PERSONAL</Text>
        </TouchableOpacity>

        <View style={styles.filtersBox}>
          <View style={styles.searchRow}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="BUSCAR BOMBERO O UNIDAD"
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.dropdownRow}>
            <Text style={styles.dropdownText}>TODOS LOS RANGOS</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownRow}>
            <Text style={styles.dropdownText}>TODAS LAS UNIDADES</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator color="#dc2626" size="large" />
            <Text style={styles.loadingText}>Cargando personal...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchPersonnel}>
              <Text style={styles.retryButtonText}>REINTENTAR</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPersonnel.length === 0 ? (
          <View style={styles.centerContent}>
            <MaterialCommunityIcons name="account-off" size={48} color="#64748b" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron resultados' : 'No hay bomberos registrados'}
            </Text>
          </View>
        ) : (
          <>
            {filteredPersonnel.map((person) => {
              const statusInfo = getStatusInfo(person);
              return (
                <View key={person.id} style={styles.personCard}>
                  <View style={[styles.cardLeftBorder, { backgroundColor: getRangoColor(person.rangoBombero?.nombre_rol) }]} />
                  <View style={styles.avatarContainer}>
                    <MaterialCommunityIcons name="account" size={28} color="#94a3b8" />
                  </View>

                  <View style={styles.personDetails}>
                    <View style={styles.rankUnitRow}>
                      <View style={[styles.rankBadge, { backgroundColor: getRangoColor(person.rangoBombero?.nombre_rol) + '30' }]}>
                        <Text style={[styles.rankText, { color: getRangoColor(person.rangoBombero?.nombre_rol) }]}>
                          {person.rangoBombero?.nombre_rol || 'SIN RANGO'}
                        </Text>
                      </View>
                      <Text style={styles.unitText}>UNIDAD ACTIVA</Text>
                    </View>
                    <Text style={styles.personName}>{person.nombre} {person.apellido}</Text>
                    <View style={styles.statusRow}>
                      <MaterialCommunityIcons
                        name={statusInfo.isFree ? "close-circle" : "check-circle"}
                        size={12}
                        color={statusInfo.isFree ? "#fca5a5" : "#38bdf8"}
                      />
                      <Text style={[styles.statusText, { color: statusInfo.isFree ? "#fca5a5" : "#38bdf8" }]}>
                        {statusInfo.status}
                      </Text>
                      <MaterialCommunityIcons name="clock-outline" size={12} color="#f8fafc" style={{ marginLeft: 12 }} />
                      <Text style={styles.timeText}>{statusInfo.timeRest}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.moreBtn}>
                    <MaterialCommunityIcons name="dots-vertical" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              );
            })}

            <View style={styles.paginationRow}>
              <Text style={styles.paginationText}>
                MOSTRANDO {filteredPersonnel.length} DE {personnel.length}{'\n'}EFECTIVOS
              </Text>
              <View style={styles.paginationControls}>
                <Text style={styles.pageBtnText}>ANTERIOR</Text>
                <Text style={styles.pageCurrentText}>01</Text>
                <Text style={styles.pageBtnText}>SIGUIENTE</Text>
              </View>
            </View>
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
    backgroundColor: '#334155',
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
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#f8fafc',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 24,
    lineHeight: 16,
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
  filtersBox: {
    backgroundColor: '#1b1d24',
    padding: 20,
    borderRadius: 8,
    marginBottom: 32,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26282f',
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 12,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#26282f',
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  dropdownText: {
    color: '#cbd5e1',
    fontSize: 11,
    letterSpacing: 1,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 12,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 12,
    fontSize: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#26282f',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 12,
  },
  personCard: {
    flexDirection: 'row',
    backgroundColor: '#1b1d24',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
    paddingRight: 16,
  },
  cardLeftBorder: {
    width: 4,
    height: '100%',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 4,
    margin: 16,
    backgroundColor: '#26282f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  rankUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rankBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 8,
  },
  rankText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  unitText: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  personName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  timeText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  moreBtn: {
    padding: 8,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  paginationText: {
    color: '#94a3b8',
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 14,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pageBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pageCurrentText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  }
});