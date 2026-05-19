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
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import TacticalCard from '../components/TacticalCard';
import StatusBadge from '../components/StatusBadge';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
const screenWidth = Dimensions.get('window').width;

// ── Helpers ──────────────────────────────────────────────────────────────────

function clasificarEstado(nombreEstado = '') {
  const e = nombreEstado.toLowerCase();
  if (e.includes('activ')) return 'activa';
  if (e.includes('despach')) return 'despachada';
  if (e.includes('progreso') || e.includes('curso')) return 'progreso';
  if (e.includes('resuel') || e.includes('cerrad')) return 'resuelta';
  return 'activa';
}

function clasificarPrioridad(prioridad = '') {
  const p = String(prioridad).toLowerCase();
  if (p === '1' || p.includes('critica') || p.includes('crítica')) return 'critica';
  if (p === '2' || p.includes('alta')) return 'alta';
  if (p === '3' || p.includes('media')) return 'media';
  return 'baja';
}

function tiempoTranscurrido(fechaISO) {
  if (!fechaISO) return '';
  const min = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const hs = Math.floor(min / 60);
  if (hs < 24) return `Hace ${hs} hs`;
  return `Hace ${Math.floor(hs / 24)} días`;
}

// Group alerts by week for line chart
function agruparPorSemana(clasificadas) {
  const now = Date.now();
  const weeks = [0, 0, 0, 0]; // 4 weeks: current, -1, -2, -3
  clasificadas.forEach(a => {
    if (!a.fecha) return;
    const diff = now - new Date(a.fecha).getTime();
    const weekIdx = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    if (weekIdx >= 0 && weekIdx < 4) weeks[weekIdx]++;
  });
  return weeks.reverse(); // oldest first
}

// ── Chart configuration ──────────────────────────────────────────────────────

const chartConfig = {
  backgroundColor: Colors.surfaceContainerLowest || '#fafafa',
  backgroundGradientFrom: Colors.surfaceContainerLowest || '#fafafa',
  backgroundGradientTo: Colors.surface || '#fff',
  decimalCount: 0,
  color: (opacity = 1) => `rgba(175, 16, 26, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(38, 50, 56, ${opacity})`,
  style: { borderRadius: 12 },
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: '#af101a',
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#e8eaed',
    strokeWidth: 1,
  },
  barPercentage: 0.6,
};

// ── Component ────────────────────────────────────────────────────────────────

