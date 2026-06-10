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
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';
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
  // 1. Si tiene fecha_hora_finalizacion, calcular la diferencia directamente (más preciso)
  if (alerta.fecha_hora && alerta.fecha_hora_finalizacion) {
    const inicio = new Date(alerta.fecha_hora).getTime();
    const fin = new Date(alerta.fecha_hora_finalizacion).getTime();
    if (fin > inicio) {
      const diffHours = (fin - inicio) / (1000 * 60 * 60); // convertir ms a horas
      return diffHours < 100 ? diffHours : 0; // Filtrar anomalías/outliers
    }
  }
  // 2. Si no tiene fecha_finalizacion pero existe duracion_total_alerta
  if (alerta.duracion_total_alerta && alerta.duracion_total_alerta > 0) {
    // Si duracion_total_alerta > 1000, asumimos que está en milisegundos y lo convertimos a horas
    const rawHours = alerta.duracion_total_alerta > 1000
      ? alerta.duracion_total_alerta / (1000 * 60 * 60)
      : alerta.duracion_total_alerta;
    return rawHours < 100 ? rawHours : 0; // Filtrar anomalías/outliers
  }
  // 3. Sin datos de duración disponibles
  return 0;
}

// Helper: extrae el tipo/categoría de una alerta de forma resiliente y clasificada
function extraerTipoAlerta(alerta) {
  // 1. Intentar obtener de la relación subCategoriaAlerta
  const subCat = alerta.subCategoriaAlerta?.nombre_sub_categoria
    || alerta.subCategoriaAlerta?.nombre;
  
  let rawText = '';
  if (subCat) {
    rawText = subCat.toUpperCase().trim();
  } else {
    // Fallback: extraer de observaciones
    rawText = (alerta.observaciones || '').toUpperCase().trim();
  }

  if (!rawText) return 'INCIDENTE GENERAL';

  // Limpiar cualquier prefijo de severidad como "[NIVEL 4 - CRÍTICO] -"
  let cleanText = rawText.replace(/^\[NIVEL\s+\d+\s+-\s+[^\]]+\]\s*-\s*/i, '').trim();

  // Limpiar prefijos de tipo comunes
  cleanText = cleanText
    .replace(/^INCIDENTE DE /i, '')
    .replace(/^INCENDIO DE /i, '')
    .trim();

  // Clasificar según palabras clave para agrupar y mostrar información de valor
  if (cleanText.includes('INCENDIO ESTRUCTURAL') || cleanText === 'ESTRUCTURAL') {
    return 'INCENDIO ESTRUCTURAL';
  }
  if (cleanText.includes('INCENDIO FORESTAL') || cleanText === 'FORESTAL') {
    return 'INCENDIO FORESTAL';
  }
  if (cleanText.includes('INCENDIO') || cleanText.includes('FUEGO')) {
    return 'INCENDIO';
  }
  if (cleanText.includes('RESCATE VEHICULAR') || cleanText.includes('CHOQUE') || cleanText.includes('COLISION') || cleanText.includes('COLISIÓN')) {
    return 'RESCATE VEHICULAR';
  }
  if (cleanText.includes('RESCATE')) {
    return 'RESCATE';
  }
  if (cleanText.includes('MEDICA') || cleanText.includes('MÉDICA') || cleanText.includes('AMBULANCIA') || cleanText.includes('PARO')) {
    return 'EMERGENCIA MÉDICA';
  }
  if (cleanText.includes('GAS') || cleanText.includes('FUGA')) {
    return 'FUGA DE GAS';
  }
  if (cleanText.includes('INDUSTRIAL') || cleanText.includes('ACCIDENTE INDUSTRIAL')) {
    return 'ACCIDENTE INDUSTRIAL';
  }
  if (cleanText.includes('HAZMAT') || cleanText.includes('QUIMICO') || cleanText.includes('QUÍMICO')) {
    return 'HAZMAT';
  }

  // Agrupar datos ruidosos o de test comunes en desarrollo
  const lowerText = cleanText.toLowerCase();
  if (
    lowerText === 'sef' ||
    lowerText === 'papas' ||
    lowerText === '3e3e3e' ||
    lowerText === 'sin descripción' ||
    lowerText === 'sin descripcion' ||
    lowerText.length < 3
  ) {
    return 'INCIDENTE GENERAL';
  }

  // Si no coincide con ninguna palabra clave, retornar el texto limpio acotado (máximo 25 caracteres)
  return cleanText.length > 25 ? cleanText.substring(0, 22) + '...' : cleanText;
}

