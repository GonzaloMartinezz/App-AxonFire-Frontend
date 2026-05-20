import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DamageReportField, { isDamageReportComplete } from '../components/DamageReportField';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

// ── Helpers ────────────────────────────────────────────────────────────────

function daysSinceDate(dateStr) {
  if (!dateStr) return Infinity;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Map tool names to icons for a nicer UI
function getToolIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('extintor')) return 'fire-extinguisher';
  if (n.includes('manguera')) return 'pipe';
  if (n.includes('hacha')) return 'axe';
  if (n.includes('radio') || n.includes('comunicaci')) return 'radio-handheld';
  if (n.includes('casco')) return 'hard-hat';
  if (n.includes('motosierra')) return 'chainsaw';
  if (n.includes('era') || n.includes('respirat') || n.includes('scba')) return 'diving-scuba-tank';
  if (n.includes('escalera')) return 'stairs';
  if (n.includes('soga') || n.includes('cuerda')) return 'jump-rope';
  if (n.includes('linterna') || n.includes('luz')) return 'flashlight';
  if (n.includes('pala')) return 'shovel';
  if (n.includes('piton') || n.includes('pitón')) return 'water-pump';
  return 'tools'; // default fallback
}

function getMockTools() {
  return [
    { id: 't1', nombre_herramienta: 'EXTINTOR ABC 10KG', cantidad_disponible: 1 },
    { id: 't2', nombre_herramienta: 'MANGUERA DE COMUNICACIÓN 2.5"', cantidad_disponible: 1 },
    { id: 't3', nombre_herramienta: 'HACHA TÁCTICA', cantidad_disponible: 1 },
    { id: 't4', nombre_herramienta: 'RADIO HANDHELD VHF', cantidad_disponible: 1 },
    { id: 't5', nombre_herramienta: 'CASCO DE PROTECCIÓN F1', cantidad_disponible: 1 },
    { id: 'fixed_radio', nombre_herramienta: 'RADIO DE REPUESTO', cantidad_disponible: 5 },
    { id: 'fixed_motosierra', nombre_herramienta: 'MOTOSIERRA DE CUARTEL', cantidad_disponible: 2 }
  ];
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WeeklyChecklistScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const userId = user?.id || '';

  // Tabs: 'inventario' (Control de equipos) | 'mantenimiento' (Checklist semanal)
  const [activeTab, setActiveTab] = useState('inventario');

  // State for Inventory Tab
  const [herramientas, setHerramientas] = useState([]);
  const [inventoryItems, setInventoryItems] = useState({}); // { [id]: { status, justification } }
  const [submittingInventory, setSubmittingInventory] = useState(false);

  // State for Maintenance Tab
  const [maintenance, setMaintenance] = useState({
    encendido: null, // 'ok' | 'fail'
    combustible: null, // 'ok' | 'fail'
    aceite: null, // 'ok' | 'fail'
    encendidoJustification: '',
    combustibleJustification: '',
    aceiteJustification: '',
  });
  const [blocked, setBlocked] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [lastCheckDate, setLastCheckDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingMaint, setSubmittingMaint] = useState(false);

  // ── Load data on mount ──────────────────────────────────────────────────

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // 1. Fetch tools (ensuring base items like radios and chainsaw are loaded)
      let tools = [];
      try {
        const toolsRes = await fetch(`${API_BASE_URL}/herramientas/`, { headers });
        if (toolsRes.ok) {
          const data = await toolsRes.json();
          tools = Array.isArray(data) ? data : [];
        }
      } catch (err) {
        console.log('Error loading tools from server, using local fallback:', err);
      }

      if (tools.length === 0) {
        tools = getMockTools();
      } else {
        const hasRadio = tools.some(t => t.nombre_herramienta?.toUpperCase().includes('RADIO DE REPUESTO'));
        const hasMotosierra = tools.some(t => t.nombre_herramienta?.toUpperCase().includes('MOTOSIERRA DE CUARTEL'));
        
        if (!hasRadio) {
          tools.push({ id: 'fixed_radio', nombre_herramienta: 'RADIO DE REPUESTO', cantidad_disponible: 5 });
        }
        if (!hasMotosierra) {
          tools.push({ id: 'fixed_motosierra', nombre_herramienta: 'MOTOSIERRA DE CUARTEL', cantidad_disponible: 2 });
        }
      }
      setHerramientas(tools);

      // Initialize inventory status mapping
      const initialInv = {};
      tools.forEach(tool => {
        initialInv[tool.id] = { status: null, justification: '' };
      });
      setInventoryItems(initialInv);

      // 2. Check 7-day lockout for Maintenance Tab
      let mHist = [];
      try {
        const localMHist = await AsyncStorage.getItem('weekly_maintenance_history');
        if (localMHist) {
          mHist = JSON.parse(localMHist);
        }
      } catch (e) {
        console.log('Error reading maintenance history:', e);
      }

      mHist.sort((a, b) => new Date(b.fecha_control) - new Date(a.fecha_control));

      if (mHist.length > 0) {
        const lastDate = mHist[0].fecha_control;
        const days = daysSinceDate(lastDate);
        setLastCheckDate(lastDate);
        if (days < 7) {
          setBlocked(true);
          setDaysRemaining(7 - days);
        } else {
          setBlocked(false);
          setDaysRemaining(0);
        }
      } else {
        setBlocked(false);
        setDaysRemaining(0);
      }
    } catch (err) {
      console.warn('Error loading checklist data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Inventory Tab State Update ───────────────────────────────────────────

  const setInventoryStatus = useCallback((id, status) => {
    setInventoryItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status,
        ...(status === 'ok' ? { justification: '' } : {}),
      },
    }));
  }, []);

  const updateInventoryJustification = useCallback((id, text) => {
    setInventoryItems(prev => ({
      ...prev,
      [id]: { ...prev[id], justification: text },
    }));
  }, []);

  // ── Inventory Submit Validation ──────────────────────────────────────────

  const allInvChecked = Object.keys(inventoryItems).length > 0 && Object.values(inventoryItems).every(i => i.status !== null);
  const allInvJustified = Object.values(inventoryItems).every(i => {
    if (i.status !== 'fail') return true;
    return isDamageReportComplete(i.justification);
  });
  const canSubmitInventory = allInvChecked && allInvJustified && !submittingInventory;

  const handleSubmitInventory = async () => {
    if (!canSubmitInventory) return;
    setSubmittingInventory(true);
    try {
      const detalles = Object.entries(inventoryItems).map(([herramientaId, data]) => ({
        herramientaId,
        controlado: data.status === 'ok' ? 'CHEQUEADO' : 'FALTANTE',
        ...(data.status === 'fail' && data.justification ? { observaciones: data.justification } : {}),
      }));

      // API Post attempt
      try {
        await fetch(`${API_BASE_URL}/checklist_cuartel/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            usuarioId: userId,
            detalles,
          }),
        });
      } catch (err) {
        console.log('Error posting to backend, using local persistence:', err);
      }

      // Save locally to history
      const localHist = await AsyncStorage.getItem('weekly_checklist_history');
      const history = localHist ? JSON.parse(localHist) : [];
      history.push({
        fecha_control: new Date().toISOString(),
        usuarioId: userId,
        detalles,
      });
      await AsyncStorage.setItem('weekly_checklist_history', JSON.stringify(history));

      if (Platform.OS === 'web') {
        alert('Inventario de base guardado correctamente.');
        navigation?.goBack();
      } else {
        Alert.alert('Éxito', 'Inventario de base guardado correctamente.', [{ text: 'Aceptar', onPress: () => navigation?.goBack() }]);
      }
    } catch (err) {
      console.error('Error saving inventory:', err);
    } finally {
      setSubmittingInventory(false);
    }
  };

  // ── Maintenance Tab Actions & Submit ─────────────────────────────────────

  const setMaintField = (field, val) => {
    setMaintenance(prev => ({
      ...prev,
      [field]: val,
      ...(val === 'ok' ? { [`${field}Justification`]: '' } : {}),
    }));
  };

  const setMaintJustification = (field, text) => {
    setMaintenance(prev => ({
      ...prev,
      [`${field}Justification`]: text,
    }));
  };

  const allMaintChecked = maintenance.encendido !== null && maintenance.combustible !== null && maintenance.aceite !== null;
  const allMaintJustified =
    (maintenance.encendido !== 'fail' || isDamageReportComplete(maintenance.encendidoJustification)) &&
    (maintenance.combustible !== 'fail' || isDamageReportComplete(maintenance.combustibleJustification)) &&
    (maintenance.aceite !== 'fail' || isDamageReportComplete(maintenance.aceiteJustification));

  const canSubmitMaint = allMaintChecked && allMaintJustified && !blocked && !submittingMaint;

  const handleSubmitMaintenance = async () => {
    if (!canSubmitMaint) return;
    setSubmittingMaint(true);
    try {
      const payload = {
        fecha_control: new Date().toISOString(),
        usuarioId: userId,
        encendido: maintenance.encendido,
        encendidoJustification: maintenance.encendidoJustification,
        combustible: maintenance.combustible,
        combustibleJustification: maintenance.combustibleJustification,
        aceite: maintenance.aceite,
        aceiteJustification: maintenance.aceiteJustification,
      };

      // Mock API call simulation or post to server
      try {
        await fetch(`${API_BASE_URL}/checklist_mantenimiento/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.log('Mantenimiento endpoint not implemented on backend, using local fallback:', err);
      }

      // Persist to local maintenance checklist history
      const localHist = await AsyncStorage.getItem('weekly_maintenance_history');
      const history = localHist ? JSON.parse(localHist) : [];
      history.push(payload);
      await AsyncStorage.setItem('weekly_maintenance_history', JSON.stringify(history));

      // Lockout state update
      setBlocked(true);
      setDaysRemaining(7);
      setLastCheckDate(payload.fecha_control);

      if (Platform.OS === 'web') {
        alert('Checklist semanal de mantenimiento registrado correctamente.');
        navigation?.goBack();
      } else {
        Alert.alert('Éxito', 'Checklist semanal de mantenimiento registrado correctamente.', [{ text: 'Aceptar', onPress: () => navigation?.goBack() }]);
      }
    } catch (err) {
      console.error('Error saving maintenance checklist:', err);
    } finally {
      setSubmittingMaint(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" backgroundColor="#1a1c23" />
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ color: '#94a3b8', marginTop: 12, fontWeight: '600' }}>Cargando datos del cuartel...</Text>
      </View>
    );
  }

  const totalInvItems = Object.keys(inventoryItems).length;
  const checkedInvItems = Object.values(inventoryItems).filter(i => i.status !== null).length;
  const progressPercent = totalInvItems > 0 ? Math.round((checkedInvItems / totalInvItems) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>TACTICAL VANGUARD</Text>
        </View>
        <View style={styles.avatarPlaceholder}>
          <MaterialCommunityIcons name="warehouse" size={20} color="#fff" />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: (insets.bottom || 0) + 120 }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerTitleBox}>
          <Text style={styles.mainTitle}>
            <Text style={{ color: '#fff' }}>CUARTEL — </Text>
            <Text style={{ color: '#f97316' }}>GESTIÓN GENERAL</Text>
          </Text>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-month" size={12} color="#94a3b8" />
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
            </Text>
            <Text style={styles.dateDot}>•</Text>
            <MaterialCommunityIcons name="shield-check" size={12} color="#94a3b8" />
            <Text style={styles.dateText}>CONTROL GENERAL DE ACTIVOS</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, activeTab === 'inventario' && styles.tabActive]} onPress={() => setActiveTab('inventario')}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={16} color={activeTab === 'inventario' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'inventario' && styles.tabTextActive]}>INVENTARIO BASE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'mantenimiento' && styles.tabActive]} onPress={() => setActiveTab('mantenimiento')}>
            <MaterialCommunityIcons name="wrench-clock" size={16} color={activeTab === 'mantenimiento' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'mantenimiento' && styles.tabTextActive]}>MANTENIMIENTO</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'inventario' ? (
          <>
            {/* Inventory Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>PROGRESO DE INVENTARIO</Text>
                <Text style={styles.progressValue}>{checkedInvItems}/{totalInvItems} ({progressPercent}%)</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            {/* Tools List */}
            {herramientas.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="package-variant" size={48} color="#334155" />
                <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>
                  No hay herramientas registradas en el cuartel.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="package-variant-closed" size={18} color="#f97316" />
                  <Text style={styles.sectionTitle}>EQUIPOS E INVENTARIO DE LA BASE</Text>
                  <View style={styles.sectionLine} />
                </View>

                {herramientas.map((tool) => {
                  const data = inventoryItems[tool.id] || { status: null, justification: '' };
                  const iconName = getToolIcon(tool.nombre_herramienta);
                  return (
                    <View key={tool.id}>
                      <View style={[
                        styles.cardItem,
                        data.status === 'ok' && { borderLeftColor: '#22c55e' },
                        data.status === 'fail' && { borderLeftColor: '#dc2626' },
                      ]}>
                        <View style={styles.cardItemLeft}>
                          <View style={styles.toolRow}>
                            <View style={styles.toolIconCircle}>
                              <MaterialCommunityIcons name={iconName} size={16} color="#93c5fd" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.itemTitle}>{(tool.nombre_herramienta || '').toUpperCase()}</Text>
                              <Text style={styles.itemSubtitle}>Stock disponible: {tool.cantidad_disponible ?? 0} uds</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.iconButton, data.status === 'ok' && styles.iconButtonActive]}
                            onPress={() => setInventoryStatus(tool.id, 'ok')}
                          >
                            <MaterialCommunityIcons name="check" size={18} color={data.status === 'ok' ? '#fff' : '#e2e8f0'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, data.status === 'fail' && styles.iconButtonFail]}
                            onPress={() => setInventoryStatus(tool.id, 'fail')}
                          >
                            <MaterialCommunityIcons name="close" size={18} color={data.status === 'fail' ? '#fff' : '#e2e8f0'} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Damage report field (mandatory justification) */}
                      <DamageReportField
                        visible={data.status === 'fail'}
                        justification={data.justification}
                        onJustificationChange={(text) => updateInventoryJustification(tool.id, text)}
                        theme="dark"
                      />
                    </View>
                  );
                })}
              </>
            )}

            {/* Validation warning */}
            {!canSubmitInventory && checkedInvItems > 0 && !allInvJustified && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
                <MaterialCommunityIcons name="alert-circle" size={14} color="#fca5a5" />
                <Text style={{ color: '#fca5a5', fontSize: 11, fontWeight: '700' }}>
                  Completar justificación de los ítems marcados como Falta/Roto para poder guardar.
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.saveButton, !canSubmitInventory && styles.saveButtonDisabled]}
              onPress={handleSubmitInventory}
              disabled={!canSubmitInventory}
              activeOpacity={0.7}
            >
              {submittingInventory ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>GUARDAR INVENTARIO BASE</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Maintenance lockout state */}
            {blocked ? (
              <View style={styles.blockedBanner}>
                <View style={styles.blockedIconRow}>
                  <MaterialCommunityIcons name="lock-clock" size={22} color="#fbbf24" />
                  <Text style={styles.blockedTitle}>CONTROL NO DISPONIBLE</Text>
                </View>
                <Text style={styles.blockedText}>
                  El último control semanal de mantenimiento fue registrado el {lastCheckDate ? new Date(lastCheckDate).toLocaleDateString('es-AR') : '—'}.
                  {'\n'}Faltan <Text style={{ color: '#fbbf24', fontWeight: '900' }}>{daysRemaining} días</Text> para habilitar el próximo checklist.
                </Text>
              </View>
            ) : (
              <View style={[styles.blockedBanner, { borderColor: '#15803d', backgroundColor: '#14532d20' }]}>
                <View style={styles.blockedIconRow}>
                  <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={22} color="#22c55e" />
                  <Text style={[styles.blockedTitle, { color: '#22c55e' }]}>CONTROL DISPONIBLE</Text>
                </View>
                <Text style={[styles.blockedText, { color: '#a7f3d0' }]}>
                  Por favor, complete las comprobaciones semanales del equipamiento crítico.
                </Text>
              </View>
            )}

            {/* Maintenance Form Parameters */}
            <View style={{ marginTop: 8 }}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="hydraulic-blade" size={18} color="#f97316" />
                <Text style={styles.sectionTitle}>PARÁMETROS DE MANTENIMIENTO</Text>
                <View style={styles.sectionLine} />
              </View>

              {/* 1. Encendido exitoso */}
              <View style={[
                styles.cardItem,
                maintenance.encendido === 'ok' && { borderLeftColor: '#22c55e' },
                maintenance.encendido === 'fail' && { borderLeftColor: '#dc2626' },
              ]}>
                <View style={styles.cardItemLeft}>
                  <View style={styles.toolRow}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#3b0764' }]}>
                      <MaterialCommunityIcons name="power" size={16} color="#d8b4fe" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>ENCENDIDO EXITOSO</Text>
                      <Text style={styles.itemSubtitle}>Prueba de arranque de motosierras y motobombas</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.encendido === 'ok' && styles.iconButtonActive]}
                    onPress={() => !blocked && setMaintField('encendido', 'ok')}
                    disabled={blocked}
                  >
                    <Text style={[styles.btnText, maintenance.encendido === 'ok' && styles.btnTextActive]}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.encendido === 'fail' && styles.iconButtonFail, { width: 70 }]}
                    onPress={() => !blocked && setMaintField('encendido', 'fail')}
                    disabled={blocked}
                  >
                    <Text style={[styles.btnText, maintenance.encendido === 'fail' && styles.btnTextActive]}>Fallo</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <DamageReportField
                visible={maintenance.encendido === 'fail'}
                justification={maintenance.encendidoJustification}
                onJustificationChange={(text) => setMaintJustification('encendido', text)}
                theme="dark"
              />

              {/* 2. Nivel de combustible */}
              <View style={[
                styles.cardItem,
                maintenance.combustible === 'ok' && { borderLeftColor: '#22c55e' },
                maintenance.combustible === 'fail' && { borderLeftColor: '#dc2626' },
              ]}>
                <View style={styles.cardItemLeft}>
                  <View style={styles.toolRow}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#1c1917' }]}>
                      <MaterialCommunityIcons name="gas-station" size={16} color="#fca5a5" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>NIVEL DE COMBUSTIBLE</Text>
                      <Text style={styles.itemSubtitle}>Tanques de reserva y equipos auxiliares llenos</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.combustible === 'ok' && styles.iconButtonActive]}
                    onPress={() => !blocked && setMaintField('combustible', 'ok')}
                    disabled={blocked}
                  >
                    <Text style={[styles.btnText, maintenance.combustible === 'ok' && styles.btnTextActive]}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.combustible === 'fail' && styles.iconButtonFail, { width: 70 }]}
                    onPress={() => !blocked && setMaintField('combustible', 'fail')}
                    disabled={blocked}
                  >
                    <Text style={[styles.btnText, maintenance.combustible === 'fail' && styles.btnTextActive]}>Bajo</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <DamageReportField
                visible={maintenance.combustible === 'fail'}
                justification={maintenance.combustibleJustification}
                onJustificationChange={(text) => setMaintJustification('combustible', text)}
                theme="dark"
              />

              {/* 3. Nivel de aceite */}
              <View style={[
                styles.cardItem,
                maintenance.aceite === 'ok' && { borderLeftColor: '#22c55e' },
                maintenance.aceite === 'fail' && { borderLeftColor: '#dc2626' },
              ]}>
                <View style={styles.cardItemLeft}>
                  <View style={styles.toolRow}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#064e3b' }]}>
                      <MaterialCommunityIcons name="oil" size={16} color="#6ee7b7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>NIVEL DE ACEITE</Text>
                      <Text style={styles.itemSubtitle}>Lubricación en límites operativos óptimos</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.aceite === 'ok' && styles.iconButtonActive]}
                    onPress={() => !blocked && setMaintField('aceite', 'ok')}
                    disabled={blocked}
                  >
                    <Text style={[styles.btnText, maintenance.aceite === 'ok' && styles.btnTextActive]}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.aceite === 'fail' && styles.iconButtonFail, { width: 70 }]}
                    onPress={() => !blocked && setMaintField('aceite', 'fail')}
                    disabled={blocked}
                  >
                    <Text style={[styles.btnText, maintenance.aceite === 'fail' && styles.btnTextActive]}>Bajo</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <DamageReportField
                visible={maintenance.aceite === 'fail'}
                justification={maintenance.aceiteJustification}
                onJustificationChange={(text) => setMaintJustification('aceite', text)}
                theme="dark"
              />
            </View>

            {/* Validation warning */}
            {!canSubmitMaint && allMaintChecked && !allMaintJustified && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
                <MaterialCommunityIcons name="alert-circle" size={14} color="#fca5a5" />
                <Text style={{ color: '#fca5a5', fontSize: 11, fontWeight: '700' }}>
                  Completar justificación de los parámetros con fallos/bajos para poder guardar.
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.saveButton, !canSubmitMaint && styles.saveButtonDisabled]}
              onPress={handleSubmitMaintenance}
              disabled={!canSubmitMaint}
              activeOpacity={0.7}
            >
              {submittingMaint ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {blocked ? 'BLOQUEADO — ESPERAR 7 DÍAS' : 'GUARDAR CHECKLIST MANTENIMIENTO'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181d',
    ...Platform.select({
      web: {
        height: '100vh',
        overflow: 'hidden',
      },
      default: {
        height: '100%',
        overflow: 'visible',
      },
    }),
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        height: 'calc(100vh - 80px)',
        overflowY: 'auto',
      },
      default: {
        height: '100%',
      },
    }),
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
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  headerTitleBox: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dateDot: {
    color: '#94a3b8',
    fontSize: 10,
  },

  // Tabs Row
  tabRow: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#1b1d24',
    borderRadius: 6,
    padding: 4,
    borderWidth: 1,
    borderColor: '#26282f',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 4,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#f97316',
  },
  tabText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#fff',
  },

  // Blocked banner
  blockedBanner: {
    backgroundColor: '#1b1d24',
    borderRadius: 6,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#854d0e',
  },
  blockedIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  blockedTitle: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  blockedText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 20,
  },

  // Progress
  progressContainer: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressValue: {
    color: '#f97316',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#26282f',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 2,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    gap: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#26282f',
    marginLeft: 8,
  },

  // Card items
  cardItem: {
    backgroundColor: '#1b1d24',
    borderRadius: 4,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#334155',
  },
  cardItemLeft: {
    flex: 1,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  itemSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#22c55e',
  },
  iconButtonFail: {
    backgroundColor: '#dc2626',
  },
  btnText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  btnTextActive: {
    color: '#fff',
  },

  // Save button
  saveButton: {
    backgroundColor: '#f97316',
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
