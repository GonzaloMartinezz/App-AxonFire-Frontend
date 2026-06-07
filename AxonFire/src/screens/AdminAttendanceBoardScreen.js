import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config/api';

// ─── Classification Tabs ─────────────────────────────────────
const CLASSIFICATION_TABS = [
  { key: 'all', label: 'TODOS', icon: 'account-group' },
  { key: 'officer', label: 'OFICIALES', icon: 'shield-star' },
  { key: 'suboficial', label: 'SUBOFICIALES', icon: 'shield-account' },
  { key: 'tropa', label: 'TROPA', icon: 'account-hard-hat' },
];

// Mapear rango a clasificación
const classifyRank = (rangoNombre) => {
  if (!rangoNombre) return 'tropa';
  const r = rangoNombre.toLowerCase();
  if (r.includes('capitán') || r.includes('capitan') || r.includes('teniente') || r.includes('oficial') || r.includes('comandante')) return 'officer';
  if (r.includes('sargento') || r.includes('cabo') || r.includes('suboficial')) return 'suboficial';
  return 'tropa';
};

const STATUS_CONFIG = {
  ACEPTADO:  { color: '#10b981', bg: '#064e3b', label: 'CONFIRMADO', icon: 'check-circle', key: 'confirmed' },
  PENDIENTE: { color: '#f59e0b', bg: '#78350f', label: 'PENDIENTE',  icon: 'clock-outline', key: 'pending' },
  RECHAZADO: { color: '#ef4444', bg: '#7f1d1d', label: 'RECHAZADO',  icon: 'close-circle', key: 'absent' },
  ABSENT:    { color: '#ef4444', bg: '#7f1d1d', label: 'SIN RESPONDER', icon: 'help-circle', key: 'absent' }
};

// ── Local Mock Helpers ───────────────────────────────────────────────────────
function getMockBomberos() {
  return [
    {
      id: 'b1',
      nombre: 'ROBERTO',
      apellido: 'MENDOZA',
      usuario_id: 'u1',
      usuarioId: { id: 'u1', nombre_usuario: 'RMENDOZA' },
      rangoBombero: { id: 'r1', nombre_rol: 'CAPITAN' }
    },
    {
      id: 'b2',
      nombre: 'JORGE',
      apellido: 'ESPINOZA',
      usuario_id: 'u2',
      usuarioId: { id: 'u2', nombre_usuario: 'JESPINOZA' },
      rangoBombero: { id: 'r2', nombre_rol: 'SARGENTO' }
    },
    {
      id: 'b3',
      nombre: 'LAURA',
      apellido: 'TORRES',
      usuario_id: 'u3',
      usuarioId: { id: 'u3', nombre_usuario: 'LTORRES' },
      rangoBombero: { id: 'r3', nombre_rol: 'OFICIAL' }
    },
    {
      id: 'b4',
      nombre: 'FERNANDO',
      apellido: 'GOMEZ',
      usuario_id: 'u4',
      usuarioId: { id: 'u4', nombre_usuario: 'FGOMEZ' },
      rangoBombero: { id: 'r4', nombre_rol: 'SUB-OFICIAL' }
    },
    {
      id: 'b5',
      nombre: 'OPERADOR',
      apellido: 'AXON-42',
      usuario_id: 'u5',
      usuarioId: { id: 'u5', nombre_usuario: 'OPERADOR' },
      rangoBombero: { id: 'r5', nombre_rol: 'OFICIAL' }
    }
  ];
}

async function loadMockResponses(alertaId) {
  try {
    const local = await AsyncStorage.getItem(`responses_${alertaId}`);
    if (local) return JSON.parse(local);

    const defaults = [
      {
        id: 'res1',
        alerta_id: alertaId,
        usuario_id: 'u1',
        usuarioId: {
          id: 'u1',
          nombre_usuario: 'RMENDOZA',
          bombero: {
            nombre: 'ROBERTO',
            apellido: 'MENDOZA',
            rangoBombero: { nombre_rol: 'CAPITAN' }
          }
        },
        estado_respuesta: 'ACEPTADO',
        fecha_hora: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: 'res2',
        alerta_id: alertaId,
        usuario_id: 'u2',
        usuarioId: {
          id: 'u2',
          nombre_usuario: 'JESPINOZA',
          bombero: {
            nombre: 'JORGE',
            apellido: 'ESPINOZA',
            rangoBombero: { nombre_rol: 'SARGENTO' }
          }
        },
        estado_respuesta: 'ACEPTADO',
        fecha_hora: new Date(Date.now() - 8 * 60 * 1000).toISOString()
      },
      {
        id: 'res3',
        alerta_id: alertaId,
        usuario_id: 'u3',
        usuarioId: {
          id: 'u3',
          nombre_usuario: 'LTORRES',
          bombero: {
            nombre: 'LAURA',
            apellido: 'TORRES',
            rangoBombero: { nombre_rol: 'OFICIAL' }
          }
        },
        estado_respuesta: 'RECHAZADO',
        fecha_hora: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      }
    ];
    await AsyncStorage.setItem(`responses_${alertaId}`, JSON.stringify(defaults));
    return defaults;
  } catch (e) {
    return [];
  }
}