// Helper: mapea el tipo de emergencia a un icono de MaterialCommunityIcons
function getTipoIcon(tipo) {
  const t = tipo.toLowerCase();
  if (t.includes('incendio') || t.includes('fuego')) return 'fire';
  if (t.includes('rescate') || t.includes('accidente') || t.includes('vehicular')) return 'car-wrench';
  if (t.includes('gas') || t.includes('quimico') || t.includes('hazmat')) return 'biohazard';
  if (t.includes('medic') || t.includes('ambulancia')) return 'ambulance';
  return 'alert-circle';
}

export default function EstadisticasScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth());
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());
  const [mesModalVisible, setMesModalVisible] = useState(false);
  const [anioModalVisible, setAnioModalVisible] = useState(false);
  const [chartView, setChartView] = useState('bar'); // 'bar' | 'pie' | 'list'

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
          const b = r.usuarioId?.bombero || r.bombero || {};
          const nombreUsuario = r.usuarioId?.nombre_usuario || r.usuarioId?.nombre || '';
          const fullLabel = b.nombre ? `${b.nombre} ${b.apellido || ''}`.trim() : nombreUsuario || userId;
          firefighterMap[userId] = {
            id: userId,
            nombre: fullLabel.toUpperCase(),
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


  // Dynamic KPIs calculations
  const kpis = React.useMemo(() => {
    const totalEmergencias = alerts.length;

    // Filter accepted responses for this period's alerts
    const alertIdsInPeriod = new Set(alerts.map(a => a.id));
    const acceptedInPeriod = responders.filter(r => {
      if (r.estado_respuesta !== 'ACEPTADO') return false;
      const rAlertaId = r.alerta_id || r.alertaId?.id || r.alertaId;
      return alertIdsInPeriod.has(rAlertaId);
    });

    const avgResponders = totalEmergencias > 0
      ? (acceptedInPeriod.length / totalEmergencias).toFixed(1)
      : '0.0';

    // Calculate alert durations in hours
    const alertsWithDuration = alerts.map(a => calcularDuracionAlerta(a)).filter(d => d > 0);
    const avgDuration = alertsWithDuration.length > 0
      ? (alertsWithDuration.reduce((acc, d) => acc + d, 0) / alertsWithDuration.length).toFixed(1)
      : '0.0';

    const bomberoDestacado = participationList.length > 0
      ? participationList[0].nombre
      : 'SIN REGISTRO';

    return {
      totalEmergencias,
      avgResponders,
      avgDuration,
      bomberoDestacado
    };
  }, [alerts, responders, participationList]);

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

        {/* KPIs Summary Grid */}
        <View style={styles.kpisGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: '#e11d48' }]}>
            <View style={styles.kpiHeader}>
              <MaterialCommunityIcons name="fire" size={20} color="#e11d48" />
              <Text style={styles.kpiValue}>{kpis.totalEmergencias}</Text>
            </View>
            <Text style={styles.kpiLabel}>TOTAL EMERGENCIAS</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#3b82f6' }]}>
            <View style={styles.kpiHeader}>
              <MaterialCommunityIcons name="account-multiple" size={20} color="#3b82f6" />
              <Text style={styles.kpiValue}>{kpis.avgResponders}</Text>
            </View>
            <Text style={styles.kpiLabel}>PROM. RESPONDEDORES</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
            <View style={styles.kpiHeader}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#10b981" />
              <Text style={styles.kpiValue}>{kpis.avgDuration}h</Text>
            </View>
            <Text style={styles.kpiLabel}>DURACIÓN PROMEDIO</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#fbbf24' }]}>
            <View style={styles.kpiHeader}>
              <MaterialCommunityIcons name="trophy" size={20} color="#fbbf24" />
              <Text style={[styles.kpiValue, { fontSize: 13, flex: 1, textAlign: 'right' }]} numberOfLines={1}>
                {kpis.bomberoDestacado.split(' ')[0]}
              </Text>
            </View>
            <Text style={styles.kpiLabel}>BOMBERO LÍDER</Text>
          </View>
        </View>

        {/* Chart Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderWithToggle}>
            <Text style={styles.cardTitleNoMargin}>EMERGENCIAS POR TIPO</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, chartView === 'bar' && styles.toggleBtnActive]}
                onPress={() => setChartView('bar')}
              >
                <MaterialCommunityIcons name="chart-bar" size={16} color={chartView === 'bar' ? '#fff' : '#94a3b8'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, chartView === 'pie' && styles.toggleBtnActive]}
                onPress={() => setChartView('pie')}
              >
                <MaterialCommunityIcons name="chart-pie" size={16} color={chartView === 'pie' ? '#fff' : '#94a3b8'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, chartView === 'list' && styles.toggleBtnActive]}
                onPress={() => setChartView('list')}
              >
                <MaterialCommunityIcons name="format-list-bulleted" size={16} color={chartView === 'list' ? '#fff' : '#94a3b8'} />
              </TouchableOpacity>
            </View>
          </View>

          {Object.keys(statsTipos).length > 0 ? (
            <View style={styles.chartContentWrapper}>
              {chartView === 'bar' && (
                <View style={styles.chartWrapper}>
                  <BarChart
                    data={{
                      labels: Object.keys(statsTipos).map(tipo => tipo.length > 15 ? tipo.substring(0, 13) + '..' : tipo),
                      datasets: [{ data: Object.values(statsTipos) }]
                    }}
                    width={width - 80}
                    height={240}
                    chartConfig={{
                      backgroundColor: '#1b1d24',
                      backgroundGradientFrom: '#1b1d24',
                      backgroundGradientTo: '#1b1d24',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(225, 29, 72, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                      style: { borderRadius: 8 },
                      fillShadowGradient: '#e11d48',
                      fillShadowGradientOpacity: 0.6,
                      propsForLabels: {
                        fontSize: 8,
                        fontWeight: '700',
                      },
                    }}
                    fromZero
                    verticalLabelRotation={20}
                    segments={
                      Math.max(...Object.values(statsTipos), 0) < 5
                        ? Math.max(...Object.values(statsTipos), 1)
                        : 4
                    }
                    style={styles.chart}
                  />
                </View>
              )}

              {chartView === 'pie' && (
                <View style={styles.chartWrapper}>
                  <PieChart
                    data={Object.entries(statsTipos).map(([tipo, count], idx) => {
                      const colors = ['#e11d48', '#3b82f6', '#10b981', '#fbbf24', '#8b5cf6', '#a855f7'];
                      return {
                        name: tipo.length > 12 ? tipo.substring(0, 10) + '..' : tipo,
                        population: count,
                        color: colors[idx % colors.length],
                        legendFontColor: '#94a3b8',
                        legendFontSize: 10
                      };
                    })}
                    width={width - 80}
                    height={180}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="10"
                    absolute
                  />
                </View>
              )}

              {chartView === 'list' && (
                <View style={styles.customChartContainer}>
                  {Object.entries(statsTipos).map(([tipo, count], idx) => {
                    const total = alerts.length;
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    
                    const colors = ['#e11d48', '#3b82f6', '#10b981', '#fbbf24', '#8b5cf6', '#a855f7'];
                    const color = colors[idx % colors.length];
                    const iconName = getTipoIcon(tipo);

                    return (
                      <View key={tipo} style={styles.chartRow}>
                        <View style={styles.chartRowHeader}>
                          <View style={styles.chartLabelGroup}>
                            <View style={[styles.colorIndicator, { backgroundColor: color }]} />
                            <MaterialCommunityIcons name={iconName} size={15} color={color} style={{ marginRight: 2 }} />
                            <Text style={styles.chartLabel} numberOfLines={1}>{tipo}</Text>
                          </View>
                          <Text style={styles.chartValue}>
                            {count} {count === 1 ? 'alerta' : 'alertas'} ({percentage.toFixed(0)}%)
                          </Text>
                        </View>
                        <View style={styles.barContainer}>
                          <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
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
  kpisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    gap: 6,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#f8fafc',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
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
  cardHeaderWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#e11d48',
    paddingLeft: 10
  },
  cardTitleNoMargin: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#16181d',
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: '#26282f',
  },
  toggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  toggleBtnActive: {
    backgroundColor: '#e11d48',
  },
  chartContentWrapper: {
    paddingTop: 4,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  chart: {
    borderRadius: 8,
  },
  customChartContainer: {
    paddingVertical: 4,
    gap: 16,
  },
  chartRow: {
    gap: 8,
  },
  chartRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chartLabel: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chartValue: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
  },
  barContainer: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
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
