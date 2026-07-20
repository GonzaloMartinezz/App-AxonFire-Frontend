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
import { styles } from '../styles/EstadisticasScreenStyles';

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

const CATEGORIAS_CONFIG = {
  'INCENDIOS': {
    color: '#e11d48',
    icon: 'fire',
    label: 'INCENDIOS'
  },
  'RESCATES': {
    color: '#f97316',
    icon: 'car-wrench',
    label: 'RESCATES'
  },
  'ACCIDENTES': {
    color: '#fbbf24',
    icon: 'car-crash',
    label: 'ACCIDENTES'
  },
  'MAT-PEL (HAZMAT)': {
    color: '#a855f7',
    icon: 'biohazard',
    label: 'MAT-PEL'
  },
  'SERVICIOS': {
    color: '#3b82f6',
    icon: 'tools',
    label: 'SERVICIOS'
  },
  'OTROS': {
    color: '#64748b',
    icon: 'alert-circle',
    label: 'OTROS'
  }
};

// Helper: extrae el tipo/categoría de una alerta de forma resiliente y clasificada bajo criterios RUBA
function extraerTipoAlerta(alerta) {
  const subCat = alerta.subCategoriaAlerta?.nombre_sub_categoria
    || alerta.subCategoriaAlerta?.nombre;

  let rawText = '';
  if (subCat) {
    rawText = subCat.toUpperCase().trim();
  } else {
    rawText = (alerta.observaciones || '').toUpperCase().trim();
  }

  if (!rawText) return 'OTROS';

  // Eliminar acentos y caracteres especiales para hacer una comparación robusta
  const normalizeText = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  const text = normalizeText(rawText);

  // 1. INCENDIOS
  if (
    text.includes('incendio') ||
    text.includes('fuego') ||
    text.includes('quema') ||
    text.includes('humo') ||
    text.includes('forestal') ||
    text.includes('estructural') ||
    text.includes('pastizal') ||
    text.includes('interfase') ||
    text.includes('se quema') ||
    text.includes('quemando')
  ) {
    return 'INCENDIOS';
  }

  // 2. RESCATES
  if (
    text.includes('rescate') ||
    text.includes('atrapado') ||
    text.includes('altura') ||
    text.includes('acuatico') ||
    text.includes('pozo') ||
    text.includes('ascensor') ||
    text.includes('animal') ||
    text.includes('perro') ||
    text.includes('gato')
  ) {
    return 'RESCATES';
  }

  // 3. ACCIDENTES
  if (
    text.includes('choque') ||
    text.includes('colision') ||
    text.includes('accidente') ||
    text.includes('despiste') ||
    text.includes('vuelco') ||
    text.includes('volcamiento') ||
    text.includes('transito') ||
    text.includes('vial') ||
    text.includes('vehiculo') ||
    text.includes('auto') ||
    text.includes('moto') ||
    text.includes('camion') ||
    text.includes('colectivo')
  ) {
    return 'ACCIDENTES';
  }

  // 4. MATERIALES PELIGROSOS (HAZMAT)
  if (
    text.includes('gas') ||
    text.includes('fuga') ||
    text.includes('derrame') ||
    text.includes('quimico') ||
    text.includes('hazmat') ||
    text.includes('matpel') ||
    text.includes('explosiv') ||
    text.includes('combustible') ||
    text.includes('nafta') ||
    text.includes('toxico')
  ) {
    return 'MAT-PEL (HAZMAT)';
  }

  // 5. SERVICIOS Y PREVENCIÓN
  if (
    text.includes('limpieza') ||
    text.includes('arbol') ||
    text.includes('calzada') ||
    text.includes('abastecimiento') ||
    text.includes('agua') ||
    text.includes('cable') ||
    text.includes('prevencion') ||
    text.includes('capacitacion') ||
    text.includes('simulacro') ||
    text.includes('inspeccion') ||
    text.includes('seguridad') ||
    text.includes('guardia') ||
    text.includes('prueba') ||
    text.includes('test') ||
    text.includes('live') ||
    text.includes('modal') ||
    text.includes('rkt') ||
    text.includes('creado desde')
  ) {
    return 'SERVICIOS';
  }

  // 6. OTROS (incluye médicas, incidentes generales, etc.)
  return 'OTROS';
}

