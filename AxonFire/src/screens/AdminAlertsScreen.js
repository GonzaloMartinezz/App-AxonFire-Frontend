import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminAlertsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const confirmLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => navigation.replace('Login'), style: 'destructive' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#16181d" />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
           <Image source={{ uri: 'https://randomuser.me/api/portraits/men/41.jpg' }} style={styles.avatarTop} />
           <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('MainApp')}>
            <MaterialCommunityIcons name="monitor-dashboard" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={confirmLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <Text style={styles.mainTitle}>CONFIGURACIÓN DE{'\n'}EMERGENCIAS</Text>
        <Text style={styles.descText}>
          Panel de administración de protocolos y tipos de alerta
        </Text>

        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons name="bell-ring" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Configurar Nueva Alerta</Text>
        </TouchableOpacity>

        {/* Active Protocols */}
        <View style={styles.protocolCardRed}>
          <View style={styles.protocolHeader}>
            <View style={styles.activeBadgeRed}>
              <Text style={styles.activeBadgeTextRed}>ACTIVO</Text>
            </View>
            <MaterialCommunityIcons name="fire" size={20} color="#fca5a5" />
          </View>
          <Text style={styles.protocolTitle}>Incendio Estructural</Text>
          <Text style={styles.protocolDesc}>
            Protocolo estándar para incendios en zonas urbanas y edificios industriales.
          </Text>
          <View style={styles.protocolTags}>
            <View style={styles.tagDark}><Text style={styles.tagTextWhite}>Nivel 4</Text></View>
            <View style={styles.tagDark}><Text style={styles.tagTextWhite}>Prioridad Alta</Text></View>
          </View>
        </View>

        <View style={styles.protocolCardBlue}>
          <View style={styles.protocolHeader}>
            <View style={styles.activeBadgeBlue}>
              <Text style={styles.activeBadgeTextBlue}>ACTIVO</Text>
            </View>
            <MaterialCommunityIcons name="medical-bag" size={20} color="#3b82f6" />
          </View>
          <Text style={styles.protocolTitle}>Rescate y Salvamento</Text>
          <Text style={styles.protocolDesc}>
            Operaciones de extracción y primeros auxilios avanzados en accidentes.
          </Text>
          <View style={styles.protocolTags}>
            <View style={styles.tagDark}><Text style={styles.tagTextWhite}>Nivel 3</Text></View>
            <View style={styles.tagDark}><Text style={styles.tagTextWhite}>Prioridad Beta</Text></View>
          </View>
        </View>

        {/* Protocolos de Respuesta Table */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>PROTOCOLOS DE RESPUESTA</Text>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol1, styles.tableHeaderText]}>EVENTO</Text>
            <Text style={[styles.tableCol2, styles.tableHeaderText]}>TIEMPO{'\n'}RESPUESTA</Text>
            <Text style={[styles.tableCol3, styles.tableHeaderText]}>UNIDADES{'\n'}MIN.</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCol1, styles.tableRowTitle]}>Fuga de{'\n'}Gas GLP</Text>
            <Text style={[styles.tableCol2, styles.tableRowCode]}>30:04:30</Text>
            <Text style={[styles.tableCol3, styles.tableRowDesc]}>2 Vehículos{'\n'}+ HAZMAT</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCol1, styles.tableRowTitle]}>Accidente{'\n'}Vehicular</Text>
            <Text style={[styles.tableCol2, styles.tableRowCode]}>30:06:00</Text>
            <Text style={[styles.tableCol3, styles.tableRowDesc]}>1 Rescate +{'\n'}1 Ambulancia</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCol1, styles.tableRowTitle]}>Incendio{'\n'}Forestal</Text>
            <Text style={[styles.tableCol2, styles.tableRowCode]}>30:15:00</Text>
            <Text style={[styles.tableCol3, styles.tableRowDesc]}>4 Vehículos{'\n'}Forestales</Text>
          </View>
        </View>

        {/* Estadísticas Mensuales */}
        <View style={styles.sectionContainer}>
          <View style={styles.statsHeaderRow}>
            <Text style={styles.sectionLabel}>ESTADÍSTICAS MENSUALES</Text>
            <View style={styles.chartIconBox}>
              <MaterialCommunityIcons name="chart-bar" size={20} color="#64748b" />
            </View>
          </View>

          <View style={styles.bigStatsRow}>
            <Text style={styles.bigStatNum}>42</Text>
            <Text style={styles.bigStatLabel}>EMERGENCIAS TOTALES</Text>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barHeader}>
              <Text style={styles.barTitle}>INCENDIOS</Text>
              <Text style={styles.barPercentRed}>65%</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: '65%', backgroundColor: '#dc2626' }]} />
            </View>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barHeader}>
              <Text style={styles.barTitle}>RESCATE</Text>
              <Text style={styles.barPercentBlue}>35%</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: '35%', backgroundColor: '#3b82f6' }]} />
            </View>
          </View>
        </View>

        {/* Niveles de Severidad */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { marginBottom: 16 }]}>NIVELES DE SEVERIDAD</Text>

          <View style={styles.severityItem}>
             <View style={styles.severityLeftRed} />
             <View style={styles.severityBadgeRed}><Text style={styles.severityBadgeTextRed}>S5</Text></View>
             <View>
               <Text style={styles.severityTitle}>CRÍTICO / DESASTRE</Text>
               <Text style={styles.severityDesc}>Movilización total de recursos</Text>
             </View>
          </View>

          <View style={styles.severityItem}>
             <View style={styles.severityLeftYellow} />
             <View style={styles.severityBadgeYellow}><Text style={styles.severityBadgeTextYellow}>S3</Text></View>
             <View>
               <Text style={styles.severityTitle}>MODERADO / ALERTA</Text>
               <Text style={styles.severityDesc}>Respuesta de zona local</Text>
             </View>
          </View>

          <View style={styles.severityItem}>
             <View style={styles.severityLeftGreen} />
             <View style={styles.severityBadgeGreen}><Text style={styles.severityBadgeTextGreen}>S1</Text></View>
             <View>
               <Text style={styles.severityTitle}>INFORMATIVO</Text>
               <Text style={styles.severityDesc}>Monitoreo preventivo</Text>
             </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

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
  avatarTop: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  topBarTitle: {
    color: '#e11d48',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
    lineHeight: 30,
    marginBottom: 8,
  },
  descText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    gap: 8,
    marginBottom: 32,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  protocolCardRed: {
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    padding: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#dc2626',
    marginBottom: 16,
  },
  protocolCardBlue: {
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    padding: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#3b82f6',
    marginBottom: 32,
  },
  protocolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeBadgeRed: {
    backgroundColor: '#451a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeTextRed: {
    color: '#fca5a5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeBadgeBlue: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeTextBlue: {
    color: '#93c5fd',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  protocolTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  protocolDesc: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
  },
  protocolTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tagDark: {
    backgroundColor: '#26282f',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  tagTextWhite: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: '800',
  },
  sectionContainer: {
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionLink: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '800',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
    paddingBottom: 8,
    marginBottom: 16,
  },
  tableHeaderText: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tableCol1: { flex: 2 },
  tableCol2: { flex: 2 },
  tableCol3: { flex: 3 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tableRowTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
  },
  tableRowCode: {
    color: '#cbd5e1',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tableRowDesc: {
    color: '#f8fafc',
    fontSize: 11,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartIconBox: {
    backgroundColor: '#26282f',
    padding: 6,
    borderRadius: 4,
  },
  bigStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  bigStatNum: {
    color: '#dc2626',
    fontSize: 40,
    fontWeight: '900',
  },
  bigStatLabel: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  barItem: {
    marginBottom: 16,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  barTitle: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  barPercentRed: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '800',
  },
  barPercentBlue: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: '800',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  severityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26282f',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  severityLeftRed: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#dc2626',
  },
  severityLeftYellow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#eab308',
  },
  severityLeftGreen: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#22c55e',
  },
  severityBadgeRed: {
    backgroundColor: '#451a1a',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 12,
  },
  severityBadgeTextRed: { color: '#fca5a5', fontSize: 10, fontWeight: '800' },
  severityBadgeYellow: {
    backgroundColor: '#422006',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 12,
  },
  severityBadgeTextYellow: { color: '#fde047', fontSize: 10, fontWeight: '800' },
  severityBadgeGreen: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 12,
  },
  severityBadgeTextGreen: { color: '#34d399', fontSize: 10, fontWeight: '800' },
  severityTitle: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  severityDesc: {
    color: '#94a3b8',
    fontSize: 9,
  }
});
