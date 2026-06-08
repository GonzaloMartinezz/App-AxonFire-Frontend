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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Estados nuevos
  const [postura, setPostura] = useState('NORMAL'); // 'NORMAL' | 'AMARILLA' | 'DESPACHO'
  const [pulseActive, setPulseActive] = useState(true);
  const [comunicaciones, setComunicaciones] = useState([]);

  // Telemetría simulada de alta fidelidad según el móvil
  const obtenerTelemetriaMovi = (nombre = '') => {
    const nom = nombre.toUpperCase();
    if (nom.includes('12')) {
      return {
        tipo: 'AUTOBOMBA URBANA PESADA',
        aguaMax: 4500,
        aguaActual: 4500,
        combustible: 92,
        dotacion: 5,
        icono: 'fire-truck',
      };
    } else if (nom.includes('15') || nom.includes('14')) {
      return {
        tipo: 'UNIDAD DE RESCATE RÁPIDO',
        aguaMax: 1500,
        aguaActual: 1200,
        combustible: 85,
        dotacion: 4,
        icono: 'ambulance',
      };
    } else if (nom.includes('20')) {
      return {
        tipo: 'ABASTECIMIENTO / CISTERNA',
        aguaMax: 10000,
        aguaActual: 10000,
        combustible: 78,
        dotacion: 2,
        icono: 'water-pump',
      };
    }
    // Fallback por defecto
    return {
      tipo: 'UNIDAD DE PRIMERA DOTACIÓN',
      aguaMax: 3000,
      aguaActual: 2700,
      combustible: 90,
      dotacion: 4,
      icono: 'fire-truck',
    };
  };

  // 1. Cargar camiones activos
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

  // 2. Cargar registros logísticos / comunicaciones en vivo
  async function cargarComunicaciones() {
    try {
      const resAlertas = await fetch(`${API_BASE_URL}/alertas/activas`, { headers });
      if (resAlertas.ok) {
        const activas = await resAlertas.json();
        if (Array.isArray(activas) && activas.length > 0) {
          const alertaId = activas[0].id;
          const resLogs = await fetch(`${API_BASE_URL}/registros_comunicacion/alerta/${alertaId}`, { headers });
          if (resLogs.ok) {
            const logs = await resLogs.json();
            if (Array.isArray(logs) && logs.length > 0) {
              const mapped = logs.map(l => ({
                id: l.id,
                fecha: new Date(l.createdAt || l.fecha_registro || Date.now()),
                mensaje: l.mensaje || l.observaciones || 'Registro de telemetría',
                emisor: l.usuarioId?.bombero 
                  ? `${l.usuarioId.bombero.nombre} ${l.usuarioId.bombero.apellido}`
                  : l.usuarioId?.nombre_usuario || 'Operador Central',
                esDinamico: true
              }));
              setComunicaciones(mapped.slice(0, 3));
              return;
            }
          }
        }
      }
    } catch (err) {
      console.log('Error cargando bitácora de logística:', err);
    }

    // Bitácora simulada de alta fidelidad si no hay dinámicos
    setComunicaciones([
      {
        id: 'mock_1',
        fecha: new Date(Date.now() - 4 * 60 * 1000), // Hace 4m
        mensaje: 'Móvil 12 solicita cisterna de apoyo para control en perímetro este.',
        emisor: 'Oficial Principal Juarez',
      },
      {
        id: 'mock_2',
        fecha: new Date(Date.now() - 18 * 60 * 1000), // Hace 18m
        mensaje: 'Abastecimiento de combustible y lubricantes completado en Móvil 15.',
        emisor: 'Sgto. Mansilla (Suministros)',
      },
      {
        id: 'mock_3',
        fecha: new Date(Date.now() - 45 * 60 * 1000), // Hace 45m
        mensaje: 'Inspección de equipos ERA del cuartel finalizada sin faltantes.',
        emisor: 'Base Operativa Axon Fire',
      }
    ]);
  }

  // 3. Cargar postura guardada
  async function cargarPostura() {
    try {
      const valor = await AsyncStorage.getItem('axon_logistic_posture');
      if (valor) {
        setPostura(valor);
      }
    } catch (err) {
      console.log('Error cargando postura de base:', err);
    }
  }

  // 4. Cambiar postura de base con confirmación
  const cambiarPostura = async (nuevaPostura) => {
    if (nuevaPostura === postura) return;

    const ejecutarCambio = async () => {
      setPostura(nuevaPostura);
      try {
        await AsyncStorage.setItem('axon_logistic_posture', nuevaPostura);
      } catch (err) {
        console.log('Error guardando postura de base:', err);
      }
    };

    if (nuevaPostura === 'AMARILLA') {
      Alert.alert(
        '⚠️ Cambiar Postura de Base',
        '¿Confirmar cambio a Postura de Alerta Amarilla por prevención climática o evento de magnitud media?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar Alerta', style: 'default', onPress: ejecutarCambio },
        ]
      );
    } else if (nuevaPostura === 'DESPACHO') {
      Alert.alert(
        '🚨 CONVOCATORIA GENERAL',
        '¿Confirmar cambio a Postura de DESPACHO GENERAL? Esto colocará la base en alerta máxima y convocará a todos los efectivos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'ACTIVAR ALERTA GENERAL', style: 'destructive', onPress: ejecutarCambio },
        ]
      );
    } else {
      // Normal
      ejecutarCambio();
    }
  };

  useEffect(() => {
    cargarCamiones();
    cargarComunicaciones();
    cargarPostura();

    // Micro-animación de parpadeo para Dispatch
    const interval = setInterval(() => {
      setPulseActive(p => !p);
    }, 850);

    return () => clearInterval(interval);
  }, []);

  const refrescarTodo = async () => {
    setRefrescando(true);
    await Promise.all([cargarCamiones(true), cargarComunicaciones()]);
    setRefrescando(false);
  };

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

  const getFormatedTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
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
          onPress={refrescarTodo}
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescarTodo}
            colors={['#dc2626']}
            tintColor="#dc2626"
          />
        }
      >
        {/* ── Header ───────────────────────────────────── */}
        <Text style={styles.pageLabel}>LOGÍSTICA</Text>
        <Text style={styles.pageTitle}>CENTRO{'\n'}LOGÍSTICO</Text>

        {/* ── 1. Postura de Alerta de Base (Base Posture) ── */}
        <View style={styles.postureCard}>
          <Text style={styles.postureTitle}>POSTURA OPERATIVA DE BASE</Text>
          <Text style={styles.postureDesc}>
            {postura === 'NORMAL' && 'Guardia normal. Todo el personal y recursos listos en base.'}
            {postura === 'AMARILLA' && 'Alerta Amarilla activa. Prevención y alistamiento de equipos.'}
            {postura === 'DESPACHO' && '🚨 Despacho General. Convocatoria máxima y prioridad operativa.'}
          </Text>

          <View style={styles.postureButtonRow}>
            {/* Guardia Normal */}
            <TouchableOpacity
              style={[
                styles.postureBtn,
                styles.normalBtnBorder,
                postura === 'NORMAL' && styles.normalBtnActive,
              ]}
              onPress={() => cambiarPostura('NORMAL')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={16}
                color={postura === 'NORMAL' ? '#22c55e' : '#64748b'}
              />
              <Text style={[styles.postureBtnText, postura === 'NORMAL' && { color: '#22c55e' }]}>
                NORMAL
              </Text>
            </TouchableOpacity>

            {/* Alerta Amarilla */}
            <TouchableOpacity
              style={[
                styles.postureBtn,
                styles.yellowBtnBorder,
                postura === 'AMARILLA' && styles.yellowBtnActive,
              ]}
              onPress={() => cambiarPostura('AMARILLA')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="alert-outline"
                size={16}
                color={postura === 'AMARILLA' ? '#f59e0b' : '#64748b'}
              />
              <Text style={[styles.postureBtnText, postura === 'AMARILLA' && { color: '#f59e0b' }]}>
                ALERTA
              </Text>
            </TouchableOpacity>

            {/* Despacho General */}
            <TouchableOpacity
              style={[
                styles.postureBtn,
                styles.redBtnBorder,
                postura === 'DESPACHO' && (pulseActive ? styles.redBtnActivePulse : styles.redBtnActiveStatic),
              ]}
              onPress={() => cambiarPostura('DESPACHO')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="fire-alert"
                size={16}
                color={postura === 'DESPACHO' ? '#ef4444' : '#64748b'}
              />
              <Text style={[styles.postureBtnText, postura === 'DESPACHO' && { color: '#ef4444' }]}>
                DESPACHO
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Acceso Premium al Mapa de Flota ── */}
        <TouchableOpacity
          style={styles.mapCard}
          onPress={() => navigation.navigate('Mapa')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.08)', 'rgba(6, 95, 70, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mapCardGradient}
          >
            <View style={styles.mapIconContainer}>
              <MaterialCommunityIcons name="radar" size={26} color="#22c55e" />
            </View>
            <View style={styles.mapCardInfo}>
              <Text style={styles.mapCardTitle}>MAPA OPERATIVO EN VIVO</Text>
              <Text style={styles.mapCardDesc}>Seguimiento y telemetría satelital de la flota</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#64748b" style={styles.mapChevron} />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── 3. MÓVILES ACTIVOS (Telemetría Enriquecida) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MÓVILES ACTIVOS Y TELEMETRÍA</Text>
          {cargando ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{camiones.length} LISTOS</Text>
            </View>
          )}
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

        {/* Lista de camiones en telemetría */}
        {!cargando &&
          !error &&
          camiones.map((camion) => {
            const telemetry = obtenerTelemetriaMovi(camion.nombre_camion);
            const waterPercentage = Math.round((telemetry.aguaActual / telemetry.aguaMax) * 100);

            return (
              <View key={camion.id} style={styles.camionCard}>
                {/* Cabecera del móvil */}
                <View style={styles.camionHeader}>
                  <View style={styles.camionIconBox}>
                    <MaterialCommunityIcons name={telemetry.icono} size={22} color="#fff" />
                  </View>
                  <View style={styles.camionHeaderInfo}>
                    <Text style={styles.camionNombre}>{camion.nombre_camion?.toUpperCase()}</Text>
                    <Text style={styles.camionTipoLabel}>{telemetry.tipo}</Text>
                  </View>
                  <View style={styles.camionStatusBadge}>
                    <View style={styles.dotGreen} />
                    <Text style={styles.camionEstado}>MÓVIL LISTO</Text>
                  </View>
                </View>

                {/* Telemetría (Agua & Combustible) */}
                <View style={styles.telemetrySection}>
                  {/* Agua */}
                  <View style={styles.telemetryRow}>
                    <View style={styles.telemetryLabelRow}>
                      <View style={styles.labelWithIcon}>
                        <MaterialCommunityIcons name="water" size={14} color="#38bdf8" />
                        <Text style={styles.telemetryLabel}>AGUA</Text>
                      </View>
                      <Text style={styles.telemetryVal}>
                        {telemetry.aguaActual}L / {telemetry.aguaMax}L ({waterPercentage}%)
                      </Text>
                    </View>
                    <View style={styles.gaugeTrack}>
                      <View
                        style={[
                          styles.gaugeFillBlue,
                          { width: `${waterPercentage}%` },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Combustible */}
                  <View style={styles.telemetryRow}>
                    <View style={styles.telemetryLabelRow}>
                      <View style={styles.labelWithIcon}>
                        <MaterialCommunityIcons name="gas-station" size={14} color="#fbbf24" />
                        <Text style={styles.telemetryLabel}>COMBUSTIBLE</Text>
                      </View>
                      <Text style={styles.telemetryVal}>{telemetry.combustible}%</Text>
                    </View>
                    <View style={styles.gaugeTrack}>
                      <View
                        style={[
                          telemetry.combustible > 25 ? styles.gaugeFillGreen : styles.gaugeFillYellow,
                          { width: `${telemetry.combustible}%` },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* Footer del card */}
                <View style={styles.camionCardFooter}>
                  <View style={styles.crewBadge}>
                    <MaterialCommunityIcons name="account-multiple" size={12} color="#94a3b8" />
                    <Text style={styles.crewText}>{telemetry.dotacion} Efectivos</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.botonChecklist}
                    onPress={() => abrirChecklist(camion)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="clipboard-check-outline" size={14} color="#fff" />
                    <Text style={styles.botonChecklistText}>AUDITORÍA</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

        {/* ── 4. PLANILLAS Y AUDITORÍAS DE SERVICIO (Checklist Grid) ── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24, marginBottom: 12 }]}>
          <Text style={styles.sectionTitle}>AUDITORÍAS Y PLANILLAS DE SERVICIO</Text>
          <View style={[styles.countBadge, { backgroundColor: '#1e1b4b' }]}>
            <Text style={[styles.countBadgeText, { color: '#c084fc' }]}>4 SECTORES</Text>
          </View>
        </View>

        <View style={styles.gridAuditores}>
          {/* 1. Chequeo Diario */}
          <TouchableOpacity
            style={[styles.auditCard, { borderLeftColor: '#38bdf8' }]}
            onPress={() => {
              if (camiones.length > 0) {
                navigation.navigate('WeeklyChecklist', {
                  initialTab: 'diario',
                  camionId: camiones[0].id,
                  camionNombre: camiones[0].nombre_camion,
                  token,
                });
              } else {
                navigation.navigate('WeeklyChecklist', { initialTab: 'diario', token });
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.auditIconBg}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#38bdf8" />
            </View>
            <Text style={styles.auditTitle}>Chequeo Diario</Text>
            <Text style={styles.auditSub}>Inspección de guardia diaria de móviles</Text>
          </TouchableOpacity>

          {/* 2. Control Hidráulico */}
          <TouchableOpacity
            style={[styles.auditCard, { borderLeftColor: '#fbbf24' }]}
            onPress={() => {
              if (camiones.length > 0) {
                navigation.navigate('WeeklyChecklist', {
                  initialTab: 'mantenimiento',
                  camionId: camiones[0].id,
                  camionNombre: camiones[0].nombre_camion,
                  token,
                });
              } else {
                navigation.navigate('WeeklyChecklist', { initialTab: 'mantenimiento', token });
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.auditIconBg}>
              <MaterialCommunityIcons name="engine-outline" size={20} color="#fbbf24" />
            </View>
            <Text style={styles.auditTitle}>Bombas e Hidráulica</Text>
            <Text style={styles.auditSub}>Presión, mangueras, purgado de bombas</Text>
          </TouchableOpacity>

          {/* 3. Inspección ERA */}
          <TouchableOpacity
            style={[styles.auditCard, { borderLeftColor: '#a855f7' }]}
            onPress={() => {
              navigation.navigate('WeeklyChecklist', {
                initialTab: 'inventario',
                token,
              });
            }}
            activeOpacity={0.8}
          >
            <View style={styles.auditIconBg}>
              <MaterialCommunityIcons name="diving-scuba-tank" size={20} color="#a855f7" />
            </View>
            <Text style={styles.auditTitle}>Equipos ERA</Text>
            <Text style={styles.auditSub}>Tanques autónomos de respiración y máscaras</Text>
          </TouchableOpacity>

          {/* 4. Bolsos de Trauma/EPP */}
          <TouchableOpacity
            style={[styles.auditCard, { borderLeftColor: '#10b981' }]}
            onPress={() => {
              navigation.navigate('ChecklistBolsos', { token });
            }}
            activeOpacity={0.8}
          >
            <View style={styles.auditIconBg}>
              <MaterialCommunityIcons name="bag-personal" size={20} color="#10b981" />
            </View>
            <Text style={styles.auditTitle}>Bolsos de Trauma/EPP</Text>
            <Text style={styles.auditSub}>Revisión de botiquines y bolsos post-alarma</Text>
          </TouchableOpacity>
        </View>

        {/* ── 5. Feed de Comunicaciones Logísticas (Bitácora Vivo) ── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24, marginBottom: 12 }]}>
          <Text style={styles.sectionTitle}>NOVEDADES Y BITÁCORA LOGÍSTICA</Text>
          <View style={[styles.countBadge, { backgroundColor: '#1c1917' }]}>
            <View style={styles.dotPulseGreen} />
            <Text style={[styles.countBadgeText, { color: '#22c55e', marginLeft: 4 }]}>VIVO</Text>
          </View>
        </View>

        <View style={styles.feedContainer}>
          {comunicaciones.map((item, idx) => (
            <View
              key={item.id || idx}
              style={[
                styles.feedItem,
                idx === comunicaciones.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.feedHeaderRow}>
                <View style={styles.feedBadge}>
                  <MaterialCommunityIcons name="account" size={10} color="#64748b" />
                  <Text style={styles.feedEmisor}>{item.emisor}</Text>
                </View>
                <Text style={styles.feedTime}>{getFormatedTime(item.fecha)}</Text>
              </View>
              <Text style={styles.feedMessage}>{item.mensaje}</Text>
            </View>
          ))}
        </View>

        {/* ── Refuerzos ─────────────────────────────────── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
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
          onPress={() =>
            Alert.alert('Solicitar Personal', '¿Confirmar solicitud de personal adicional?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Confirmar' },
            ])
          }
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
    marginBottom: 24,
  },

  // ── Card de Postura Operativa ──
  postureCard: {
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  postureTitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  postureDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 16,
  },
  postureButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  postureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16181d',
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  postureBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  normalBtnBorder: { borderColor: '#1e293b' },
  normalBtnActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: '#22c55e',
  },
  yellowBtnBorder: { borderColor: '#1e293b' },
  yellowBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: '#f59e0b',
  },
  redBtnBorder: { borderColor: '#1e293b' },
  redBtnActiveStatic: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: '#ef4444',
  },
  redBtnActivePulse: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },

  // ── Card de Acceso al Mapa ──
  mapCard: {
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  mapCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mapIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  mapCardTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  mapCardDesc: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  mapChevron: {
    marginLeft: 6,
  },

  // Headers de sección
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

  // Telemetría e información de camión
  camionCard: {
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  camionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  camionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camionHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  camionNombre: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  camionTipoLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  camionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#052e16',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  camionEstado: {
    fontSize: 8,
    fontWeight: '900',
    color: '#22c55e',
    letterSpacing: 0.6,
  },

  // Telemetry visual gauges
  telemetrySection: {
    backgroundColor: '#16181d',
    borderRadius: 8,
    padding: 12,
    gap: 12,
    marginBottom: 14,
  },
  telemetryRow: {
    gap: 6,
  },
  telemetryLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telemetryLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  telemetryVal: {
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: '700',
  },
  gaugeTrack: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  gaugeFillBlue: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 3,
  },
  gaugeFillGreen: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  gaugeFillYellow: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },

  camionCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  crewText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  botonChecklist: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  botonChecklistText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // ── Grid de Auditorías y Planillas ──
  gridAuditores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  auditCard: {
    width: '48%',
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  auditIconBg: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#16181d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  auditTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
  },
  auditSub: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 12,
  },

  // ── Bitácora en Vivo ──
  feedContainer: {
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  feedItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16181d',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  feedEmisor: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '800',
  },
  feedTime: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '700',
  },
  feedMessage: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  dotPulseGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
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

  // Admin Logistics Actions
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