import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SelectorBomberos from '../components/SelectorBomberos';

const BASE_URL = 'http://localhost:3000';

function fechaHoy() {
  return new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase();
}

function esDeHoy(fechaISO) {
  if (!fechaISO) return false;
  const fecha = new Date(fechaISO);
  const hoy = new Date();
  return (
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear()
  );
}

function esDeAyer(fechaISO) {
  if (!fechaISO) return false;
  const fecha = new Date(fechaISO);
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return (
    fecha.getDate() === ayer.getDate() &&
    fecha.getMonth() === ayer.getMonth() &&
    fecha.getFullYear() === ayer.getFullYear()
  );
}

function getIcono(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('manguera'))                        return 'pipe';
  if (n.includes('extintor'))                        return 'fire-extinguisher';
  if (n.includes('motosierra'))                      return 'saw-blade';
  if (n.includes('hacha'))                           return 'axe';
  if (n.includes('hidrau'))                          return 'car-wrench';
  if (n.includes('casco'))                           return 'hard-hat';
  if (n.includes('era') || n.includes('autónomo'))   return 'diving-scuba-tank';
  if (n.includes('piton'))                           return 'water';
  if (n.includes('cuerda') || n.includes('soga'))    return 'rope';
  if (n.includes('escalera'))                        return 'stairs';
  return 'toolbox-outline';
}

