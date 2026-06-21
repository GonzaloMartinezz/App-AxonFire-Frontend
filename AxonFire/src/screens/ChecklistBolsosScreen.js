import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getIconoBolso(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('trauma') || n.includes('medic') || n.includes('primero')) return 'medical-bag';
  if (n.includes('cuerda') || n.includes('soga') || n.includes('rescate')) return 'rope';
  if (n.includes('incendio') || n.includes('fuego')) return 'fire-extinguisher';
  if (n.includes('herramienta') || n.includes('kit')) return 'toolbox-outline';
  return 'bag-personal-outline';
}

function getIconoHerramienta(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('extintor')) return 'fire-extinguisher';
  if (n.includes('venda') || n.includes('gasa')) return 'bandage';
  if (n.includes('tijera')) return 'content-cut';
  if (n.includes('guante')) return 'hand-back-left-outline';
  if (n.includes('linterna') || n.includes('luz')) return 'flashlight';
  if (n.includes('cuerda') || n.includes('soga')) return 'rope';
  if (n.includes('mascarilla') || n.includes('oxig')) return 'air-filter';
  if (n.includes('camilla')) return 'bed-outline';
  if (n.includes('hacha')) return 'axe';
  return 'package-variant-closed';
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ChecklistBolsosScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const camionNombre = route?.params?.camionNombre || 'Móvil';
  const { user, token: userToken } = useAuth();
  const token = userToken ?? user?.token ?? '';

  // Si viene con un bolsoId fijo (desde el disparador de emergencia), lo usamos
  const bolsoIdParam = route?.params?.bolsoId || null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // ── Estado ──────────────────────────────────────────────────────────────────

  // Lista de bolsos disponibles (para el selector)
  const [bolsos, setBolsos] = useState([]);
  const [bolsoActivo, setBolsoActivo] = useState(null); // bolso seleccionado

  // Herramientas del bolso activo
  const [herramientas, setHerramientas] = useState([]);

  // { [inventarioId]: 'CHEQUEADO' | 'FALTANTE' | null }
  const [estadoItems, setEstadoItems] = useState({});

  // { [inventarioId]: string } — observaciones para FALTANTE
  const [observaciones, setObservaciones] = useState({});

  const [cargandoBolsos, setCargandoBolsos] = useState(true);
  const [cargandoInventario, setCargandoInventario] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // ── Estado de Modo Administrador ─────────────────────────────────────────────
  const [modoAdmin, setModoAdmin] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoNombreBolso, setNuevoNombreBolso] = useState('');
  const [creando, setCreando] = useState(false);

  // ── Carga de bolsos ──────────────────────────────────────────────────────────

  async function cargarBolsos() {
    setCargandoBolsos(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/bolsos/`, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      // Traemos todos los bolsos; el filtro de activos/inactivos lo hacemos en el render
      const lista = Array.isArray(data) ? data : [];
      setBolsos(lista);

      // Si vino un bolsoId por params, lo seleccionamos directamente (solo si está activo)
      if (bolsoIdParam) {
        const encontrado = lista.find(b => b.id === bolsoIdParam && b.estado === 'ACTIVO');
        if (encontrado) seleccionarBolso(encontrado, lista);
      }
    } catch (err) {
      console.error('Error cargando bolsos:', err);
      setError('No se pudieron cargar los bolsos.');
    } finally {
      setCargandoBolsos(false);
    }
  }

  // ── CRUD de bolsos ────────────────────────────────────────────────────────────

  async function crearBolso() {
    if (!nuevoNombreBolso.trim()) {
      Alert.alert('Error', 'El nombre del bolso no puede estar vacío.');
      return;
    }
    setCreando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bolsos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nombre_bolso: nuevoNombreBolso.trim(), estado: 'ACTIVO' }),
      });
      if (res.ok) {
        Alert.alert('✅ Listo', 'Bolso creado correctamente.');
        setNuevoNombreBolso('');
        setModalVisible(false);
        cargarBolsos();
      } else {
        const errData = await res.json().catch(() => ({}));
        Alert.alert('Error', errData.error || 'No se pudo crear el bolso.');
      }
    } catch (err) {
      console.error('Error creando bolso:', err);
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    } finally {
      setCreando(false);
    }
  }

  async function toggleEstadoBolso(bolso) {
    const nuevoEstado = bolso.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    
    // Optimistic UI update
    setBolsos(prev => prev.map(b => b.id === bolso.id ? { ...b, estado: nuevoEstado } : b));
    
    try {
      const res = await fetch(`${API_BASE_URL}/bolsos/${bolso.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ nombre_bolso: bolso.nombre_bolso, estado: nuevoEstado }),
      });
      if (!res.ok) {
        // Revert on error
        setBolsos(prev => prev.map(b => b.id === bolso.id ? { ...b, estado: bolso.estado } : b));
        Alert.alert('Error', 'No se pudo actualizar el estado del bolso.');
      }
    } catch (err) {
      console.error('Error actualizando bolso:', err);
      // Revert on error
      setBolsos(prev => prev.map(b => b.id === bolso.id ? { ...b, estado: bolso.estado } : b));
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    }
  }

  function eliminarBolso(bolso) {
    Alert.alert(
      'Eliminar Bolso',
      `¿Estás seguro de eliminar "${bolso.nombre_bolso?.toUpperCase()}"? Esta acción es permanente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/bolsos/${bolso.id}`, {
                method: 'DELETE',
                headers,
              });
              if (res.status === 204 || res.ok) {
                Alert.alert('✅ Eliminado', 'El bolso fue eliminado correctamente.');
                cargarBolsos();
              } else {
                const errData = await res.json().catch(() => ({}));
                Alert.alert(
                  '⚠️ No se pudo eliminar',
                  errData.error || 'Este bolso tiene registros históricos. Desactivalo en su lugar.'
                );
              }
            } catch (err) {
              console.error('Error eliminando bolso:', err);
              Alert.alert('Error', 'No se pudo conectar al servidor.');
            }
          },
        },
      ]
    );
  }

  // ── Seleccionar bolso y cargar su inventario ──────────────────────────────────

  async function seleccionarBolso(bolso, listaBolsos = bolsos) {
    setBolsoActivo(bolso);
    setCargandoInventario(true);
    setHerramientas([]);
    setEstadoItems({});
    setObservaciones({});

    try {
      const res = await fetch(
        `${API_BASE_URL}/bolsos_inventario/bolso/${bolso.id}`,
        { headers }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setHerramientas(lista);

      // Inicializamos todos en null
      const estadoInicial = {};
      lista.forEach(h => { estadoInicial[h.id] = null; });
      setEstadoItems(estadoInicial);
    } catch (err) {
      console.error('Error cargando inventario del bolso:', err);
      Alert.alert('Error', 'No se pudo cargar el inventario del bolso.');
    } finally {
      setCargandoInventario(false);
    }
  }

  async function refrescar() {
    setRefrescando(true);
    await cargarBolsos();
    if (bolsoActivo) await seleccionarBolso(bolsoActivo);
    setRefrescando(false);
  }

  useEffect(() => {
    cargarBolsos();
  }, []);

  // ── Marcar items ──────────────────────────────────────────────────────────────

  function marcarItem(inventarioId, estado) {
    setEstadoItems(prev => ({ ...prev, [inventarioId]: estado }));
    if (estado !== 'FALTANTE') {
      setObservaciones(prev => {
        const nuevo = { ...prev };
        delete nuevo[inventarioId];
        return nuevo;
      });
    }
  }

  // ── Guardar checklist ─────────────────────────────────────────────────────────

  async function guardarChecklist() {
    const sinMarcar = Object.values(estadoItems).filter(v => v === null).length;
    if (sinMarcar > 0) {
      Alert.alert('Items sin marcar', `Quedan ${sinMarcar} ítem(s) sin revisar.`);
      return;
    }

    const faltantesSinObs = Object.entries(estadoItems)
      .filter(([id, v]) => v === 'FALTANTE' && !observaciones[id]?.trim());
    if (faltantesSinObs.length > 0) {
      Alert.alert('Observación requerida', 'Los ítems FALTANTE necesitan una observación.');
      return;
    }

    setGuardando(true);
    try {
      const detalles = Object.entries(estadoItems).map(([inventarioId, controlado]) => ({
        inventarioId,
        controlado,
        ...(controlado === 'FALTANTE' ? { observaciones: observaciones[inventarioId] } : {}),
      }));

      const res = await fetch(`${API_BASE_URL}/checklist_bolsos/bolsos/guardar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ bolsoId: bolsoActivo.id, detalles }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const faltantes = Object.values(estadoItems).filter(v => v === 'FALTANTE').length;

      Alert.alert(
        '✅ Checklist guardado',
        faltantes > 0
          ? `Se registraron ${faltantes} ítem(s) faltante(s). Coordinar reposición.`
          : 'Todo el bolso está completo y en condiciones.',
        [{
          text: 'OK', onPress: () => {
            // Reseteamos para poder hacer otro bolso
            setBolsoActivo(null);
            setHerramientas([]);
            setEstadoItems({});
            setObservaciones({});
          }
        }]
      );
    } catch (err) {
      console.error('Error guardando checklist de bolso:', err);
      Alert.alert('Error', 'No se pudo guardar. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  // ── Progreso ──────────────────────────────────────────────────────────────────

  const total = Object.keys(estadoItems).length;
  const marcados = Object.values(estadoItems).filter(v => v !== null).length;
  const faltantes = Object.values(estadoItems).filter(v => v === 'FALTANTE').length;
  const progreso = total > 0 ? marcados / total : 0;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />

      {/* Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.topBarTitle}>CHECKLIST DE BOLSOS</Text>
            {bolsoActivo && (
              <Text style={styles.topBarSub}>{bolsoActivo.nombre_bolso?.toUpperCase()}</Text>
            )}
            {!bolsoActivo && modoAdmin && (
              <Text style={[styles.topBarSub, { color: '#f59e0b' }]}>MODO ADMINISTRADOR</Text>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {bolsoActivo && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => setBolsoActivo(null)}>
              <MaterialCommunityIcons name="swap-horizontal" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
          {!bolsoActivo && (
            <TouchableOpacity
              style={[styles.iconBtn, modoAdmin && styles.iconBtnActive]}
              onPress={() => setModoAdmin(v => !v)}
            >
              <MaterialCommunityIcons
                name={modoAdmin ? 'cog' : 'cog-outline'}
                size={20}
                color={modoAdmin ? '#f59e0b' : '#94a3b8'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar}
            tintColor="#dc2626" colors={['#dc2626']} />
        }
      >
        {/* ── PASO 1: Selector / Administrador de bolso ──────────────────── */}
        {!bolsoActivo && (
          <>
            {/* ── MODO ADMIN: botón de agregar + lista completa ────────────── */}
            {modoAdmin ? (
              <>
                {/* Encabezado modo admin */}
                <View style={styles.adminHeaderBox}>
                  <MaterialCommunityIcons name="shield-key-outline" size={28} color="#f59e0b" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adminHeaderTitulo}>GESTIÓN DE BOLSOS</Text>
                    <Text style={styles.adminHeaderSub}>Creá, activá o desactivá los kits de emergencia</Text>
                  </View>
                </View>

                {/* Botón agregar nuevo bolso */}
                <TouchableOpacity
                  style={styles.btnAgregarBolso}
                  onPress={() => { setNuevoNombreBolso(''); setModalVisible(true); }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#f59e0b" />
                  <Text style={styles.btnAgregarBolsoText}>AGREGAR NUEVO BOLSO</Text>
                </TouchableOpacity>

                {cargandoBolsos && (
                  <View style={styles.centrado}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.textoEstado}>Cargando bolsos...</Text>
                  </View>
                )}

                {/* Listado completo para admin */}
                {!cargandoBolsos && bolsos.map(bolso => {
                  const activo = bolso.estado === 'ACTIVO';
                  return (
                    <View
                      key={bolso.id}
                      style={[
                        styles.cardBolsoAdmin,
                        { borderLeftColor: activo ? '#22c55e' : '#475569' },
                      ]}
                    >
                      <View style={styles.cardBolsoAdminTop}>
                        <View style={[
                          styles.iconoBolsoBoxAdmin,
                          { backgroundColor: activo ? '#172213' : '#1e2130' },
                        ]}>
                          <MaterialCommunityIcons
                            name={getIconoBolso(bolso.nombre_bolso)}
                            size={24}
                            color={activo ? '#22c55e' : '#475569'}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardBolsoAdminNombre} numberOfLines={1}>
                            {bolso.nombre_bolso?.toUpperCase()}
                          </Text>
                          <View style={styles.estadoBolsoAdminRow}>
                            <View style={[styles.estadoPunto, { backgroundColor: activo ? '#22c55e' : '#475569' }]} />
                            <Text style={[styles.estadoBolsoAdminText, { color: activo ? '#22c55e' : '#64748b' }]}>
                              {activo ? 'OPERATIVO' : 'DESACTIVADO'}
                            </Text>
                          </View>
                        </View>
                        {/* Badge estado */}
                        <View style={[styles.badgeEstadoAdmin, { backgroundColor: activo ? '#14532d' : '#1e293b' }]}>
                          <Text style={[styles.badgeEstadoAdminText, { color: activo ? '#4ade80' : '#64748b' }]}>
                            {activo ? 'ON' : 'OFF'}
                          </Text>
                        </View>
                      </View>

                      {/* Controles admin */}
                      <View style={styles.controlesAdmin}>
                        <TouchableOpacity
                          style={[styles.btnAdminAccion, { borderColor: activo ? '#dc2626' : '#22c55e' }]}
                          onPress={() => toggleEstadoBolso(bolso)}
                          activeOpacity={0.75}
                        >
                          <MaterialCommunityIcons
                            name={activo ? 'toggle-switch-off-outline' : 'toggle-switch-outline'}
                            size={14}
                            color={activo ? '#f87171' : '#4ade80'}
                          />
                          <Text style={[styles.btnAdminAccionText, { color: activo ? '#f87171' : '#4ade80' }]}>
                            {activo ? 'DESACTIVAR' : 'ACTIVAR'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.btnAdminAccion, { borderColor: '#7f1d1d' }]}
                          onPress={() => eliminarBolso(bolso)}
                          activeOpacity={0.75}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={14} color="#f87171" />
                          <Text style={[styles.btnAdminAccionText, { color: '#f87171' }]}>ELIMINAR</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </>
            ) : (
              /* ── MODO NORMAL: selector de bolsos activos ────────────── */
              <>
                <View style={styles.introBox}>
                  <MaterialCommunityIcons name="bag-personal" size={32} color="#dc2626" />
                  <Text style={styles.introTitulo}>¿Qué bolso vas a revisar?</Text>
                  <Text style={styles.introSub}>
                    Seleccioná el kit para registrar el control post-emergencia
                  </Text>
                </View>

                {cargandoBolsos && (
                  <View style={styles.centrado}>
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text style={styles.textoEstado}>Cargando bolsos...</Text>
                  </View>
                )}

                {error && (
                  <TouchableOpacity style={styles.errorCard} onPress={cargarBolsos}>
                    <MaterialCommunityIcons name="wifi-off" size={16} color="#f87171" />
                    <Text style={styles.errorText}>{error} Tocá para reintentar.</Text>
                  </TouchableOpacity>
                )}

                {!cargandoBolsos && !error && bolsos.filter(b => b.estado === 'ACTIVO').length === 0 && (
                  <View style={styles.centrado}>
                    <MaterialCommunityIcons name="bag-remove-outline" size={44} color="#334155" />
                    <Text style={styles.textoEstado}>No hay bolsos activos registrados.</Text>
                  </View>
                )}

                {/* Grid de bolsos activos */}
                <View style={styles.gridBolsos}>
                  {bolsos.filter(b => b.estado === 'ACTIVO').map(bolso => (
                    <TouchableOpacity
                      key={bolso.id}
                      style={styles.cardBolso}
                      onPress={() => seleccionarBolso(bolso)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.iconoBolsoBox}>
                        <MaterialCommunityIcons
                          name={getIconoBolso(bolso.nombre_bolso)}
                          size={28}
                          color="#dc2626"
                        />
                      </View>
                      <Text style={styles.nombreBolso} numberOfLines={2}>
                        {bolso.nombre_bolso?.toUpperCase()}
                      </Text>
                      <View style={styles.estadoBolsoRow}>
                        <View style={styles.puntoverde} />
                        <Text style={styles.estadoBolsoText}>ACTIVO</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* ── PASO 2: Checklist del bolso seleccionado ─────────────────── */}
        {bolsoActivo && (
          <>
            {/* Barra de progreso */}
            {total > 0 && (
              <View style={styles.progressBox}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>{marcados}/{total} revisados</Text>
                  {faltantes > 0 && (
                    <View style={styles.badgeFaltantes}>
                      <Text style={styles.badgeFaltantesText}>{faltantes} FALTANTE(S)</Text>
                    </View>
                  )}
                </View>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    {
                      width: `${progreso * 100}%`,
                      backgroundColor: faltantes > 0 ? '#f59e0b' : '#22c55e'
                    }
                  ]} />
                </View>
              </View>
            )}

            {cargandoInventario && (
              <View style={styles.centrado}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={styles.textoEstado}>Cargando inventario...</Text>
              </View>
            )}

            {!cargandoInventario && herramientas.length === 0 && (
              <View style={styles.centrado}>
                <MaterialCommunityIcons name="package-variant-remove" size={44} color="#334155" />
                <Text style={styles.textoEstado}>Este bolso no tiene herramientas cargadas.</Text>
              </View>
            )}

            {/* Lista de herramientas */}
            {herramientas.map(item => {
              // El backend devuelve herramientaId como objeto con nombre_herramienta
              const nombre = item.herramientaId?.nombre_herramienta
                || item.herramienta
                || 'Herramienta';
              const cantidad = item.cantidad_herramienta ?? item.cantidad ?? 1;
              const estado = estadoItems[item.id] || null;
              const esChequeado = estado === 'CHEQUEADO';
              const esFaltante = estado === 'FALTANTE';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.cardItem,
                    esChequeado && styles.cardOk,
                    esFaltante && styles.cardFail,
                  ]}
                >
                  <View style={styles.cardItemLeft}>
                    <View style={styles.itemIconRow}>
                      <MaterialCommunityIcons
                        name={getIconoHerramienta(nombre)}
                        size={18}
                        color={esFaltante ? '#fca5a5' : esChequeado ? '#86efac' : '#64748b'}
                        style={{ marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemNombre} numberOfLines={1}>
                          {nombre.toUpperCase()}
                        </Text>
                        <Text style={styles.itemCantidad}>Cantidad: {cantidad}</Text>
                      </View>
                    </View>

                    {/* Campo de observación cuando es FALTANTE */}
                    {esFaltante && (
                      <TextInput
                        style={styles.inputObservacion}
                        placeholder="¿Por qué falta? (requerido)"
                        placeholderTextColor="#6b2b2b"
                        value={observaciones[item.id] || ''}
                        onChangeText={t => setObservaciones(prev => ({ ...prev, [item.id]: t }))}
                        multiline
                      />
                    )}
                  </View>

                  {/* Botones OK / FALTANTE */}
                  <View style={styles.botonesItem}>
                    <TouchableOpacity
                      style={[styles.btnCheck, esChequeado && styles.btnCheckActivo]}
                      onPress={() => marcarItem(item.id, esChequeado ? null : 'CHEQUEADO')}
                    >
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={esChequeado ? '#fff' : '#475569'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnFail, esFaltante && styles.btnFailActivo]}
                      onPress={() => marcarItem(item.id, esFaltante ? null : 'FALTANTE')}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={18}
                        color={esFaltante ? '#fff' : '#475569'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Botón guardar */}
            {!cargandoInventario && herramientas.length > 0 && (
              <TouchableOpacity
                style={[styles.botonGuardar, guardando && { opacity: 0.6 }]}
                onPress={guardarChecklist}
                disabled={guardando}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#dc2626', '#991b1b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientGuardar}
                >
                  {guardando
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                      <MaterialCommunityIcons name="content-save-check" size={18} color="#fff" />
                      <Text style={styles.textoGuardar}>GUARDAR REVISIÓN</Text>
                    </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Modal: Crear nuevo bolso ──────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="bag-personal-outline" size={22} color="#f59e0b" />
              <Text style={styles.modalTitulo}>NUEVO BOLSO</Text>
            </View>
            <Text style={styles.modalSub}>
              Ingresá el nombre del kit de emergencia. Quedará disponible de inmediato para los bomberos.
            </Text>

            {/* Input nombre */}
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Bolso de Trauma, Kit de Cuerdas..."
              placeholderTextColor="#475569"
              value={nuevoNombreBolso}
              onChangeText={setNuevoNombreBolso}
              autoCapitalize="words"
              autoFocus
            />

            {/* Botones */}
            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnCancelarText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnCrear, creando && { opacity: 0.6 }]}
                onPress={crearBolso}
                disabled={creando}
                activeOpacity={0.8}
              >
                {creando
                  ? <ActivityIndicator size="small" color="#000" />
                  : <>
                    <MaterialCommunityIcons name="plus" size={16} color="#000" />
                    <Text style={styles.modalBtnCrearText}>CREAR BOLSO</Text>
                  </>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
// Paleta oscura táctica, consistente con ChecklistScreen.js existente

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16181d' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: '#1a1c23',
    borderBottomWidth: 1, borderBottomColor: '#26282f',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  topBarSub: { color: '#dc2626', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 1 },

  scrollContent: { padding: 20 },

  // Intro (selector de bolso)
  introBox: {
    alignItems: 'center', paddingVertical: 28, gap: 8, marginBottom: 20,
  },
  introTitulo: {
    color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.3,
  },
  introSub: {
    color: '#64748b', fontSize: 12, fontWeight: '600',
    textAlign: 'center', lineHeight: 18,
  },

  // Grid de bolsos
  gridBolsos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardBolso: {
    width: '47%', backgroundColor: '#1b1d24',
    borderRadius: 8, padding: 16,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#26282f',
  },
  iconoBolsoBox: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#2d1515',
    alignItems: 'center', justifyContent: 'center',
  },
  nombreBolso: {
    color: '#e2e8f0', fontSize: 11, fontWeight: '800',
    letterSpacing: 0.4, textAlign: 'center',
  },
  estadoBolsoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  puntoverde: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  estadoBolsoText: {
    color: '#22c55e', fontSize: 9, fontWeight: '800', letterSpacing: 0.6,
  },

  // Barra de progreso
  progressBox: { marginBottom: 20 },
  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  progressLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  badgeFaltantes: {
    backgroundColor: '#451a03', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  badgeFaltantesText: {
    color: '#fcd34d', fontSize: 9, fontWeight: '900', letterSpacing: 0.6,
  },
  progressBar: {
    height: 4, backgroundColor: '#26282f', borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },

  // Cards de herramientas
  cardItem: {
    backgroundColor: '#1b1d24', borderRadius: 4, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: '#334155',
  },
  cardOk: { borderLeftColor: '#22c55e' },
  cardFail: { borderLeftColor: '#dc2626', backgroundColor: '#1f1315' },
  cardItemLeft: { flex: 1, paddingRight: 10 },
  itemIconRow: { flexDirection: 'row', alignItems: 'center' },
  itemNombre: {
    color: '#e2e8f0', fontSize: 12, fontWeight: '800',
    letterSpacing: 0.4, marginBottom: 2,
  },
  itemCantidad: { color: '#475569', fontSize: 10, fontWeight: '600' },

  inputObservacion: {
    marginTop: 10,
    backgroundColor: '#2d1515',
    borderRadius: 4, padding: 10,
    color: '#fca5a5', fontSize: 11, fontWeight: '600',
    minHeight: 52, textAlignVertical: 'top',
  },

  botonesItem: { flexDirection: 'row', gap: 8 },
  btnCheck: {
    width: 36, height: 36, borderRadius: 4,
    backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
  },
  btnCheckActivo: { backgroundColor: '#166534' },
  btnFail: {
    width: 36, height: 36, borderRadius: 4,
    backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
  },
  btnFailActivo: { backgroundColor: '#dc2626' },

  // Guardar
  botonGuardar: { marginTop: 28, borderRadius: 4, overflow: 'hidden' },
  gradientGuardar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, paddingVertical: 18,
  },
  textoGuardar: {
    color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2,
  },

  // Estados
  centrado: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  textoEstado: { color: '#475569', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  errorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1f1315', borderRadius: 8, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#dc2626', marginBottom: 12,
  },
  errorText: { color: '#f87171', fontSize: 12, fontWeight: '600', flex: 1 },

  // ── Modo Admin ────────────────────────────────────────────────────────────────
  iconBtnActive: { backgroundColor: '#451a03' },

  adminHeaderBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1a1c23', borderRadius: 8, padding: 16,
    borderWidth: 1, borderColor: '#451a03', marginBottom: 14,
  },
  adminHeaderTitulo: {
    color: '#f59e0b', fontSize: 12, fontWeight: '900', letterSpacing: 1.5,
  },
  adminHeaderSub: {
    color: '#78716c', fontSize: 10, fontWeight: '600', marginTop: 2,
  },

  btnAgregarBolso: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#1c1a10', borderRadius: 8,
    borderWidth: 1, borderColor: '#78350f',
    borderStyle: 'dashed', paddingVertical: 16, marginBottom: 16,
  },
  btnAgregarBolsoText: {
    color: '#f59e0b', fontSize: 12, fontWeight: '900', letterSpacing: 1.5,
  },

  // Tarjeta admin
  cardBolsoAdmin: {
    backgroundColor: '#1b1d24', borderRadius: 8, padding: 14,
    borderLeftWidth: 3, marginBottom: 10,
  },
  cardBolsoAdminTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconoBolsoBoxAdmin: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBolsoAdminNombre: {
    color: '#e2e8f0', fontSize: 12, fontWeight: '800', letterSpacing: 0.4,
  },
  estadoBolsoAdminRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  estadoPunto: { width: 6, height: 6, borderRadius: 3 },
  estadoBolsoAdminText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  badgeEstadoAdmin: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
  },
  badgeEstadoAdminText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  // Controles admin
  controlesAdmin: {
    flexDirection: 'row', gap: 8, marginTop: 12,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#26282f',
  },
  btnAdminAccion: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 4,
    borderWidth: 1, backgroundColor: '#0f1117',
  },
  btnAdminAccionText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },

  // ── Modal crear bolso ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(10, 12, 18, 0.88)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1c23', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: '#26282f',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  modalTitulo: {
    color: '#f59e0b', fontSize: 14, fontWeight: '900', letterSpacing: 1.5,
  },
  modalSub: {
    color: '#64748b', fontSize: 12, fontWeight: '500', lineHeight: 18,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#12141a', borderRadius: 8, padding: 14,
    color: '#e2e8f0', fontSize: 13, fontWeight: '600',
    borderWidth: 1, borderColor: '#334155', marginBottom: 20,
  },
  modalBotones: { flexDirection: 'row', gap: 10 },
  modalBtnCancelar: {
    flex: 1, paddingVertical: 14, borderRadius: 8,
    borderWidth: 1, borderColor: '#334155', alignItems: 'center',
  },
  modalBtnCancelarText: { color: '#64748b', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  modalBtnCrear: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 8,
    backgroundColor: '#f59e0b',
  },
  modalBtnCrearText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
