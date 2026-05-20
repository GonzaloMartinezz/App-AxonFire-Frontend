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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BASE_URL = 'http://localhost:3000';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getIconoBolso(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('trauma') || n.includes('medic') || n.includes('primero')) return 'medical-bag';
  if (n.includes('cuerda') || n.includes('soga') || n.includes('rescate'))   return 'rope';
  if (n.includes('incendio') || n.includes('fuego'))                          return 'fire-extinguisher';
  if (n.includes('herramienta') || n.includes('kit'))                         return 'toolbox-outline';
  return 'bag-personal-outline';
}

function getIconoHerramienta(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('extintor'))                         return 'fire-extinguisher';
  if (n.includes('venda') || n.includes('gasa'))      return 'bandage';
  if (n.includes('tijera'))                           return 'content-cut';
  if (n.includes('guante'))                           return 'hand-back-left-outline';
  if (n.includes('linterna') || n.includes('luz'))    return 'flashlight';
  if (n.includes('cuerda') || n.includes('soga'))     return 'rope';
  if (n.includes('mascarilla') || n.includes('oxig')) return 'air-filter';
  if (n.includes('camilla'))                          return 'bed-outline';
  if (n.includes('hacha'))                            return 'axe';
  return 'package-variant-closed';
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ChecklistBolsosScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const token      = route?.params?.token      || '';
  // Si viene con un bolsoId fijo (desde el disparador de emergencia), lo usamos
  const bolsoIdParam = route?.params?.bolsoId  || null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // ── Estado ──────────────────────────────────────────────────────────────────

  // Lista de bolsos disponibles (para el selector)
  const [bolsos, setBolsos]           = useState([]);
  const [bolsoActivo, setBolsoActivo] = useState(null); // bolso seleccionado

  // Herramientas del bolso activo
  const [herramientas, setHerramientas] = useState([]);

  // { [inventarioId]: 'CHEQUEADO' | 'FALTANTE' | null }
  const [estadoItems, setEstadoItems]   = useState({});

  // { [inventarioId]: string } — observaciones para FALTANTE
  const [observaciones, setObservaciones] = useState({});

  const [cargandoBolsos, setCargandoBolsos]         = useState(true);
  const [cargandoInventario, setCargandoInventario] = useState(false);
  const [refrescando, setRefrescando]               = useState(false);
  const [guardando, setGuardando]                   = useState(false);
  const [error, setError]                           = useState(null);

  // ── Carga de bolsos ──────────────────────────────────────────────────────────

  async function cargarBolsos() {
    setCargandoBolsos(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/bolsos/`, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data.filter(b => b.estado === 'ACTIVO') : [];
      setBolsos(lista);

      // Si vino un bolsoId por params, lo seleccionamos directamente
      if (bolsoIdParam) {
        const encontrado = lista.find(b => b.id === bolsoIdParam);
        if (encontrado) seleccionarBolso(encontrado, lista);
      }
    } catch (err) {
      console.error('Error cargando bolsos:', err);
      setError('No se pudieron cargar los bolsos.');
    } finally {
      setCargandoBolsos(false);
    }
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
        `${BASE_URL}/bolsos_inventario/bolso/${bolso.id}`,
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

      const res = await fetch(`${BASE_URL}/checklist_bolsos/bolsos/guardar`, {
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
        [{ text: 'OK', onPress: () => {
          // Reseteamos para poder hacer otro bolso
          setBolsoActivo(null);
          setHerramientas([]);
          setEstadoItems({});
          setObservaciones({});
        }}]
      );
    } catch (err) {
      console.error('Error guardando checklist de bolso:', err);
      Alert.alert('Error', 'No se pudo guardar. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  // ── Progreso ──────────────────────────────────────────────────────────────────

  const total    = Object.keys(estadoItems).length;
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
          </View>
        </View>
        {bolsoActivo && (
          <TouchableOpacity style={styles.iconBtn} onPress={() => setBolsoActivo(null)}>
            <MaterialCommunityIcons name="swap-horizontal" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar}
            tintColor="#dc2626" colors={['#dc2626']} />
        }
      >
        {/* ── PASO 1: Selector de bolso ─────────────────────────────────── */}
        {!bolsoActivo && (
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

            {!cargandoBolsos && !error && bolsos.length === 0 && (
              <View style={styles.centrado}>
                <MaterialCommunityIcons name="bag-remove-outline" size={44} color="#334155" />
                <Text style={styles.textoEstado}>No hay bolsos activos registrados.</Text>
              </View>
            )}

            {/* Grid de bolsos */}
            <View style={styles.gridBolsos}>
              {bolsos.map(bolso => (
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
                    { width: `${progreso * 100}%`,
                      backgroundColor: faltantes > 0 ? '#f59e0b' : '#22c55e' }
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
              const estado   = estadoItems[item.id] || null;
              const esChequeado = estado === 'CHEQUEADO';
              const esFaltante  = estado === 'FALTANTE';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.cardItem,
                    esChequeado && styles.cardOk,
                    esFaltante  && styles.cardFail,
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
  cardOk:   { borderLeftColor: '#22c55e' },
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
});