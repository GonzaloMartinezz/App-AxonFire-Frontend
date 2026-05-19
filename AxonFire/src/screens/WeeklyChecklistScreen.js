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
  return 'package-variant-closed';
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WeeklyChecklistScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token || '';
  const userId = user?.id || '';

  // State
  const [herramientas, setHerramientas] = useState([]); // tools from backend
  const [items, setItems] = useState({}); // { [herramientaId]: { status, justification, photoUri } }
  const [blocked, setBlocked] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [lastCheckDate, setLastCheckDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

      // 1. Fetch all tools from the master stock
      const toolsRes = await fetch(`${API_BASE_URL}/herramientas/`, { headers });
      let tools = [];
      if (toolsRes.ok) {
        const data = await toolsRes.json();
        tools = Array.isArray(data) ? data : [];
      }
      setHerramientas(tools);

      // Initialize items state for each tool
      const initialItems = {};
      tools.forEach(tool => {
        initialItems[tool.id] = { status: null, justification: '', photoUri: null };
      });
      setItems(initialItems);

      // 2. Check 7-day lockout via cuartel checklist history
      const histRes = await fetch(`${API_BASE_URL}/checklist_cuartel/`, { headers });
      if (histRes.ok) {
        const history = await histRes.json();
        if (Array.isArray(history) && history.length > 0) {
          // History is sorted descending by fecha_control
          const lastDate = history[0].fecha_control;
          const days = daysSinceDate(lastDate);
          setLastCheckDate(lastDate);
          if (days < 7) {
            setBlocked(true);
            setDaysRemaining(7 - days);
          }
        }
      }
    } catch (err) {
      console.warn('Error loading checklist data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Item state management ──────────────────────────────────────────────

  const updateItem = useCallback((id, field, value) => {
    setItems(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }, []);

  const setItemStatus = useCallback((id, status) => {
    setItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status,
        // Reset damage fields if switching back to OK
        ...(status === 'ok' ? { justification: '', photoUri: null } : {}),
      },
    }));
  }, []);

  // ── Submit validation ──────────────────────────────────────────────────

  const allItemsChecked = Object.keys(items).length > 0 && Object.values(items).every(i => i.status !== null);
  const allDamageReportsComplete = Object.values(items).every(i => {
    if (i.status !== 'fail') return true;
    return isDamageReportComplete(i.justification, i.photoUri);
  });
  const canSubmit = allItemsChecked && allDamageReportsComplete && !blocked && !submitting;

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      // Build detalles array matching the backend DTO:
      // { herramientaId, controlado: 'CHEQUEADO' | 'FALTANTE', observaciones? }
      const detalles = Object.entries(items).map(([herramientaId, data]) => ({
        herramientaId,
        controlado: data.status === 'ok' ? 'CHEQUEADO' : 'FALTANTE',
        ...(data.status === 'fail' && data.justification
          ? { observaciones: data.justification }
          : {}),
      }));

      const res = await fetch(`${API_BASE_URL}/checklist_cuartel/`, {
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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }

      if (Platform.OS === 'web') {
        alert('El checklist semanal del cuartel fue registrado correctamente.');
        navigation?.goBack();
      } else {
        Alert.alert(
          'Checklist Guardado',
          'El checklist semanal del cuartel fue registrado correctamente.',
          [{ text: 'Aceptar', onPress: () => navigation?.goBack() }]
        );
      }
    } catch (err) {
      console.error('Error saving weekly checklist:', err);
      if (Platform.OS === 'web') {
        alert(err.message || 'No se pudo guardar el checklist. Intentá nuevamente.');
      } else {
        Alert.alert('Error', err.message || 'No se pudo guardar el checklist. Intentá nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Progress calculation ───────────────────────────────────────────────

  const totalItems = Object.keys(items).length;
  const checkedItems = Object.values(items).filter(i => i.status !== null).length;
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" backgroundColor="#1a1c23" />
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={{ color: '#94a3b8', marginTop: 12, fontWeight: '600' }}>Cargando herramientas del cuartel...</Text>
      </View>
    );
  }

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

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerTitleBox}>
            <Text style={styles.mainTitle}>
              <Text style={{ color: '#fff' }}>CUARTEL — </Text>
              <Text style={{ color: '#f97316' }}>CHECKLIST SEMANAL</Text>
            </Text>

            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar-month" size={12} color="#94a3b8" />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </Text>
              <Text style={styles.dateDot}>•</Text>
              <MaterialCommunityIcons name="update" size={12} color="#94a3b8" />
              <Text style={styles.dateText}>CONTROL CADA 7 DÍAS</Text>
            </View>
          </View>

          {/* Blocked banner */}
          {blocked && (
            <View style={styles.blockedBanner}>
              <View style={styles.blockedIconRow}>
                <MaterialCommunityIcons name="lock-clock" size={22} color="#fbbf24" />
                <Text style={styles.blockedTitle}>CONTROL NO DISPONIBLE</Text>
              </View>
              <Text style={styles.blockedText}>
                El último control fue el {lastCheckDate ? new Date(lastCheckDate).toLocaleDateString('es-AR') : '—'}.
                {'\n'}Faltan <Text style={{ color: '#fbbf24', fontWeight: '900' }}>{daysRemaining} días</Text> para habilitar el próximo checklist semanal.
              </Text>
            </View>
          )}

          {/* Progress bar */}
          {!blocked && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>PROGRESO</Text>
                <Text style={styles.progressValue}>{checkedItems}/{totalItems} ({progressPercent}%)</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          )}

          {/* Tools section */}
          {herramientas.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="package-variant" size={48} color="#334155" />
              <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>
                No hay herramientas registradas en el cuartel
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="package-variant-closed" size={18} color="#f97316" />
                <Text style={styles.sectionTitle}>HERRAMIENTAS DEL CUARTEL</Text>
                <View style={styles.sectionLine} />
              </View>

              {herramientas.map((tool) => {
                const data = items[tool.id] || { status: null, justification: '', photoUri: null };
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
                          onPress={() => !blocked && setItemStatus(tool.id, 'ok')}
                          disabled={blocked}
                        >
                          <MaterialCommunityIcons name="check" size={18} color={data.status === 'ok' ? '#fff' : '#e2e8f0'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconButton, data.status === 'fail' && styles.iconButtonFail]}
                          onPress={() => !blocked && setItemStatus(tool.id, 'fail')}
                          disabled={blocked}
                        >
                          <MaterialCommunityIcons name="close" size={18} color={data.status === 'fail' ? '#fff' : '#e2e8f0'} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Damage report (conditional) */}
                    <DamageReportField
                      visible={data.status === 'fail'}
                      justification={data.justification}
                      onJustificationChange={(text) => updateItem(tool.id, 'justification', text)}
                      photoUri={data.photoUri}
                      onPhotoSelected={(uri) => updateItem(tool.id, 'photoUri', uri)}
                      onPhotoRemoved={() => updateItem(tool.id, 'photoUri', null)}
                      theme="dark"
                    />
                  </View>
                );
              })}
            </>
          )}

          {/* Validation warning */}
          {!canSubmit && checkedItems > 0 && !allDamageReportsComplete && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
              <MaterialCommunityIcons name="alert-circle" size={14} color="#fca5a5" />
              <Text style={{ color: '#fca5a5', fontSize: 11, fontWeight: '700' }}>
                Completar justificación y foto de los ítems marcados como FALTANTE para poder guardar.
              </Text>
            </View>
          )}

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>
                {blocked ? 'BLOQUEADO — ESPERAR 7 DÍAS' : 'GUARDAR CHECKLIST SEMANAL'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

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

  // Blocked banner
  blockedBanner: {
    backgroundColor: '#1b1d24',
    borderRadius: 8,
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
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 2,
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
    width: 36,
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