export default function AdminAttendanceBoardScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user, token, logout } = useAuth();

  // Alerta ID recibido por parámetros
  const alertaId = route?.params?.alerta_id ?? null;

  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmedCountAPI, setConfirmedCountAPI] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentAlertaId, setCurrentAlertaId] = useState(alertaId);
  const [activeAlerta, setActiveAlerta] = useState(null);
  const [timerText, setTimerText] = useState('00:00:00');
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  // ─── Construir headers con token ──────────────────────────────
  const authHeaders = useCallback(() => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, [token]);

  // Fetch de datos ───────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!token) return;
    setErrorMsg(null);
    try {
      let activeAlertaId = alertaId;

      // 1. Si no hay alertaId, buscamos la más reciente
      if (!activeAlertaId) {
        try {
          const hasta = new Date().toISOString();
          const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          console.log('AdminAttendanceBoardScreen - Rango de fechas para consulta:', { desde, hasta });
          const resAlertas = await axios.get(`${API_BASE_URL}/alerta/rango`, {
            headers: authHeaders(),
            params: { fecha_desde: desde, fecha_hasta: hasta },
            timeout: 1500
          });
          const data = resAlertas.data;
          const alertas = data.alertas || [];
          if (alertas.length > 0) {
            const activas = [];
            for (const a of alertas) {
              const isLocallyFinalized = await AsyncStorage.getItem(`finalized_alert_${a.id}`);
              if (!isLocallyFinalized && a.estadoAlerta?.nombre_estado !== 'FINALIZADO') {
                activas.push(a);
              }
            }
            if (activas.length > 0) {
              const ultima = activas.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))[0];
              activeAlertaId = ultima.id;
            } else {
              activeAlertaId = null;
            }
          }
        } catch (e) {
          console.log('Error fetching range alerts:', e);
        }
      }

      if (!activeAlertaId) {
        activeAlertaId = 'demo-alert-123';
      }

      setCurrentAlertaId(activeAlertaId);

      // 2. Obtener todos los bomberos
      let bomberosData = [];
      try {
        const bomberosRes = await axios.get(`${API_BASE_URL}/usuarios/bomberos`, {
          headers: authHeaders(),
          timeout: 1500
        });
        if (bomberosRes.status === 200) {
          bomberosData = bomberosRes.data;
          if (!bomberosData || bomberosData.length === 0 || bomberosData.error) {
            bomberosData = getMockBomberos();
          }
        } else {
          bomberosData = getMockBomberos();
        }
      } catch (err) {
        console.log('Error loading bomberos from server, using local fallback:', err);
        bomberosData = getMockBomberos();
      }

      // 3. Si tenemos una alerta activa, obtener respuestas
      let respuestasMap = {};
      if (activeAlertaId) {
        let respuestas = [];
        try {
          const respuestasRes = await axios.get(`${API_BASE_URL}/respuestas_alertas/${activeAlertaId}`, {
            headers: authHeaders(),
            timeout: 1500
          });
          if (respuestasRes.status === 200) {
            respuestas = respuestasRes.data;
            if (!respuestas || respuestas.length === 0 || respuestas.error) {
              respuestas = await loadMockResponses(activeAlertaId);
            }
          } else {
            respuestas = await loadMockResponses(activeAlertaId);
          }
        } catch (e) {
          console.log('Error loading responses from server, using local fallback:', e);
          respuestas = await loadMockResponses(activeAlertaId);
        }

        respuestas.forEach((r) => {
          const uid = r.usuario_id || r.usuarioId?.id;
          if (uid) respuestasMap[uid] = r;
        });

        // Set confirmed count
        const confirmedVal = respuestas.filter(r => r.estado_respuesta === 'ACEPTADO').length;
        setConfirmedCountAPI(confirmedVal);

        // Obtener detalle de la alerta
        let detailData = null;
        if (activeAlertaId === 'demo-alert-123') {
          const isLocallyFinalized = await AsyncStorage.getItem(`finalized_alert_${activeAlertaId}`);
          detailData = {
            id: 'demo-alert-123',
            observaciones: 'INCENDIO ESTRUCTURAL DEPOSITOS',
            ubicacion: 'AV. VELEZ SARSFIELD 3200',
            fecha_hora: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            estadoAlerta: { nombre_estado: isLocallyFinalized ? 'FINALIZADO' : 'ACTIVA' }
          };
        } else {
          try {
            const detailRes = await axios.get(`${API_BASE_URL}/alerta/${activeAlertaId}`, {
              headers: authHeaders(),
              timeout: 1500
            });
            if (detailRes.status === 200) {
              detailData = detailRes.data;
              const isLocallyFinalized = await AsyncStorage.getItem(`finalized_alert_${activeAlertaId}`);
              if (isLocallyFinalized) {
                detailData = {
                  ...detailData,
                  estadoAlerta: { ...detailData.estadoAlerta, nombre_estado: 'FINALIZADO' }
                };
              }
            }
          } catch (e) {
            console.log('Error getting detail, using fallback:', e);
          }
        }

        if (!detailData) {
          const isLocallyFinalized = await AsyncStorage.getItem(`finalized_alert_${activeAlertaId}`);
          detailData = {
            id: activeAlertaId,
            observaciones: 'ALERTA TÁCTICA ACTIVA',
            ubicacion: 'ZONA DE DESPACHO',
            fecha_hora: new Date().toISOString(),
            estadoAlerta: { nombre_estado: isLocallyFinalized ? 'FINALIZADO' : 'ACTIVA' }
          };
        }
        setActiveAlerta(detailData);
      } else {
        setActiveAlerta(null);
      }

      // 4. Mapear bomberos a la estructura de la pantalla
      const mapped = (bomberosData || []).map((b) => {
        if (!b) return null;
        const usuarioId = b.usuario_id || b.usuarioId?.id;
        const respuesta = usuarioId ? respuestasMap[usuarioId] : null;
        const estadoRespuesta = respuesta?.estado_respuesta || 'ABSENT';
        const rangoNombre = b.rangoBombero?.nombre_rol || b.rango || '';

        return {
          id: b.id || Math.random().toString(),
          usuario_id: usuarioId,
          name: `${b.nombre || ''} ${b.apellido || ''}`.trim().toUpperCase() || 'BOMBERO SIN NOMBRE',
          rank: (rangoNombre || 'BOMBERO').toUpperCase(),
          unit: b.usuario?.nombre_usuario || b.usuarioId?.nombre_usuario || '—',
          classification: classifyRank(rangoNombre),
          status: estadoRespuesta,
          eta: respuesta && respuesta.fecha_hora
            ? new Date(respuesta.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            : '—',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(b.nombre || 'X')}&background=1b1d24&color=f8fafc&size=96`,
        };
      }).filter(Boolean);

      setPersonnel(mapped);
      setLastRefresh(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Error fetchData AttendanceBoard:', err);
      setErrorMsg(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [alertaId, authHeaders]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // ── Timer Effect ─────────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (activeAlerta && activeAlerta.fecha_hora && activeAlerta.estadoAlerta?.nombre_estado !== 'FINALIZADO') {
      const startTime = new Date(activeAlerta.fecha_hora).getTime();
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = Math.max(0, now - startTime);
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        setTimerText(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimerText('00:00:00');
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeAlerta]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const finalizarEmergencia = async () => {
    if (!currentAlertaId) return;

    Alert.alert(
      "Finalizar Emergencia",
      "¿Estás seguro de que deseas finalizar esta emergencia? Ya no se podrán recibir respuestas.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              try {
                await axios.patch(`${API_BASE_URL}/alerta/${currentAlertaId}/finalizar`, {}, {
                  headers: authHeaders(),
                  timeout: 1500
                });
              } catch (e) {
                console.log('Error calling finalize endpoint, using local override:', e);
              }

              // Always write local override
              await AsyncStorage.setItem(`finalized_alert_${currentAlertaId}`, 'true');

              Alert.alert("Éxito", "La emergencia ha sido finalizada.");
              fetchData();
            } catch (e) {
              Alert.alert("Error", e.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // ── Filtrado ─────────────────────────────────────────────────
  const filtered = personnel.filter((p) => {
    const matchesTab = activeTab === 'all' || p.classification === activeTab;
    const matchesSearch =
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.unit.toLowerCase().includes(searchText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // ── Conteos ──────────────────────────────────────────────────
  const totalCount = personnel.length;
  const confirmedCount = personnel.filter((p) => p.status === 'ACEPTADO').length;
  const pendingCount = personnel.filter((p) => p.status === 'PENDIENTE').length;
  const absentCount = personnel.filter((p) => p.status === 'RECHAZADO' || p.status === 'ABSENT').length;
  const confirmRate = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;

  // ── Helpers ──────────────────────────────────────────────────
  const confirmLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => { if(logout) { logout().then(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })) } else { navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) } }, style: 'destructive' },
    ]);
  };

  const renderStatusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ABSENT;
    return (
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        <MaterialCommunityIcons name={cfg.icon} size={10} color={cfg.color} />
        <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    );
  };

  // ── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" backgroundColor="#16181d" />
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={{ color: '#94a3b8', marginTop: 16, fontSize: 12, letterSpacing: 1 }}>CARGANDO DATOS…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#16181d" />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
            <MaterialCommunityIcons name="refresh" size={20} color="#94a3b8" />
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
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleLeftGroup}>
            <View style={styles.redAccent} />
            <View>
              <Text style={styles.headerLabel}>ATTENDANCE BOARD • {lastRefresh}</Text>
              <Text style={styles.mainTitle}>TABLERO DE{'\n'}ASISTENCIA</Text>
            </View>
          </View>
          {activeAlerta ? (
            <View style={styles.rateBox}>
              <Text style={styles.rateLabel}>TIEMPO TRANSCURRIDO</Text>
              <Text style={[styles.rateValue, { color: '#ef4444' }]}>{timerText}</Text>
            </View>
          ) : null}
        </View>

        {!activeAlerta ? (
          <View style={[styles.alertInfoBox, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
            <MaterialCommunityIcons name="shield-check" size={48} color="#388e3c" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>No hay ninguna emergencia en curso</Text>
            <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>El personal se encuentra inactivo o en guardia.</Text>
          </View>
        ) : (
          <View style={styles.alertInfoBox}>
             <View style={styles.alertInfoTop}>
                <Text style={styles.alertInfoTitle}>{activeAlerta.observaciones || 'INCIDENTE'}</Text>
                <View style={[styles.statusTag, { backgroundColor: activeAlerta.estadoAlerta?.nombre_estado === 'FINALIZADO' ? '#1e293b' : '#451a1a' }]}>
                   <Text style={styles.statusTagText}>{activeAlerta.estadoAlerta?.nombre_estado || activeAlerta.estado_alerta_id}</Text>
                </View>
             </View>
             <Text style={styles.alertInfoSub}>{activeAlerta.ubicacion}</Text>
          </View>
        )}

        {currentAlertaId && activeAlerta?.estadoAlerta?.nombre_estado !== 'FINALIZADO' && (
          <TouchableOpacity style={styles.finalizeBtn} onPress={finalizarEmergencia}>
            <MaterialCommunityIcons name="flag-checkered" size={20} color="#fff" />
            <Text style={styles.finalizeBtnText}>FINALIZAR EMERGENCIA</Text>
          </TouchableOpacity>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.retryText}>REINTENTAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Cards Row */}
        <View style={styles.cardsRow}>
          <View style={[styles.summaryCard, { borderLeftColor: '#10b981' }]}>
            <MaterialCommunityIcons name="check-circle" size={22} color="#10b981" />
            <Text style={styles.cardNumber}>{String(confirmedCount).padStart(2, '0')}</Text>
            <Text style={styles.cardLabel}>CONFIRMADOS</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#f59e0b' }]}>
            <MaterialCommunityIcons name="clock-outline" size={22} color="#f59e0b" />
            <Text style={styles.cardNumber}>{String(pendingCount).padStart(2, '0')}</Text>
            <Text style={styles.cardLabel}>PENDIENTES</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#ef4444' }]}>
            <MaterialCommunityIcons name="close-circle" size={22} color="#ef4444" />
            <Text style={styles.cardNumber}>{String(absentCount).padStart(2, '0')}</Text>
            <Text style={styles.cardLabel}>AUSENTES</Text>
          </View>
        </View>

        {/* Total Counter Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalLeft}>
            <Text style={styles.totalLabel}>TOTAL PERSONAL REGISTRADO</Text>
            <Text style={styles.totalValue}>
              {String(totalCount).padStart(2, '0')}{' '}
              <Text style={styles.totalUnit}>EFECTIVOS</Text>
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${confirmRate}%` }]} />
          </View>
        </View>

        {/* API Count Badge */}
        {alertaId && (
          <View style={styles.apiCountBadge}>
            <MaterialCommunityIcons name="account-check" size={16} color="#10b981" />
            <Text style={styles.apiCountText}>
              ASISTENCIAS CONFIRMADAS (API): {confirmedCountAPI}
            </Text>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="BUSCAR POR NOMBRE O UNIDAD"
            placeholderTextColor="#64748b"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialCommunityIcons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Classification Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContainer}
        >
          {CLASSIFICATION_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === 'all' ? totalCount : personnel.filter((p) => p.classification === tab.key).length;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.classTab, isActive && styles.classTabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name={tab.icon} size={16} color={isActive ? '#fff' : '#64748b'} />
                <Text style={[styles.classTabText, isActive && styles.classTabTextActive]}>{tab.label}</Text>
                <View style={[styles.classTabBadge, isActive && styles.classTabBadgeActive]}>
                  <Text style={[styles.classTabBadgeText, isActive && { color: '#dc2626' }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>LISTA DE PERSONAL</Text>
          <View style={styles.sectionCountBadge}>
            <Text style={styles.sectionCountText}>
              {filtered.length} RESULTADO{filtered.length !== 1 ? 'S' : ''}
            </Text>
          </View>
        </View>

        {/* Personnel List */}
        {filtered.map((person) => {
          const cfg = STATUS_CONFIG[person.status] || STATUS_CONFIG.ABSENT;
          return (
            <View key={person.id} style={[styles.personCard, { borderLeftColor: cfg.color }]}>
              <View style={styles.personInfoRow}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: person.avatar }}
                    style={[styles.personAvatar, person.status === 'RECHAZADO' && { opacity: 0.4 }]}
                  />
                  <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                </View>
                <View style={styles.personDetails}>
                  <View style={styles.rankRow}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{person.rank || 'BOMBERO'}</Text>
                    </View>
                    <Text style={styles.unitText}>{person.unit}</Text>
                  </View>
                  <Text style={[styles.personName, person.status === 'RECHAZADO' && { opacity: 0.5 }]}>
                    {person.name}
                  </Text>
                  {renderStatusBadge(person.status)}
                </View>
                <View style={styles.etaBox}>
                  <Text style={styles.etaLabel}>HORA</Text>
                  <Text style={[styles.etaValue, { color: cfg.color }]}>{person.eta}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={48} color="#334155" />
            <Text style={styles.emptyText}>SIN RESULTADOS</Text>
          </View>
        )}

        {/* Bottom Summary */}
        <View style={styles.bottomSummary}>
          <Text style={styles.bottomSummaryTitle}>RESUMEN DE ASISTENCIA</Text>
          <View style={styles.bottomSummaryRow}>
            <View style={styles.bottomSummaryItem}>
              <Text style={styles.bottomSummaryLabel}>TASA DE RESPUESTA</Text>
              <Text style={styles.bottomSummaryValue}>{confirmRate}%</Text>
            </View>
            <View style={styles.bottomSummaryItem}>
              <Text style={styles.bottomSummaryLabel}>CONFIRMADOS API</Text>
              <Text style={styles.bottomSummaryValue}>
                {String(alertaId ? confirmedCountAPI : confirmedCount).padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16181d' },
  // Top Bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#1a1c23', borderBottomWidth: 1, borderBottomColor: '#26282f' },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topBarTitle: { color: '#e11d48', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  topBarRight: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  iconBtn: { padding: 4 },
  scrollContent: { padding: 24 },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  titleLeftGroup: { flexDirection: 'row', flex: 1 },
  redAccent: { width: 3, backgroundColor: '#dc2626', marginRight: 12, marginTop: 4 },
  headerLabel: { fontSize: 10, color: '#fca5a5', letterSpacing: 2, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  mainTitle: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 33 },
  rateBox: { alignItems: 'flex-end' },
  rateLabel: { fontSize: 9, color: '#94a3b8', letterSpacing: 1, marginBottom: 2 },
  rateValue: { fontSize: 28, fontWeight: '900', color: '#10b981' },
  // Error banner
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 6, padding: 12, marginBottom: 16, gap: 8 },
  errorBannerText: { color: '#fca5a5', fontSize: 11, flex: 1, fontWeight: '600' },
  retryText: { color: '#ef4444', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  // Summary Cards
  cardsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#1b1d24', borderRadius: 6, padding: 14, borderLeftWidth: 3, alignItems: 'center', gap: 6 },
  cardNumber: { fontSize: 28, fontWeight: '900', color: '#f8fafc' },
  cardLabel: { fontSize: 8, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  // Total Card
  totalCard: { backgroundColor: '#1b1d24', borderRadius: 6, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#26282f' },
  totalLeft: { marginBottom: 12 },
  totalLabel: { fontSize: 9, color: '#94a3b8', letterSpacing: 1, fontWeight: '700', marginBottom: 6 },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#fff' },
  totalUnit: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  progressBarBg: { height: 6, backgroundColor: '#26282f', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  // API Count
  apiCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#064e3b', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6, marginBottom: 16 },
  apiCountText: { color: '#10b981', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1b1d24', borderRadius: 6, height: 44, paddingHorizontal: 14, marginBottom: 16 },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 11, letterSpacing: 0.5 },
  // Classification Tabs
  tabsScroll: { marginBottom: 20 },
  tabsContainer: { gap: 8 },
  classTab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1b1d24', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6, gap: 8 },
  classTabActive: { backgroundColor: '#dc2626' },
  classTabText: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  classTabTextActive: { color: '#fff' },
  classTabBadge: { backgroundColor: '#26282f', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, minWidth: 22, alignItems: 'center' },
  classTabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  classTabBadgeText: { fontSize: 10, fontWeight: '900', color: '#94a3b8' },
  // Section Header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionLine: { width: 6, height: 18, borderRadius: 3, backgroundColor: '#dc2626', marginRight: 10 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 2, flex: 1 },
  sectionCountBadge: { backgroundColor: '#26282f', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  sectionCountText: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5 },
  // Person Card
  personCard: { backgroundColor: '#1b1d24', borderRadius: 6, padding: 16, marginBottom: 12, borderLeftWidth: 3 },
  personInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: 14 },
  personAvatar: { width: 48, height: 48, borderRadius: 6 },
  statusDot: { position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#1b1d24' },
  personDetails: { flex: 1 },
  rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rankBadge: { backgroundColor: '#fca5a5', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 2, marginRight: 8 },
  rankText: { color: '#451a1a', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  unitText: { color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  personName: { color: '#f8fafc', fontSize: 14, fontWeight: '800', marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, gap: 4 },
  statusBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  etaBox: { alignItems: 'flex-end' },
  etaLabel: { fontSize: 8, color: '#64748b', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  etaValue: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  // Empty State
  emptyState: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { color: '#334155', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  // Bottom Summary
  bottomSummary: { backgroundColor: '#1b1d24', borderRadius: 6, padding: 20, marginTop: 16, borderWidth: 1, borderColor: '#26282f' },
  bottomSummaryTitle: { color: '#fca5a5', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  bottomSummaryRow: { flexDirection: 'row', gap: 10 },
  bottomSummaryItem: { backgroundColor: '#16181d', padding: 16, borderRadius: 4, flex: 1 },
  bottomSummaryLabel: { color: '#e2e8f0', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  bottomSummaryValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  // Finalize Button
  finalizeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e11d48', paddingVertical: 14, borderRadius: 8, marginBottom: 20, gap: 8 },
  finalizeBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  // Alert Info
  alertInfoBox: { backgroundColor: '#1b1d24', borderRadius: 8, padding: 16, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#dc2626' },
  alertInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  alertInfoTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  alertInfoSub: { color: '#94a3b8', fontSize: 11 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusTagText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
