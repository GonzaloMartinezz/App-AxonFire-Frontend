import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Dimensions,
  Modal,
  FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import axios from 'axios';

import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const { width } = Dimensions.get('window');

const MESES = [
  { value: 0, label: 'Enero' },
  { value: 1, label: 'Febrero' },
  { value: 2, label: 'Marzo' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Mayo' },
  { value: 5, label: 'Junio' },
  { value: 6, label: 'Julio' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Septiembre' },
  { value: 9, label: 'Octubre' },
  { value: 10, label: 'Noviembre' },
  { value: 11, label: 'Diciembre' }
];

const ANIOS = [2024, 2025, 2026, 2027];

// Helper: calcula la duración en horas de una alerta
function calcularDuracionAlerta(alerta) {
  // 1. Si existe duracion_total_alerta y es > 0, usarla directamente
  if (alerta.duracion_total_alerta && alerta.duracion_total_alerta > 0) {
    return alerta.duracion_total_alerta;
  }
  // 2. Si tiene fecha_hora_finalizacion, calcular la diferencia
  if (alerta.fecha_hora && alerta.fecha_hora_finalizacion) {
    const inicio = new Date(alerta.fecha_hora).getTime();
    const fin = new Date(alerta.fecha_hora_finalizacion).getTime();
    if (fin > inicio) {
      return (fin - inicio) / (1000 * 60 * 60); // convertir ms a horas
    }
  }
  // 3. Sin datos de duración disponibles
  return 0;
}

// Helper: extrae el tipo/categoría de una alerta de forma resiliente
function extraerTipoAlerta(alerta) {
  // Intentar obtener de la relación subCategoriaAlerta
  const subCat = alerta.subCategoriaAlerta?.nombre_sub_categoria
    || alerta.subCategoriaAlerta?.nombre;
  if (subCat) return subCat.toUpperCase().trim();

  // Fallback: extraer de observaciones
  const obs = (alerta.observaciones || '').toUpperCase().trim();
  if (obs) {
    // Limpiar prefijos comunes
    return obs.replace('INCIDENTE DE ', '').replace('INCENDIO DE ', '').trim();
  }

  return 'SIN CATEGORÍA';
}

export default function EstadisticasScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth());
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());
  const [mesModalVisible, setMesModalVisible] = useState(false);
  const [anioModalVisible, setAnioModalVisible] = useState(false);

  // States for fetched datasets
  const [alerts, setAlerts] = useState([]);
  const [responders, setResponders] = useState([]);

  // Computed states
  const [statsTipos, setStatsTipos] = useState({});
  const [participationList, setParticipationList] = useState([]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Calculate monthly bounds
      const desde = new Date(selectedAnio, selectedMes, 1).toISOString();
      const hasta = new Date(selectedAnio, selectedMes + 1, 0, 23, 59, 59, 999).toISOString();

      console.log('EstadisticasScreen - Rango de fechas para consulta:', { desde, hasta });

      let alertsData = [];
      let responsesData = [];

      // 1. Fetch Alerts in range
      try {
        const resAlerts = await axios.get(`${API_BASE_URL}/alerta/rango`, {
          headers,
          params: { fecha_desde: desde, fecha_hasta: hasta },
          timeout: 5000
        });
        alertsData = resAlerts.data?.alertas || [];
      } catch (err) {
        console.log('Error loading range alerts:', err?.message || err);
      }

      // 2. Fetch responses for the alerts in this period (using the alert-specific endpoint)
      try {
        if (alertsData.length > 0) {
          const promises = alertsData.map(async (alert) => {
            try {
              const resResp = await axios.get(`${API_BASE_URL}/respuestas_alertas/${alert.id}`, {
                headers,
                timeout: 5000
              });
              return Array.isArray(resResp.data) ? resResp.data : [];
            } catch (err) {
              console.log(`Error loading responses for alert ${alert.id}:`, err?.message || err);
              return [];
            }
          });
          const results = await Promise.all(promises);
          responsesData = results.flat();
        } else {
          responsesData = [];
        }
      } catch (err) {
        console.log('Error loading alert responses:', err?.message || err);
      }

      setAlerts(alertsData);
      setResponders(responsesData);

      // Compute statistics by type
      const counts = {};
      alertsData.forEach(a => {
        const cleanType = extraerTipoAlerta(a);
        counts[cleanType] = (counts[cleanType] || 0) + 1;
      });
      setStatsTipos(counts);

      // Build a lookup of alert durations by alert id
      const alertDurationMap = {};
      alertsData.forEach(a => {
        alertDurationMap[a.id] = calcularDuracionAlerta(a);
      });

      // Get the set of alert IDs in the current period
      const alertIdsInPeriod = new Set(alertsData.map(a => a.id));

      // Filter responses: only ACEPTADO and linked to alerts in current period
      const acceptedResponses = responsesData.filter(r => {
        if (r.estado_respuesta !== 'ACEPTADO') return false;
        const rAlertaId = r.alerta_id || r.alertaId?.id || r.alertaId;
        return alertIdsInPeriod.has(rAlertaId);
      });

      // Derive unique firefighters from accepted responses
      // The backend includes usuarioId relation in responses
      const firefighterMap = {};
      acceptedResponses.forEach(r => {
        const userId = r.usuario_id || r.usuarioId?.id;
        if (!userId) return;

        if (!firefighterMap[userId]) {
          // Extract name info from the included usuario relation
          const usuario = r.usuarioId || {};
          const nombre = usuario.nombre_usuario || usuario.nombre || userId;
          firefighterMap[userId] = {
            id: userId,
            nombre: nombre.toUpperCase(),
            asistencias: 0,
            horas: 0
          };
        }

        firefighterMap[userId].asistencias += 1;

        // Add duration of this specific alert
        const rAlertaId = r.alerta_id || r.alertaId?.id || r.alertaId;
        const duration = alertDurationMap[rAlertaId] || 0;
        firefighterMap[userId].horas += duration;
      });

      const parsedParticipation = Object.values(firefighterMap);

      // Sort by assistances descending (horas may be 0 if durations aren't filled)
      parsedParticipation.sort((a, b) => b.asistencias - a.asistencias || b.horas - a.horas);
      setParticipationList(parsedParticipation);

    } catch (err) {
      console.log('Error calculating stats:', err);
      Alert.alert('Error', 'No se pudieron calcular las estadísticas.');
    } finally {
      setLoading(false);
    }
  }, [selectedMes, selectedAnio, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportarCSV = async () => {
    if (participationList.length === 0) {
      Alert.alert('Aviso', 'No hay datos disponibles para exportar.');
      return;
    }

    try {
      let csvContent = "\uFEFFNombre,Asistencias,Horas Totales\n";
      participationList.forEach(s => {
        csvContent += `"${s.nombre}",${s.asistencias},${s.horas > 0 ? s.horas.toFixed(1) : 'N/D'}\n`;
      });

      const nombreMes = MESES.find(m => m.value === selectedMes)?.label || 'Mes';
      const filename = `RUBA_Participacion_${nombreMes}_${selectedAnio}.csv`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: `Exportar Estadísticas RUBA`,
        UTI: 'public.comma-separated-values-text'
      });
    } catch (err) {
      console.log('Error exporting CSV:', err);
      Alert.alert('Error', 'No se pudo exportar el archivo CSV.');
    }
  };

  // Setup chart data
  const chartLabels = Object.keys(statsTipos);
  const chartValues = Object.values(statsTipos);

  const chartData = {
    labels: chartLabels.length > 0 ? chartLabels : ['SIN DATOS'],
    datasets: [
      {
        data: chartValues.length > 0 ? chartValues : [0]
      }
    ]
  };

  const chartConfig = {
    backgroundColor: '#1b1d24',
    backgroundGradientFrom: '#1b1d24',
    backgroundGradientTo: '#1b1d24',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(225, 29, 72, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    style: {
      borderRadius: 8
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#e11d48'
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.loadingText}>Cargando estadísticas RUBA...</Text>
      </View>
    );
  }

  const currentMesLabel = MESES.find(m => m.value === selectedMes)?.label || '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121417" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#e11d48" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ESTADÍSTICAS RUBA</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={exportarCSV}>
          <MaterialCommunityIcons name="file-export" size={20} color="#fff" />
          <Text style={styles.exportBtnText}>EXPORTAR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* Filters bar */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity style={styles.filterSelector} onPress={() => setMesModalVisible(true)}>
            <MaterialCommunityIcons name="calendar-month" size={18} color="#cbd5e1" />
            <Text style={styles.filterText}>{currentMesLabel.toUpperCase()}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterSelector} onPress={() => setAnioModalVisible(true)}>
            <MaterialCommunityIcons name="calendar-today" size={18} color="#cbd5e1" />
            <Text style={styles.filterText}>{selectedAnio}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Chart Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>EMERGENCIAS POR TIPO</Text>
          {chartValues.length > 0 ? (
            <BarChart
              data={chartData}
              width={width - 48}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={10}
              style={styles.chart}
              fromZero
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay emergencias registradas en este período.</Text>
            </View>
          )}
        </View>

        {/* Participation Board */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PARTICIPACIÓN POR BOMBERO</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>BOMBERO</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>ASIST.</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>HORAS</Text>
          </View>

          {participationList.map((item, idx) => (
            <View key={item.id} style={[styles.tableRow, idx % 2 === 1 && styles.rowAlternative]}>
              <View style={{ flex: 2 }}>
                <Text style={styles.bomberoName}>{item.nombre}</Text>
              </View>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>
                {item.asistencias}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', color: '#e11d48', fontWeight: 'bold' }]}>
                {item.horas > 0 ? `${item.horas.toFixed(1)} HS` : 'N/D'}
              </Text>
            </View>
          ))}

          {participationList.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No se registró participación del personal.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Mes Modal Selector */}
      <Modal visible={mesModalVisible} transparent animationType="fade" onRequestClose={() => setMesModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECCIONAR MES</Text>
              <TouchableOpacity onPress={() => setMesModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={MESES}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedMes === item.value && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedMes(item.value);
                    setMesModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedMes === item.value && styles.modalItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Anio Modal Selector */}
      <Modal visible={anioModalVisible} transparent animationType="fade" onRequestClose={() => setAnioModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECCIONAR AÑO</Text>
              <TouchableOpacity onPress={() => setAnioModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ANIOS}
              keyExtractor={(item) => String(item)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedAnio === item && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedAnio(item);
                    setAnioModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedAnio === item && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181d'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
    backgroundColor: '#1a1c23'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#e11d48',
    letterSpacing: 0.5
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#af101a',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6
  },
  exportBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  scrollView: {
    flex: 1
  },
  contentScroll: {
    paddingHorizontal: 24,
    paddingTop: 20
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 16,
    fontSize: 13,
    letterSpacing: 0.5
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  filterSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  filterText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  card: {
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#e11d48',
    paddingLeft: 10
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center'
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
    marginBottom: 8
  },
  tableHeaderCell: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  rowAlternative: {
    backgroundColor: '#1e253040'
  },
  bomberoName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800'
  },
  bomberoRank: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2
  },
  tableCell: {
    color: '#cbd5e1',
    fontSize: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxHeight: 400,
    backgroundColor: '#1b1d24',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#26282f'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#26282f'
  },
  modalItemActive: {
    backgroundColor: '#af101a20'
  },
  modalItemText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600'
  },
  modalItemTextActive: {
    color: '#e11d48',
    fontWeight: '800'
  }
});
