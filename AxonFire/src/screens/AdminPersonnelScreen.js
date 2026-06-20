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
import { styles } from '../styles/AdminPersonnelScreenStyles';

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
        { text: 'Confirmar', onPress: () => logout().then(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })), style: 'destructive' }
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
    const nombre = person.nombre || '';
    const apellido = person.apellido || '';
    const fullName = `${nombre} ${apellido}`.toLowerCase();
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
};

