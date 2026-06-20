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
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/AdminEquipmentScreenStyles';

function getMockTools() {
  return [
    { id: 't1', nombre_herramienta: 'EXTINTOR ABC 10KG', cantidad_disponible: 12, descripcion: 'Extintores reglamentarios de polvo' },
    { id: 't2', nombre_herramienta: 'MANGUERA DE ALTA PRESIÓN 2.5"', cantidad_disponible: 8, descripcion: 'Mangueras de tela sintética' },
    { id: 't3', nombre_herramienta: 'HACHA DE RESCATE', cantidad_disponible: 4, descripcion: 'Hachas con mango de fibra de vidrio' },
    { id: 't4', nombre_herramienta: 'EQUIPO ERA (SCBA)', cantidad_disponible: 6, descripcion: 'Equipos de respiración autónoma' },
    { id: 'fixed_radio', nombre_herramienta: 'RADIO DE REPUESTO', cantidad_disponible: 5, descripcion: 'Equipo de comunicación base de repuesto' },
    { id: 'fixed_motosierra', nombre_herramienta: 'MOTOSIERRA DE CUARTEL', cantidad_disponible: 2, descripcion: 'Motosierra asignada para mantenimiento general del cuartel' }
  ];
}

function getIconoBolso(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('trauma') || n.includes('medic') || n.includes('primero')) return 'medical-bag';
  if (n.includes('cuerda') || n.includes('soga') || n.includes('rescate')) return 'rope';
  if (n.includes('incendio') || n.includes('fuego')) return 'fire-extinguisher';
  if (n.includes('herramienta') || n.includes('kit')) return 'toolbox-outline';
  return 'bag-personal-outline';
}