export default function PanelControlScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const token = user?.token || '';

  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(false);

  async function cargarDatos(esRefresh = false) {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);
    setError(null);

    try {
      const hasta = new Date().toISOString();
      const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const res = await fetch(`${API_BASE_URL}/alerta/rango`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fecha_desde: desde, fecha_hasta: hasta }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();

      setAlertas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando datos del panel:', err);
      setError('No se pudo conectar al servidor.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  // ── Cálculo de estadísticas ───────────────────────────────────────────────

  const clasificadas = alertas.map((a) => ({
    estado: clasificarEstado(a.estadoAlerta?.nombre || a.estado || ''),
    prioridad: clasificarPrioridad(a.prioridad || a.subCategoriaAlerta?.prioridad || ''),
    tipo: a.subCategoriaAlerta?.nombre || a.tipo || 'Sin tipo',
    fecha: a.fecha_hora,
  }));

  const totalAlertas = clasificadas.length;
  const cantActivas = clasificadas.filter(a => a.estado === 'activa' || a.estado === 'progreso').length;
  const cantDespachadas = clasificadas.filter(a => a.estado === 'despachada').length;
  const cantResueltas = clasificadas.filter(a => a.estado === 'resuelta').length;
  const cantCriticas = clasificadas.filter(a => a.prioridad === 'critica').length;
  const cantAltas = clasificadas.filter(a => a.prioridad === 'alta').length;
  const cantMedias = clasificadas.filter(a => a.prioridad === 'media').length;
  const cantBajas = clasificadas.filter(a => a.prioridad === 'baja').length;

  const ultimasAlertas = [...clasificadas]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  // ── Chart data ────────────────────────────────────────────────────────────

  const barData = {
    labels: ['Activas', 'Despach.', 'Resueltas'],
    datasets: [{
      data: [cantActivas, cantDespachadas, cantResueltas],
    }],
  };

  const pieData = [
    { name: 'Críticas', population: cantCriticas || 0, color: '#af101a', legendFontColor: '#263238', legendFontSize: 11 },
    { name: 'Altas', population: cantAltas || 0, color: '#f97316', legendFontColor: '#263238', legendFontSize: 11 },
    { name: 'Medias', population: cantMedias || 0, color: '#eab308', legendFontColor: '#263238', legendFontSize: 11 },
    { name: 'Bajas', population: cantBajas || 0, color: '#94a3b8', legendFontColor: '#263238', legendFontSize: 11 },
  ];

  // Filter out zero-population segments to avoid render issues
  const filteredPieData = pieData.filter(d => d.population > 0);
  // If all are 0, show a placeholder
  const pieDataToRender = filteredPieData.length > 0 ? filteredPieData : [
    { name: 'Sin datos', population: 1, color: '#e0e0e0', legendFontColor: '#94a3b8', legendFontSize: 11 },
  ];

  const weeklyTrend = agruparPorSemana(clasificadas);
  const lineData = {
    labels: ['Sem -3', 'Sem -2', 'Sem -1', 'Actual'],
    datasets: [{
      data: weeklyTrend.every(v => v === 0) ? [0, 0, 0, 0] : weeklyTrend,
      color: (opacity = 1) => `rgba(175, 16, 26, ${opacity})`,
      strokeWidth: 3,
    }],
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────

  const exportarCSV = async () => {
    setExportando(true);
    try {
      const header = 'Tipo,Estado,Prioridad,Fecha\n';
      const rows = clasificadas.map(a => {
        const fecha = a.fecha ? new Date(a.fecha).toLocaleDateString('es-AR') : '';
        return `"${a.tipo}","${a.estado}","${a.prioridad}","${fecha}"`;
      }).join('\n');
      const csv = header + rows;

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alertas_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const path = FileSystem.cacheDirectory + `alertas_${Date.now()}.csv`;
        await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Exportar Alertas' });
        } else {
          Alert.alert('Archivo generado', `Guardado en: ${path}`);
        }
      }
    } catch (err) {
      console.error('Error exporting CSV:', err);
      if (Platform.OS === 'web') {
        alert('No se pudo exportar los datos.');
      } else {
        Alert.alert('Error', 'No se pudo exportar los datos.');
      }
    } finally {
      setExportando(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  const chartWidth = screenWidth - (Spacing.lg * 2) - 32; // account for padding

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#263238" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Panel de Control</Text>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={exportarCSV}
          disabled={exportando || cargando}
        >
          {exportando ? (
            <ActivityIndicator size="small" color="#af101a" />
          ) : (
            <MaterialCommunityIcons name="download" size={20} color="#af101a" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargarDatos(true)}
            colors={['#af101a']}
            tintColor="#af101a"
          />
        }
      >
        {cargando ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color="#af101a" />
            <Text style={styles.textoCarga}>Cargando datos...</Text>
          </View>
        ) : error ? (
          <View style={styles.centrado}>
            <MaterialCommunityIcons name="wifi-off" size={48} color="#cfd8dc" />
            <Text style={styles.textoCarga}>{error}</Text>
            <TouchableOpacity style={styles.botonReintentar} onPress={() => cargarDatos()}>
              <Text style={styles.textoReintentar}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Stat grande: total de alertas ───────────────────────────── */}
            <TacticalCard elevated>
              <Text style={styles.labelStat}>ALERTAS ÚLTIMOS 30 DÍAS</Text>
              <Text style={styles.numeroGrande}>{totalAlertas}</Text>
            </TacticalCard>

            {/* ── Stats por estado ──────────────────────────────────────── */}
            <Text style={styles.tituloSeccion}>POR ESTADO</Text>
            <View style={styles.grilla}>
              <View style={[styles.cardStat, { backgroundColor: '#fce4ec' }]}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#af101a" />
                <Text style={[styles.statNumero, { color: '#af101a' }]}>{cantActivas}</Text>
                <Text style={styles.statLabel}>Activas</Text>
              </View>
              <View style={[styles.cardStat, { backgroundColor: '#e3f2fd' }]}>
                <MaterialCommunityIcons name="truck-delivery" size={24} color="#1976d2" />
                <Text style={[styles.statNumero, { color: '#1976d2' }]}>{cantDespachadas}</Text>
                <Text style={styles.statLabel}>Despachadas</Text>
              </View>
              <View style={[styles.cardStat, { backgroundColor: '#e8f5e9' }]}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#388e3c" />
                <Text style={[styles.statNumero, { color: '#388e3c' }]}>{cantResueltas}</Text>
                <Text style={styles.statLabel}>Resueltas</Text>
              </View>
              <View style={[styles.cardStat, { backgroundColor: '#f1f5f9' }]}>
                <MaterialCommunityIcons name="clipboard-list" size={24} color="#64748b" />
                <Text style={[styles.statNumero, { color: '#64748b' }]}>{totalAlertas}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {/* ── Bar Chart: por estado ────────────────────────────────── */}
            <Text style={styles.tituloSeccion}>DISTRIBUCIÓN POR ESTADO</Text>
            <TacticalCard elevated>
              <BarChart
                data={barData}
                width={chartWidth}
                height={200}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(175, 16, 26, ${opacity})`,
                  fillShadowGradientFrom: '#af101a',
                  fillShadowGradientTo: '#af101a',
                  fillShadowGradientOpacity: 0.8,
                }}
                style={styles.chartStyle}
                fromZero
                showValuesOnTopOfBars
                withInnerLines={false}
              />
            </TacticalCard>

            {/* ── Stats por severidad ──────────────────────────────────── */}
            <Text style={styles.tituloSeccion}>POR SEVERIDAD</Text>
            <TacticalCard elevated>
              <View style={styles.filaSeveridad}>
                <View style={styles.itemSeveridad}>
                  <View style={[styles.punto, { backgroundColor: '#af101a' }]} />
                  <Text style={styles.severidadNumero}>{cantCriticas}</Text>
                  <Text style={styles.severidadLabel}>Críticas</Text>
                </View>
                <View style={styles.separador} />
                <View style={styles.itemSeveridad}>
                  <View style={[styles.punto, { backgroundColor: '#f97316' }]} />
                  <Text style={styles.severidadNumero}>{cantAltas}</Text>
                  <Text style={styles.severidadLabel}>Altas</Text>
                </View>
                <View style={styles.separador} />
                <View style={styles.itemSeveridad}>
                  <View style={[styles.punto, { backgroundColor: '#eab308' }]} />
                  <Text style={styles.severidadNumero}>{cantMedias}</Text>
                  <Text style={styles.severidadLabel}>Medias</Text>
                </View>
                <View style={styles.separador} />
                <View style={styles.itemSeveridad}>
                  <View style={[styles.punto, { backgroundColor: '#94a3b8' }]} />
                  <Text style={styles.severidadNumero}>{cantBajas}</Text>
                  <Text style={styles.severidadLabel}>Bajas</Text>
                </View>
              </View>
            </TacticalCard>

            {/* ── Pie Chart: distribución por severidad ────────────────── */}
            <TacticalCard elevated>
              <Text style={styles.chartLabel}>DISTRIBUCIÓN DE SEVERIDAD</Text>
              <PieChart
                data={pieDataToRender}
                width={chartWidth}
                height={180}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
                style={styles.chartStyle}
              />
            </TacticalCard>

            {/* ── Line Chart: tendencia semanal ────────────────────────── */}
            <Text style={styles.tituloSeccion}>TENDENCIA SEMANAL</Text>
            <TacticalCard elevated>
              <Text style={styles.chartLabel}>ALERTAS POR SEMANA (ÚLTIMOS 30 DÍAS)</Text>
              <LineChart
                data={lineData}
                width={chartWidth}
                height={200}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(175, 16, 26, ${opacity})`,
                }}
                bezier
                style={styles.chartStyle}
                fromZero
                withInnerLines
                withDots
                withShadow={false}
              />
            </TacticalCard>

            {/* ── Export button ──────────────────────────────────────────── */}
            <TouchableOpacity
              style={styles.exportFullBtn}
              onPress={exportarCSV}
              disabled={exportando}
              activeOpacity={0.7}
            >
              {exportando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="download" size={18} color="#fff" />
                  <Text style={styles.exportFullBtnText}>EXPORTAR DATOS (CSV)</Text>
                </>
              )}
            </TouchableOpacity>

            {/* ── Últimas alertas ──────────────────────────────────────── */}
            <Text style={styles.tituloSeccion}>ACTIVIDAD RECIENTE</Text>
            {ultimasAlertas.length === 0 ? (
              <Text style={styles.textoVacio}>Sin actividad registrada</Text>
            ) : (
              ultimasAlertas.map((a, idx) => (
                <TacticalCard key={idx}>
                  <View style={styles.filaActividad}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                        <StatusBadge severity={a.prioridad} />
                        <StatusBadge severity={a.estado} />
                      </View>
                      <Text style={styles.textoActividad} numberOfLines={1}>{a.tipo}</Text>
                    </View>
                    <Text style={styles.tiempoActividad}>{tiempoTranscurrido(a.fecha)}</Text>
                  </View>
                </TacticalCard>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  botonVolver: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  tituloHeader: { fontSize: 17, fontWeight: '800', color: Colors.onSurface },
  exportBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },

  contenido: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  centrado: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  textoCarga: { fontSize: 14, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },
  botonReintentar: {
    marginTop: 8, backgroundColor: '#263238',
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12,
  },
  textoReintentar: { color: '#fff', fontWeight: '700', fontSize: 14 },

  labelStat: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 4,
  },
  numeroGrande: {
    fontSize: 48, fontWeight: '900', color: Colors.onSurface, letterSpacing: -1,
  },

  tituloSeccion: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    color: Colors.onSurface, textTransform: 'uppercase',
    marginTop: Spacing.lg, marginBottom: Spacing.md,
  },

  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardStat: {
    width: '48%', borderRadius: Radius.xxl, padding: Spacing.lg,
    alignItems: 'center', gap: 6,
  },
  statNumero: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: {
    fontSize: 10, fontWeight: '700', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },

  filaSeveridad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  itemSeveridad: { alignItems: 'center', flex: 1, gap: 4 },
  punto: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  severidadNumero: { fontSize: 22, fontWeight: '900', color: Colors.onSurface },
  severidadLabel: {
    fontSize: 10, fontWeight: '700', color: '#90a4ae',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  separador: { width: 1, height: 36, backgroundColor: Colors.surfaceContainerLow },

  filaActividad: { flexDirection: 'row', alignItems: 'center' },
  textoActividad: { fontSize: 13, fontWeight: '700', color: Colors.onSurface },
  tiempoActividad: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  textoVacio: { fontSize: 13, color: '#94a3b8', fontWeight: '600', textAlign: 'center', paddingVertical: 20 },

  // Charts
  chartStyle: {
    borderRadius: 12,
    marginVertical: 4,
  },
  chartLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase',
    marginBottom: 8,
  },

  // Export button
  exportFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#263238',
    paddingVertical: 14,
    borderRadius: Radius.xl,
    marginTop: Spacing.lg,
  },
  exportFullBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