export default function ChecklistScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const camionId    = route?.params?.camionId     || null;
  const camionNombre = route?.params?.camionNombre || 'MÓVIL';
  const token       = route?.params?.token         || '';

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const [sectores, setSectores]           = useState([]);
  const [faltantesAyer, setFaltantesAyer] = useState(new Set());
  const [estadoItems, setEstadoItems]     = useState({});
  const [observaciones, setObservaciones] = useState({});
  const [acompanantes, setAcompanantes]   = useState([]); // ← AX-13
  const [cargando, setCargando]           = useState(true);
  const [refrescando, setRefrescando]     = useState(false);
  const [guardando, setGuardando]         = useState(false);
  const [error, setError]                 = useState(null);

  async function cargarInventario() {
    if (!camionId) return;
    try {
      const res = await fetch(
        `${BASE_URL}/camiones_inventario/camion/${camionId}/agrupado`,
        { headers }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setSectores(lista);

      const estadoInicial = {};
      lista.forEach((sector) => {
        (sector.herramientas || []).forEach((h) => { estadoInicial[h.id] = null; });
      });
      setEstadoItems(estadoInicial);
    } catch (err) {
      console.error('Error cargando inventario:', err);
      throw err;
    }
  }

  async function cargarFaltantesAyer() {
    if (!camionId) return;
    try {
      const res = await fetch(`${BASE_URL}/checklist/historial/${camionId}`, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const historial = await res.json();
      if (!Array.isArray(historial) || historial.length === 0) return;

      const checklistAyer = historial.find(
        (c) => esDeAyer(c.fecha_control) || (!esDeHoy(c.fecha_control))
      );
      if (!checklistAyer || !Array.isArray(checklistAyer.detalles)) return;

      const idsConFaltante = new Set();
      checklistAyer.detalles.forEach((detalle) => {
        if (detalle.controlado === 'FALTANTE') {
          const invId = typeof detalle.inventarioId === 'object'
            ? detalle.inventarioId?.id
            : detalle.inventarioId;
          if (invId) idsConFaltante.add(invId);
        }
      });
      setFaltantesAyer(idsConFaltante);
    } catch (err) {
      console.warn('No se pudo cargar historial de faltantes:', err);
    }
  }

  const cargarTodo = useCallback(async (esRefresh = false) => {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);
    setError(null);
    try {
      await Promise.all([cargarInventario(), cargarFaltantesAyer()]);
    } catch (err) {
      setError('No se pudo conectar al servidor.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [camionId]);

  useEffect(() => { cargarTodo(); }, []);

  function marcarItem(inventarioId, nuevoEstado) {
    setEstadoItems((prev) => ({ ...prev, [inventarioId]: nuevoEstado }));
    if (nuevoEstado !== 'FALTANTE') {
      setObservaciones((prev) => { const n = { ...prev }; delete n[inventarioId]; return n; });
    }
  }

  function setObservacion(inventarioId, texto) {
    setObservaciones((prev) => ({ ...prev, [inventarioId]: texto }));
  }

  async function guardarChecklist() {
    const sinMarcar = Object.entries(estadoItems).filter(([, v]) => v === null);
    if (sinMarcar.length > 0) {
      Alert.alert('Items sin marcar', `Hay ${sinMarcar.length} herramienta(s) sin chequear.`);
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

      const body = {
        camionId,
        detalles,
        // AX-13: IDs de los acompañantes seleccionados en el selector
        acompanantesIds: acompanantes.map(b => b.usuario_id),
      };

      const res = await fetch(`${BASE_URL}/checklist/guardar`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      Alert.alert('✅ Guardado', 'El checklist diario fue guardado correctamente.', [
        { text: 'OK', onPress: () => navigation?.goBack() },
      ]);
    } catch (err) {
      console.error('Error guardando checklist:', err);
      Alert.alert('Error', 'No se pudo guardar el checklist. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  const totalItems = Object.keys(estadoItems).length;
  const marcados   = Object.values(estadoItems).filter((v) => v !== null).length;
  const progreso   = totalItems > 0 ? marcados / totalItems : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />

      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>CHECKLIST DIARIO</Text>
        </View>
        <View style={styles.avatarPlaceholder}>
          <MaterialCommunityIcons name="clipboard-check" size={20} color="#fff" />
        </View>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => cargarTodo(true)}
              tintColor="#dc2626"
              colors={['#dc2626']}
            />
          }
        >
          {/* Header */}
          <View style={styles.headerTitleBox}>
            <Text style={styles.mainTitle}>
              <Text style={{ color: '#fff' }}>{camionNombre.toUpperCase()} — </Text>
              <Text style={{ color: '#dc2626' }}>CHECKLIST</Text>
            </Text>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar-month" size={12} color="#94a3b8" />
              <Text style={styles.dateText}>{fechaHoy()}</Text>
            </View>

            {totalItems > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progreso * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{marcados}/{totalItems} chequeados</Text>
              </View>
            )}

            {faltantesAyer.size > 0 && (
              <View style={styles.alertaAyer}>
                <MaterialCommunityIcons name="alert" size={16} color="#f59e0b" />
                <Text style={styles.alertaAyerText}>
                  {faltantesAyer.size} ítem(s) marcado(s) como FALTANTE en el último control. Aparecen resaltados abajo.
                </Text>
              </View>
            )}
          </View>

          {cargando && (
            <View style={styles.centrado}>
              <ActivityIndicator size="large" color="#dc2626" />
              <Text style={styles.textoEstado}>Cargando inventario...</Text>
            </View>
          )}

          {!cargando && error && (
            <View style={styles.centrado}>
              <MaterialCommunityIcons name="wifi-off" size={44} color="#334155" />
              <Text style={styles.textoEstado}>{error}</Text>
              <TouchableOpacity style={styles.botonReintentar} onPress={() => cargarTodo()}>
                <Text style={styles.textoReintentar}>REINTENTAR</Text>
              </TouchableOpacity>
            </View>
          )}

          {!cargando && !error && !camionId && (
            <View style={styles.centrado}>
              <MaterialCommunityIcons name="truck-alert" size={44} color="#334155" />
              <Text style={styles.textoEstado}>No se especificó un camión.</Text>
            </View>
          )}

          {/* Sectores con herramientas */}
          {!cargando && !error && camionId && sectores.map((sector) => (
            <View key={sector.nombre_sector}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="archive-outline" size={14} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>
                  {sector.nombre_sector?.toUpperCase() || 'SIN SECTOR'}
                </Text>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionCount}>{(sector.herramientas || []).length}</Text>
              </View>

              {(sector.herramientas || []).map((item) => {
                const estado         = estadoItems[item.id] || null;
                const esFaltanteAyer = faltantesAyer.has(item.id);
                const esChequeado    = estado === 'CHEQUEADO';
                const esFaltante     = estado === 'FALTANTE';

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.cardItem,
                      esChequeado && styles.cardItemOk,
                      esFaltante  && styles.cardItemFail,
                      esFaltanteAyer && !esChequeado && !esFaltante && styles.cardItemAyer,
                    ]}
                  >
                    <View style={styles.cardItemLeft}>
                      <View style={styles.itemIconRow}>
                        <MaterialCommunityIcons
                          name={getIcono(item.herramienta)}
                          size={16}
                          color={
                            esFaltante      ? '#fca5a5'
                            : esChequeado   ? '#86efac'
                            : esFaltanteAyer ? '#fcd34d'
                            : '#64748b'
                          }
                          style={{ marginRight: 8 }}
                        />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.itemTitle} numberOfLines={1}>
                              {item.herramienta?.toUpperCase() || 'HERRAMIENTA'}
                            </Text>
                            {esFaltanteAyer && !esChequeado && !esFaltante && (
                              <View style={styles.badgeFaltanteAyer}>
                                <MaterialCommunityIcons name="alert-outline" size={9} color="#92400e" />
                                <Text style={styles.badgeFaltanteAyerText}>FALTANTE AYER</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.itemSubtitle}>Cantidad: {item.cantidad_herramienta}</Text>
                        </View>
                      </View>

                      {esFaltante && (
                        <View style={styles.observacionContainer}>
                          <MaterialCommunityIcons name="pencil-outline" size={12} color="#f87171" />
                          <Text style={styles.observacionInput}>
                            {observaciones[item.id] || 'Tocá para agregar observación...'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.iconButton, esChequeado && styles.iconButtonOk]}
                        onPress={() => marcarItem(item.id, esChequeado ? null : 'CHEQUEADO')}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="check" size={18} color={esChequeado ? '#fff' : '#e2e8f0'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconButton, esFaltante && styles.iconButtonFail]}
                        onPress={() => {
                          marcarItem(item.id, esFaltante ? null : 'FALTANTE');
                          if (!esFaltante) {
                            Alert.prompt(
                              'Observación requerida',
                              `¿Por qué falta "${item.herramienta}"?`,
                              (texto) => setObservacion(item.id, texto),
                              'plain-text'
                            );
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="close" size={18} color={esFaltante ? '#fff' : '#e2e8f0'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          {!cargando && !error && camionId && sectores.length === 0 && (
            <View style={styles.centrado}>
              <MaterialCommunityIcons name="archive-off-outline" size={44} color="#334155" />
              <Text style={styles.textoEstado}>Este camión no tiene inventario cargado.</Text>
            </View>
          )}

          {/* ── AX-13: Selector de acompañantes ── */}
          {!cargando && !error && totalItems > 0 && (
            <SelectorBomberos
              token={token}
              seleccionados={acompanantes}
              onChange={setAcompanantes}
            />
          )}

          {/* Botón guardar */}
          {!cargando && !error && totalItems > 0 && (
            <TouchableOpacity
              style={[styles.saveButton, guardando && { opacity: 0.6 }]}
              onPress={guardarChecklist}
              disabled={guardando}
              activeOpacity={0.8}
            >
              {guardando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save-check" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>GUARDAR CHECKLIST</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#16181d' },
  topBar:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#1a1c23', borderBottomWidth: 1, borderBottomColor: '#26282f' },
  topBarLeft:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  topBarTitle:       { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  scrollContent:     { padding: 24 },
  headerTitleBox:    { marginBottom: 32 },
  mainTitle:         { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
  dateRow:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  dateText:          { color: '#94a3b8', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  progressBar:       { flex: 1, height: 4, backgroundColor: '#26282f', borderRadius: 2, overflow: 'hidden' },
  progressFill:      { height: '100%', backgroundColor: '#22c55e', borderRadius: 2 },
  progressText:      { color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, minWidth: 90, textAlign: 'right' },
  alertaAyer:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#451a03', borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: '#f59e0b' },
  alertaAyerText:    { color: '#fcd34d', fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 16 },
  sectionHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 24 },
  sectionTitle:      { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  sectionLine:       { flex: 1, height: 1, backgroundColor: '#26282f', marginLeft: 10, marginRight: 6 },
  sectionCount:      { color: '#475569', fontSize: 10, fontWeight: '700', backgroundColor: '#1e293b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardItem:          { backgroundColor: '#1b1d24', borderRadius: 4, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#334155' },
  cardItemOk:        { borderLeftColor: '#22c55e' },
  cardItemFail:      { borderLeftColor: '#dc2626', backgroundColor: '#1f1315' },
  cardItemAyer:      { borderLeftColor: '#f59e0b', backgroundColor: '#1c1a12' },
  cardItemLeft:      { flex: 1, paddingRight: 8 },
  itemIconRow:       { flexDirection: 'row', alignItems: 'flex-start' },
  itemTitle:         { color: '#e2e8f0', fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginBottom: 3 },
  itemSubtitle:      { color: '#475569', fontSize: 10, fontWeight: '600' },
  badgeFaltanteAyer: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#78350f', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  badgeFaltanteAyerText: { color: '#fcd34d', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  observacionContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#2d1515', borderRadius: 4, padding: 8 },
  observacionInput:  { color: '#f87171', fontSize: 10, fontWeight: '600', fontStyle: 'italic', flex: 1 },
  actionButtons:     { flexDirection: 'row', gap: 8 },
  iconButton:        { width: 36, height: 36, borderRadius: 4, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  iconButtonOk:      { backgroundColor: '#166534' },
  iconButtonFail:    { backgroundColor: '#dc2626' },
  saveButton:        { backgroundColor: '#dc2626', borderRadius: 4, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 12 },
  saveButtonText:    { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  centrado:          { alignItems: 'center', paddingVertical: 48, gap: 10 },
  textoEstado:       { color: '#475569', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  botonReintentar:   { marginTop: 8, backgroundColor: '#dc2626', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
  textoReintentar:   { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
});