export default function AdminEquipmentScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState('moviles'); // 'moviles' | 'base' | 'bolsos'
  const [herramientas, setHerramientas] = useState([]);
  const [loadingBase, setLoadingBase] = useState(false);

  // Estados de Móviles
  const [camiones, setCamiones] = useState([]);
  const [loadingMoviles, setLoadingMoviles] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoNombreCamion, setNuevoNombreCamion] = useState('');

  // Estados de Bolsos
  const [bolsos, setBolsos] = useState([]);
  const [loadingBolsos, setLoadingBolsos] = useState(false);
  const [modalBolsoVisible, setModalBolsoVisible] = useState(false);
  const [nuevoNombreBolso, setNuevoNombreBolso] = useState('');

  useEffect(() => {
    if (activeTab === 'base') {
      fetchHerramientas();
    } else if (activeTab === 'bolsos') {
      fetchBolsos();
    } else {
      fetchCamiones();
    }
  }, [activeTab]);

  const fetchCamiones = async () => {
    setLoadingMoviles(true);
    try {
      const res = await fetch(`${API_BASE_URL}/camiones`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCamiones(Array.isArray(data) ? data : []);
      } else {
        console.warn('Error fetching camiones:', res.status);
      }
    } catch (e) {
      console.warn('Error fetching camiones:', e);
    } finally {
      setLoadingMoviles(false);
    }
  };

  const crearCamion = async () => {
    if (!nuevoNombreCamion.trim()) {
      Alert.alert('Error', 'El nombre del móvil no puede estar vacío.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/camiones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          nombre_camion: nuevoNombreCamion.trim()
        })
      });
      if (res.ok) {
        Alert.alert('✅ Éxito', 'El móvil se ha agregado correctamente.');
        setNuevoNombreCamion('');
        setModalVisible(false);
        fetchCamiones();
      } else {
        const errData = await res.json();
        Alert.alert('Error', errData.error || 'No se pudo agregar el móvil.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    }
  };

  const toggleEstadoCamion = async (camion) => {
    const nuevoEstado = camion.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      const res = await fetch(`${API_BASE_URL}/camiones/${camion.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          estado: nuevoEstado
        })
      });
      if (res.ok) {
        fetchCamiones();
      } else {
        Alert.alert('Error', 'No se pudo actualizar el estado del móvil.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    }
  };

  const eliminarCamion = (camion) => {
    const performDelete = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/camiones/${camion.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (res.status === 204 || res.ok) {
          Alert.alert('✅ Éxito', 'El móvil se ha eliminado correctamente.');
          fetchCamiones();
        } else {
          const errData = await res.json().catch(() => ({}));
          Alert.alert(
            '⚠️ No se pudo eliminar',
            errData.error || 'Este móvil contiene registros de checklist históricos. Desactívalo en su lugar o solicita al equipo de backend habilitar la eliminación en cascada.'
          );
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudo conectar al servidor.');
      }
    };

    Alert.alert(
      'Eliminar Móvil',
      `¿Estás seguro que deseas eliminar el ${camion.nombre_camion?.toUpperCase()} de forma permanente? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: performDelete, style: 'destructive' }
      ]
    );
  };

  const fetchHerramientas = async () => {
    setLoadingBase(true);
    try {
      const res = await fetch(`${API_BASE_URL}/herramientas/`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      let data = [];
      if (res.ok) {
        data = await res.json();
      }
      let tools = Array.isArray(data) ? data : [];
      if (tools.length === 0) {
        tools = getMockTools();
      } else {
        const hasRadio = tools.some(t => t.nombre_herramienta?.toUpperCase().includes('RADIO DE REPUESTO'));
        const hasMotosierra = tools.some(t => t.nombre_herramienta?.toUpperCase().includes('MOTOSIERRA DE CUARTEL'));

        if (!hasRadio) {
          tools.push({ id: 'fixed_radio', nombre_herramienta: 'RADIO DE REPUESTO', cantidad_disponible: 5, descripcion: 'Equipo de comunicación base de repuesto' });
        }
        if (!hasMotosierra) {
          tools.push({ id: 'fixed_motosierra', nombre_herramienta: 'MOTOSIERRA DE CUARTEL', cantidad_disponible: 2, descripcion: 'Motosierra asignada para mantenimiento general del cuartel' });
        }
      }
      setHerramientas(tools);
    } catch (e) {
      console.warn('Error fetching herramientas:', e);
      setHerramientas(getMockTools());
    } finally {
      setLoadingBase(false);
    }
  };

  const fetchBolsos = async () => {
    setLoadingBolsos(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bolsos/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBolsos(Array.isArray(data) ? data : []);
      } else {
        console.warn('Error fetching bolsos:', res.status);
      }
    } catch (e) {
      console.warn('Error fetching bolsos:', e);
    } finally {
      setLoadingBolsos(false);
    }
  };

  const crearBolso = async () => {
    if (!nuevoNombreBolso.trim()) {
      Alert.alert('Error', 'El nombre del bolso no puede estar vacío.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/bolsos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          nombre_bolso: nuevoNombreBolso.trim(),
          estado: 'ACTIVO'
        })
      });
      if (res.ok) {
        Alert.alert('✅ Éxito', 'El bolso se ha agregado correctamente.');
        setNuevoNombreBolso('');
        setModalBolsoVisible(false);
        fetchBolsos();
      } else {
        const errData = await res.json();
        Alert.alert('Error', errData.error || 'No se pudo agregar el bolso.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    }
  };


  const toggleEstadoBolso = async (bolso) => {
    const nuevoEstado = bolso.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    
    // Optimistic UI update
    setBolsos(prev => prev.map(b => b.id === bolso.id ? { ...b, estado: nuevoEstado } : b));
    
    try {
      const res = await fetch(`${API_BASE_URL}/bolsos/${bolso.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          nombre_bolso: bolso.nombre_bolso,
          estado: nuevoEstado
        })
      });

      if (!res.ok) {
        // Revert on error
        setBolsos(prev => prev.map(b => b.id === bolso.id ? { ...b, estado: bolso.estado } : b));
        Alert.alert('Error', 'No se pudo actualizar el estado del bolso.');
      }
    } catch (e) {
      console.error(e);
      // Revert on error
      setBolsos(prev => prev.map(b => b.id === bolso.id ? { ...b, estado: bolso.estado } : b));
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    }
  };

  const eliminarBolso = (bolso) => {
    const performDelete = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/bolsos/${bolso.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (res.status === 204 || res.ok) {
          Alert.alert('✅ Éxito', 'El bolso se ha eliminado correctamente.');
          fetchBolsos();
        } else {
          const errData = await res.json().catch(() => ({}));
          Alert.alert(
            '⚠️ No se pudo eliminar',
            errData.error || 'Este bolso contiene registros de checklist históricos. Desactívalo en su lugar o solicita al equipo de backend habilitar la eliminación en cascada.'
          );
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudo conectar al servidor.');
      }
    };

    Alert.alert(
      'Eliminar Bolso',
      `¿Estás seguro que deseas eliminar el bolso ${bolso.nombre_bolso?.toUpperCase()} de forma permanente? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: performDelete, style: 'destructive' }
      ]
    );
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
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <Image source={{ uri: 'https://randomuser.me/api/portraits/men/41.jpg' }} style={styles.avatarTop} />
          <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <View style={styles.topBarRight}>
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

        {activeTab === 'moviles' ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => setModalVisible(true)}>
            <MaterialCommunityIcons name="truck-plus" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>AGREGAR NUEVO MÓVIL</Text>
          </TouchableOpacity>
        ) : activeTab === 'bolsos' ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => setModalBolsoVisible(true)}>
            <MaterialCommunityIcons name="bag-personal-plus" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>AGREGAR NUEVO BOLSO</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Información', 'Para agregar herramientas contactá al administrador de base de datos.')}>
            <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>AGREGAR EQUIPO</Text>
          </TouchableOpacity>
        )}

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, activeTab === 'moviles' && styles.tabActive]} onPress={() => setActiveTab('moviles')}>
            <MaterialCommunityIcons name="fire-truck" size={14} color={activeTab === 'moviles' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'moviles' && styles.tabTextActive]}>MÓVILES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'base' && styles.tabActive]} onPress={() => setActiveTab('base')}>
            <MaterialCommunityIcons name="warehouse" size={14} color={activeTab === 'base' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'base' && styles.tabTextActive]}>BASE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'bolsos' && styles.tabActive]} onPress={() => setActiveTab('bolsos')}>
            <MaterialCommunityIcons name="bag-personal" size={14} color={activeTab === 'bolsos' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'bolsos' && styles.tabTextActive]}>BOLSOS/KITS</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'moviles' ? (
          <>
            {loadingMoviles ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 12, fontWeight: '600' }}>Cargando móviles...</Text>
              </View>
            ) : camiones.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="truck-remove-outline" size={48} color="#334155" />
                <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>No hay móviles registrados</Text>
              </View>
            ) : (
              camiones.map((camion) => {
                const esActivo = camion.estado === 'ACTIVO';
                return (
                  <View key={camion.id} style={styles.vehicleCard}>
                    <View style={[styles.vehicleLeftBorder, { backgroundColor: esActivo ? '#22c55e' : '#64748b' }]} />
                    <View style={styles.vehicleInfo}>
                      <View style={styles.vehicleTitleRow}>
                        <Text style={styles.vehicleName}>{camion.nombre_camion?.toUpperCase()}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: esActivo ? '#052e16' : '#1e293b' }]}>
                          <Text style={[styles.statusTextWhite, { color: esActivo ? '#22c55e' : '#94a3b8' }]}>
                            {esActivo ? 'OPERATIVO' : 'DESACTIVADO'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.vehicleType}>FLOTA TÁCTICA SECTOR 7G</Text>

                      <View style={[styles.vehicleActions, { marginTop: 16 }]}>
                        <TouchableOpacity
                          style={[styles.vehicleBtn, { backgroundColor: esActivo ? '#26282f' : '#052e16' }]}
                          onPress={() => toggleEstadoCamion(camion)}
                        >
                          <Text style={[styles.vehicleBtnText, { color: esActivo ? '#cbd5e1' : '#22c55e' }]}>
                            {esActivo ? 'DESACTIVAR' : 'ACTIVAR'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.vehicleBtn, { backgroundColor: '#2d1515' }]}
                          onPress={() => eliminarCamion(camion)}
                        >
                          <Text style={[styles.vehicleBtnText, { color: '#ef4444' }]}>ELIMINAR</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

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
        ) : activeTab === 'bolsos' ? (
          <>
            {/* BOLSOS Y KITS TAB */}
            <View style={styles.baseHeader}>
              <MaterialCommunityIcons name="bag-personal" size={20} color="#93c5fd" />
              <Text style={styles.baseHeaderText}>CONTROL DE BOLSOS Y KITS TÁCTICOS</Text>
            </View>

            {loadingBolsos ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 12, fontWeight: '600' }}>Cargando bolsos...</Text>
              </View>
            ) : bolsos.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="bag-remove-outline" size={48} color="#334155" />
                <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>No hay bolsos registrados</Text>
              </View>
            ) : (
              bolsos.map((bolso) => {
                const esActivo = bolso.estado === 'ACTIVO';
                return (
                  <View key={bolso.id} style={styles.vehicleCard}>
                    <View style={[styles.vehicleLeftBorder, { backgroundColor: esActivo ? '#22c55e' : '#64748b' }]} />
                    <View style={styles.vehicleInfo}>
                      <View style={styles.vehicleTitleRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <MaterialCommunityIcons name={getIconoBolso(bolso.nombre_bolso)} size={24} color={esActivo ? '#dc2626' : '#64748b'} />
                          <Text style={styles.vehicleName}>{bolso.nombre_bolso?.toUpperCase()}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: esActivo ? '#052e16' : '#1e293b' }]}>
                          <Text style={[styles.statusTextWhite, { color: esActivo ? '#22c55e' : '#94a3b8' }]}>
                            {esActivo ? 'OPERATIVO' : 'DESACTIVADO'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.vehicleType}>KITS POST-EMERGENCIA (AFTER EMERGENCY)</Text>

                      <View style={[styles.vehicleActions, { marginTop: 16 }]}>
                        <TouchableOpacity
                          style={[styles.vehicleBtn, { backgroundColor: esActivo ? '#26282f' : '#052e16' }]}
                          onPress={() => toggleEstadoBolso(bolso)}
                        >
                          <Text style={[styles.vehicleBtnText, { color: esActivo ? '#cbd5e1' : '#22c55e' }]}>
                            {esActivo ? 'DESACTIVAR' : 'ACTIVAR'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.vehicleBtn, { backgroundColor: '#2d1515' }]}
                          onPress={() => eliminarBolso(bolso)}
                        >
                          <Text style={[styles.vehicleBtnText, { color: '#ef4444' }]}>ELIMINAR</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
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

      {/* Modal de Creación de Móvil */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="fire-truck" size={24} color="#e11d48" />
              <Text style={styles.modalTitle}>NUEVO MÓVIL</Text>
            </View>
            <Text style={styles.modalDesc}>
              Ingresá la identificación del nuevo móvil de la flota táctica.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. MÓVIL 03"
              placeholderTextColor="#64748b"
              value={nuevoNombreCamion}
              onChangeText={setNuevoNombreCamion}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setNuevoNombreCamion('');
                }}
              >
                <Text style={styles.modalBtnTextCancel}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={crearCamion}
              >
                <Text style={styles.modalBtnTextConfirm}>CREAR MÓVIL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Creación de Bolso */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalBolsoVisible}
        onRequestClose={() => setModalBolsoVisible(false)}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="bag-personal" size={24} color="#e11d48" />
              <Text style={styles.modalTitle}>NUEVO BOLSO / KIT</Text>
            </View>
            <Text style={styles.modalDesc}>
              Ingresá el nombre o identificación del bolso táctico para el control post-emergencia.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. BOLSO DE TRAUMA B"
              placeholderTextColor="#64748b"
              value={nuevoNombreBolso}
              onChangeText={setNuevoNombreBolso}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setModalBolsoVisible(false);
                  setNuevoNombreBolso('');
                }}
              >
                <Text style={styles.modalBtnTextCancel}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={crearBolso}
              >
                <Text style={styles.modalBtnTextConfirm}>CREAR BOLSO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};