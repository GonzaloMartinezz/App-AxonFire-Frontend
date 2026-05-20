import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import DamageReportField, { isDamageReportComplete } from '../components/DamageReportField';

const ScrollContainer = Platform.OS === 'web' ? View : ScrollView;

export default function ChecklistScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const userId = user?.id || 'abc2';
  const [submitting, setSubmitting] = useState(false);

  // State for items
  const [hidrico, setHidrico] = useState({
    manguera: null, // null, 'ok', 'fail'
    piton: 'ok'
  });
  const [corte, setCorte] = useState({
    hidraulica: 'ok',
    motosierra: 'fail',
    hacha: null
  });
  const [epp, setEpp] = useState({ era: true, cascos: false });

  // Damage report state: { [itemKey]: { justification } }
  const [damageReports, setDamageReports] = useState({});
  const updateDamage = useCallback((key, field, value) => {
    setDamageReports(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { justification: '' }), [field]: value },
    }));
  }, []);
  const getDamage = (key) => damageReports[key] || { justification: '' };

  // Collect all fail items and check if their reports are complete
  const failItems = [
    hidrico.manguera === 'fail' ? 'hid_manguera' : null,
    hidrico.piton === 'fail' ? 'hid_piton' : null,
    corte.hidraulica === 'fail' ? 'cor_hidraulica' : null,
    corte.motosierra === 'fail' ? 'cor_motosierra' : null,
    corte.hacha === 'fail' ? 'cor_hacha' : null,
  ].filter(Boolean);

  const canSubmit = failItems.every(key => {
    const d = getDamage(key);
    return isDamageReportComplete(d.justification);
  }) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      const detalles = [
        {
          inventario_id: 'hid_manguera',
          controlado: hidrico.manguera === 'ok' ? 'CHEQUEADO' : 'FALTANTE',
          observaciones: hidrico.manguera === 'fail' ? getDamage('hid_manguera').justification : null,
        },
        {
          inventario_id: 'hid_piton',
          controlado: hidrico.piton === 'ok' ? 'CHEQUEADO' : 'FALTANTE',
          observaciones: hidrico.piton === 'fail' ? getDamage('hid_piton').justification : null,
        },
        {
          inventario_id: 'cor_hidraulica',
          controlado: corte.hidraulica === 'ok' ? 'CHEQUEADO' : 'FALTANTE',
          observaciones: corte.hidraulica === 'fail' ? getDamage('cor_hidraulica').justification : null,
        },
        {
          inventario_id: 'cor_motosierra',
          controlado: corte.motosierra === 'ok' ? 'CHEQUEADO' : 'FALTANTE',
          observaciones: corte.motosierra === 'fail' ? getDamage('cor_motosierra').justification : null,
        },
        {
          inventario_id: 'cor_hacha',
          controlado: corte.hacha === 'ok' ? 'CHEQUEADO' : 'FALTANTE',
          observaciones: corte.hacha === 'fail' ? getDamage('cor_hacha').justification : null,
        },
        {
          inventario_id: 'epp_era',
          controlado: epp.era ? 'CHEQUEADO' : 'FALTANTE',
          observaciones: null,
        },
        {
          inventario_id: 'epp_cascos',
          controlado: epp.cascos ? 'CHEQUEADO' : 'FALTANTE',
          observaciones: null,
        },
      ];

      const payload = {
        camion_id: 'MOVIL_12',
        usuario_id: userId,
        detalles,
      };

      try {
        await fetch(`${API_BASE_URL}/checklist_camiones_diario/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.log('Error enviando checklist diario al backend, usando fallback local:', err);
      }

      try {
        const localHist = await AsyncStorage.getItem('daily_checklist_history');
        const history = localHist ? JSON.parse(localHist) : [];
        history.push({
          ...payload,
          fecha_control: new Date().toISOString(),
        });
        await AsyncStorage.setItem('daily_checklist_history', JSON.stringify(history));
      } catch (e) {
        console.log('Error guardando historial local:', e);
      }

      if (Platform.OS === 'web') {
        alert('El checklist diario de la unidad fue registrado correctamente.');
        navigation?.navigate('MainApp');
      } else {
        Alert.alert(
          'Checklist Guardado',
          'El checklist diario de la unidad fue registrado correctamente.',
          [{ text: 'Aceptar', onPress: () => navigation?.navigate('MainApp') }]
        );
      }
    } catch (err) {
      console.error('Error al guardar el checklist diario:', err);
      if (Platform.OS === 'web') {
        alert('No se pudo guardar el checklist diario. Intentá de nuevo.');
      } else {
        Alert.alert('Error', 'No se pudo guardar el checklist diario. Intentá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation?.navigate('MainApp')} style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="home" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>TACTICAL VANGUARD</Text>
        </View>
        <View style={styles.avatarPlaceholder}>
          <MaterialCommunityIcons name="account-tie" size={20} color="#fff" />
        </View>
      </View>

      <ScrollContainer 
        style={Platform.OS === 'web' ? [styles.scrollView, styles.scrollContent, { paddingBottom: (insets.bottom || 0) + 150 }] : styles.scrollView} 
        contentContainerStyle={Platform.OS === 'web' ? undefined : [styles.scrollContent, { paddingBottom: (insets.bottom || 0) + 150 }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title Section */}
        <View style={styles.headerTitleBox}>
          <Text style={styles.mainTitle}>
            <Text style={{ color: '#fff' }}>MÓVIL 12 - </Text>
            <Text style={{ color: '#dc2626' }}>CHECKLIST DIARIO</Text>
          </Text>

          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-month" size={12} color="#94a3b8" />
            <Text style={styles.dateText}>24 OCT 2023</Text>
            <Text style={styles.dateDot}>•</Text>
            <MaterialCommunityIcons name="clock-outline" size={12} color="#94a3b8" />
            <Text style={styles.dateText}>08:00 HRS</Text>
          </View>
        </View>

        {/* Section: HÍDRICO */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>HÍDRICO</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.cardItem}>
          <View style={styles.cardItemLeft}>
            <Text style={styles.itemTitle}>MANGUERA 45MM X 20M</Text>
            <Text style={styles.itemSubtitle}>Cantidad requerida: 6 unidades</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.iconButton, hidrico.manguera === 'ok' && styles.iconButtonActive]}
              onPress={() => setHidrico({ ...hidrico, manguera: 'ok' })}
            >
              <MaterialCommunityIcons name="check" size={18} color={hidrico.manguera === 'ok' ? '#fff' : '#e2e8f0'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, hidrico.manguera === 'fail' && styles.iconButtonFail]}
              onPress={() => setHidrico({ ...hidrico, manguera: 'fail' })}
            >
              <MaterialCommunityIcons name="close" size={18} color={hidrico.manguera === 'fail' ? '#fff' : '#e2e8f0'} />
            </TouchableOpacity>
          </View>
        </View>
        <DamageReportField visible={hidrico.manguera === 'fail'} justification={getDamage('hid_manguera').justification} onJustificationChange={(t) => updateDamage('hid_manguera', 'justification', t)} theme="dark" />

        <View style={[styles.cardItem, { borderLeftColor: hidrico.piton === 'fail' ? '#dc2626' : '#22c55e' }]}>
          <View style={styles.cardItemLeft}>
            <Text style={styles.itemTitle}>PITÓN DE CORTINA</Text>
            <Text style={styles.itemSubtitle}>Revisión de sellos y acople</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.iconButton, hidrico.piton === 'ok' && styles.iconButtonActive]}
              onPress={() => setHidrico({ ...hidrico, piton: 'ok' })}
            >
              <MaterialCommunityIcons name="check" size={18} color={hidrico.piton === 'ok' ? '#fff' : '#e2e8f0'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, hidrico.piton === 'fail' && styles.iconButtonFail]}
              onPress={() => setHidrico({ ...hidrico, piton: 'fail' })}
            >
              <MaterialCommunityIcons name="close" size={18} color={hidrico.piton === 'fail' ? '#fff' : '#e2e8f0'} />
            </TouchableOpacity>
          </View>
        </View>
        <DamageReportField visible={hidrico.piton === 'fail'} justification={getDamage('hid_piton').justification} onJustificationChange={(t) => updateDamage('hid_piton', 'justification', t)} theme="dark" />

        {/* Section: CORTE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CORTE</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.largeCardItem}>
          <View style={styles.largeCardTop}>
            <MaterialCommunityIcons name="car-wrench" size={24} color="#94a3b8" />
            <View style={[styles.badge, { backgroundColor: '#1e3a8a' }]}>
              <Text style={styles.badgeText}>READY</Text>
            </View>
          </View>
          <Text style={styles.largeCardTitle}>HERRAMIENTA HIDRÁULICA</Text>
          <View style={styles.largeCardActions}>
            <TouchableOpacity
              style={[styles.fullBtn, corte.hidraulica === 'ok' ? styles.fullBtnRed : styles.fullBtnGray]}
              onPress={() => setCorte({ ...corte, hidraulica: 'ok' })}
            >
              <Text style={styles.fullBtnText}>OK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fullBtn, corte.hidraulica === 'fail' ? styles.fullBtnRed : styles.fullBtnGray]}
              onPress={() => setCorte({ ...corte, hidraulica: 'fail' })}
            >
              <Text style={styles.fullBtnText}>Falta/Roto</Text>
            </TouchableOpacity>
          </View>
        </View>
        <DamageReportField visible={corte.hidraulica === 'fail'} justification={getDamage('cor_hidraulica').justification} onJustificationChange={(t) => updateDamage('cor_hidraulica', 'justification', t)} theme="dark" />

        <View style={styles.largeCardItem}>
          <View style={styles.largeCardTop}>
            <MaterialCommunityIcons name="axe" size={24} color="#fca5a5" />
            <View style={[styles.badge, { backgroundColor: '#451a1a' }]}>
              <Text style={[styles.badgeText, { color: '#fca5a5' }]}>DAMAGED</Text>
            </View>
          </View>
          <Text style={styles.largeCardTitle}>MOTOSIERRA STIHL</Text>
          <View style={styles.largeCardActions}>
            <TouchableOpacity
              style={[styles.fullBtn, corte.motosierra === 'ok' ? styles.fullBtnRed : styles.fullBtnGray]}
              onPress={() => setCorte({ ...corte, motosierra: 'ok' })}
            >
              <Text style={styles.fullBtnText}>OK</Text>
            </TouchableOpacity>
             <TouchableOpacity
              style={[styles.fullBtn, corte.motosierra === 'fail' ? styles.fullBtnRed : styles.fullBtnGray]}
              onPress={() => setCorte({ ...corte, motosierra: 'fail' })}
            >
              <Text style={styles.fullBtnText}>Falta/Roto</Text>
            </TouchableOpacity>
          </View>
        </View>
        <DamageReportField visible={corte.motosierra === 'fail'} justification={getDamage('cor_motosierra').justification} onJustificationChange={(t) => updateDamage('cor_motosierra', 'justification', t)} theme="dark" />

        <View style={styles.largeCardItem}>
          <View style={styles.largeCardTop}>
            <MaterialCommunityIcons name="hammer" size={24} color="#fca5a5" />
            <View style={[styles.badge, { backgroundColor: '#334155' }]}>
              <Text style={styles.badgeText}>PENDING</Text>
            </View>
          </View>
          <Text style={styles.largeCardTitle}>HACHA DE BOMBERO</Text>
          <View style={styles.largeCardActions}>
            <TouchableOpacity
              style={[styles.fullBtn, corte.hacha === 'ok' ? styles.fullBtnRed : styles.fullBtnGray]}
              onPress={() => setCorte({ ...corte, hacha: 'ok' })}
            >
              <Text style={styles.fullBtnText}>OK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fullBtn, corte.hacha === 'fail' ? styles.fullBtnRed : styles.fullBtnGray]}
              onPress={() => setCorte({ ...corte, hacha: 'fail' })}
            >
              <Text style={styles.fullBtnText}>Falta/Roto</Text>
            </TouchableOpacity>
          </View>
        </View>
        <DamageReportField visible={corte.hacha === 'fail'} justification={getDamage('cor_hacha').justification} onJustificationChange={(t) => updateDamage('cor_hacha', 'justification', t)} theme="dark" />

        {/* Section: EPP */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>EPP</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.eppCard}>
          <View style={styles.eppIconBox}>
            <MaterialCommunityIcons name="diving-scuba-tank" size={20} color="#93c5fd" />
          </View>
          <View style={styles.eppContent}>
            <Text style={styles.eppTitle}>EQUIPO ERA{'\n'}(AUTÓNOMO)</Text>
          </View>
          <View style={styles.eppExtra}>
            <Text style={styles.eppExtraLabel}>PSI:</Text>
            <Text style={styles.eppExtraValue}>4500</Text>
          </View>
          <Switch
            trackColor={{ false: "#3f3f46", true: "#166534" }}
            thumbColor={epp.era ? "#22c55e" : "#a1a1aa"}
            ios_backgroundColor="#3f3f46"
            onValueChange={(val) => setEpp({ ...epp, era: val })}
            value={epp.era}
          />
        </View>

        <View style={styles.eppCard}>
          <View style={styles.eppIconBox}>
            <MaterialCommunityIcons name="hard-hat" size={20} color="#fca5a5" />
          </View>
          <View style={styles.eppContent}>
            <Text style={styles.eppTitle}>CASCOS DE{'\n'}RESCATE</Text>
          </View>
          <View style={styles.eppExtra}>
            <Text style={styles.eppExtraLabel}>Qty:</Text>
            <Text style={styles.eppExtraValue}>4/4</Text>
          </View>
          <Switch
            trackColor={{ false: "#3f3f46", true: "#166534" }}
            thumbColor={epp.cascos ? "#22c55e" : "#a1a1aa"}
            ios_backgroundColor="#3f3f46"
            onValueChange={(val) => setEpp({ ...epp, cascos: val })}
            value={epp.cascos}
          />
        </View>

        {!canSubmit && failItems.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
            <MaterialCommunityIcons name="alert-circle" size={14} color="#fca5a5" />
            <Text style={{ color: '#fca5a5', fontSize: 11, fontWeight: '700' }}>Completar justificación de los ítems marcados como Falta/Roto para poder guardar.</Text>
          </View>
        )}
        <TouchableOpacity 
          style={[styles.saveButton, !canSubmit && { backgroundColor: '#334155', opacity: 0.6 }]} 
          disabled={!canSubmit || submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>GUARDAR CHECKLIST</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollContainer>

      {/* Fake Bottom Nav */}
      <View style={styles.fakeBottomNav}>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="fire" size={24} color="#64748b" />
          <Text style={styles.navLabel}>INCIDENTS</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="account-group" size={24} color="#64748b" />
          <Text style={styles.navLabel}>UNITS</Text>
        </View>
        <View style={styles.sosContainer}>
          <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
          <Text style={styles.sosLabel}>SOS</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="compass" size={24} color="#64748b" />
          <Text style={styles.navLabel}>MAP</Text>
        </View>
        <View style={styles.navItemActive}>
          <MaterialCommunityIcons name="clipboard-text" size={24} color="#dc2626" />
          <Text style={[styles.navLabel, { color: '#dc2626' }]}>LOGS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181d',
    // Forzamos a que el contenedor mida exactamente la ventana del navegador y no se desborde
    ...Platform.select({
      web: {
        height: '100vh',
        overflow: 'hidden',
      },
    }),
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        height: 'calc(100vh - 120px)',
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
    paddingBottom: 200,
  },
  headerTitleBox: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#26282f',
    marginLeft: 16,
  },
  cardItem: {
    backgroundColor: '#1b1d24',
    borderRadius: 4,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
  cardItemLeft: {
    flex: 1,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 14,
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
  largeCardItem: {
    backgroundColor: '#1b1d24',
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
  },
  largeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#93c5fd',
    fontSize: 9,
    fontWeight: '800',
  },
  largeCardTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  largeCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  fullBtn: {
    flex: 1,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullBtnGray: {
    backgroundColor: '#334155',
  },
  fullBtnRed: {
    backgroundColor: '#dc2626',
  },
  fullBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  eppCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
  },
  eppIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eppContent: {
    flex: 1,
  },
  eppTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  eppExtra: {
    marginRight: 16,
    alignItems: 'flex-start',
  },
  eppExtraLabel: {
    color: '#64748b',
    fontSize: 10,
  },
  eppExtraValue: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  fakeBottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: '#16181d',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#26282f',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingBottom: 6,
  },
  navItemActive: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingBottom: 6,
  },
  navLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosContainer: {
    backgroundColor: '#ef4444',
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sosLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  }
});