// Helper: mapea el tipo de emergencia a un icono de MaterialCommunityIcons
function getTipoIcon(tipo) {
  const config = CATEGORIAS_CONFIG[tipo];
  return config ? config.icon : 'alert-circle';
}

export default function EstadisticasScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, logout } = useAuth();
  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => logout(), style: "destructive" },
      ]
    );
  };

  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth());
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());
  const [mesModalVisible, setMesModalVisible] = useState(false);
  const [anioModalVisible, setAnioModalVisible] = useState(false);
  const [chartView, setChartView] = useState('bar'); // 'bar' | 'pie' | 'list'

  // States for fetched datasets
  const [alerts, setAlerts] = useState([]);

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

      // 1. Fetch Alerts in range
      try {
        const resAlerts = await axios.get(`${API_BASE_URL}/alerta/rango`, {
          headers,
          params: { fecha_desde: desde, fecha_hasta: hasta },
          timeout: 5000
        });
        const data = resAlerts.data;
        alertsData = Array.isArray(data?.alertas) ? data.alertas : Array.isArray(data) ? data : [];
      } catch (err) {
        console.log('Error loading range alerts:', err?.message || err);
      }

      setAlerts(alertsData);

      // Compute statistics by type
      const counts = {};
      alertsData.forEach(a => {
        const cleanType = extraerTipoAlerta(a);
        counts[cleanType] = (counts[cleanType] || 0) + 1;
      });

      // Sort the counts object by value descending
      const sortedCounts = {};
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, val]) => {
          sortedCounts[key] = val;
        });

      setStatsTipos(sortedCounts);

      // 2. Fetch monthly firefighter statistics from the backend metrics endpoint (avoids N+1 query loop)
      let mappedParticipation = [];
      try {
        const resMetricas = await axios.get(`${API_BASE_URL}/metricas/mensuales`, {
          headers,
          params: { mes: selectedMes + 1, anio: selectedAnio },
          timeout: 5000
        });

        const bomberosMetricas = resMetricas.data?.bomberos || [];
        mappedParticipation = bomberosMetricas.map(b => ({
          id: b.usuario_id,
          nombre: `${b.nombre} ${b.apellido || ''}`.trim().toUpperCase(),
          asistencias: b.total_asistencias,
          horas: b.total_horas
        }));
      } catch (err) {
        console.log('Error loading monthly metrics:', err?.message || err);
      }

      // Sort by assistances descending
      mappedParticipation.sort((a, b) => b.asistencias - a.asistencias || b.horas - a.horas);
      setParticipationList(mappedParticipation);

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
      const filename = `Participacion_${nombreMes}_${selectedAnio}.csv`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: `Exportar Estadísticas`,
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

    const totalAcceptedResponses = participationList.reduce((sum, b) => sum + b.asistencias, 0);
    const avgResponders = totalEmergencias > 0
      ? (totalAcceptedResponses / totalEmergencias).toFixed(1)
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
  }, [alerts, participationList]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
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
          <Text style={styles.headerTitle}>ESTADÍSTICAS</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity style={styles.exportBtn} onPress={exportarCSV}>
            <MaterialCommunityIcons name="file-export" size={20} color="#fff" />
            <Text style={styles.exportBtnText}>EXPORTAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundColor: '#1f2937',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#e11d48" />
          </TouchableOpacity>
        </View>
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
                      labels: Object.keys(statsTipos).map(tipo => {
                        const config = CATEGORIAS_CONFIG[tipo] || CATEGORIAS_CONFIG['OTROS'];
                        return config.label;
                      }),
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
                    verticalLabelRotation={0}
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
                    data={Object.entries(statsTipos).map(([tipo, count]) => {
                      const config = CATEGORIAS_CONFIG[tipo] || CATEGORIAS_CONFIG['OTROS'];
                      return {
                        name: config.label,
                        population: count,
                        color: config.color,
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
                  {Object.entries(statsTipos).map(([tipo, count]) => {
                    const total = alerts.length;
                    const percentage = total > 0 ? (count / total) * 100 : 0;

                    const config = CATEGORIAS_CONFIG[tipo] || CATEGORIAS_CONFIG['OTROS'];
                    const color = config.color;
                    const iconName = config.icon;

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
};

