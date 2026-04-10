import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../theme';
import TacticalCard from '../components/TacticalCard';
import StatusBadge from '../components/StatusBadge';

const REINFORCEMENTS = [
  { icon: 'water', label: 'CISTERNA', color: Colors.alertBlue },
  { icon: 'gas-station', label: 'COMBUSTIBLE', color: Colors.warningOrange },
  { icon: 'ambulance', label: 'AMBULANCIA', color: Colors.primary },
  { icon: 'hammer-wrench', label: 'RESCATE', color: Colors.secondary },
];

const PENDING_REQUESTS = [
  {
    icon: 'ambulance',
    iconColor: Colors.primary,
    title: 'Ambulancia B-12',
    subtitle: 'DESPACHADA · 4 MIN',
    status: 'done',
  },
  {
    icon: 'water',
    iconColor: Colors.alertBlue,
    title: 'Cisterna de Agua',
    subtitle: 'ESPERANDO APROBACIÓN',
    status: 'pending',
  },
];

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="fire-extinguisher" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>AXON FIRE</Text>
        </View>
        <TouchableOpacity style={styles.emergencyBtn}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Centro Logístico</Text>
        <Text style={styles.pageSubtitle}>SECTOR 4-ALPHA / RESPONDEDOR 102</Text>

        {/* ── Current Task ── */}
        <View style={styles.taskRow}>
          <View style={styles.taskCard}>
            <Text style={styles.taskLabel}>TAREA ACTUAL</Text>
            <Text style={styles.taskTitle}>Contención de{'\n'}Perímetro</Text>
            <View style={styles.trackingRow}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingText}>RASTREO ACTIVO</Text>
            </View>
          </View>
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>TIEMPO</Text>
            <Text style={styles.timeValue}>08:42</Text>
          </View>
        </View>

        {/* ── Reinforcements ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>REFUERZOS</Text>
          <StatusBadge severity="critica" label="PRIORIDAD" />
        </View>

        <View style={styles.reinforcementGrid}>
          {REINFORCEMENTS.map((item) => (
            <TouchableOpacity key={item.label} style={styles.reinforcementCard}>
              <View style={[styles.reinforcementIcon, { backgroundColor: `${item.color}15` }]}>
                <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.reinforcementLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Request Button ── */}
        <TouchableOpacity style={{ marginTop: Spacing.lg }}>
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.requestBtn}
          >
            <MaterialCommunityIcons name="account-plus" size={22} color="#fff" />
            <Text style={styles.requestText}>SOLICITAR PERSONAL</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Pending Requests ── */}
        <Text style={styles.pendingTitle}>SOLICITUDES PENDIENTES</Text>
        {PENDING_REQUESTS.map((req, idx) => (
          <TacticalCard key={idx}>
            <View style={styles.requestRow}>
              <View style={[styles.requestIcon, { backgroundColor: `${req.iconColor}15` }]}>
                <MaterialCommunityIcons name={req.icon} size={20} color={req.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.requestTitle} numberOfLines={1}>{req.title}</Text>
                <Text style={styles.requestSub}>{req.subtitle}</Text>
              </View>
              {req.status === 'done' ? (
                <MaterialIcons name="check-circle" size={22} color={Colors.success} />
              ) : (
                <MaterialCommunityIcons name="sync" size={18} color={Colors.onSurfaceVariant} />
              )}
            </View>
          </TacticalCard>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16, fontWeight: '900', letterSpacing: -0.5,
    color: Colors.onSurface, textTransform: 'uppercase',
  },
  emergencyBtn: {
    width: 36, height: 36, borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  pageTitle: {
    fontSize: 26, fontWeight: '900', letterSpacing: -0.4,
    color: Colors.onSurface, marginBottom: 3,
  },
  pageSubtitle: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1.2,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase',
    marginBottom: Spacing.lg,
  },
  taskRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  taskCard: {
    flex: 2, backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.xxl, padding: Spacing.md,
  },
  taskLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 14, fontWeight: '800', color: Colors.onSurface,
    lineHeight: 20, marginBottom: Spacing.xs,
  },
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trackingDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary,
  },
  trackingText: {
    fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 0.4,
  },
  timeCard: {
    flex: 1, backgroundColor: Colors.inverseSurface,
    borderRadius: Radius.xxl, padding: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1,
    color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase',
    marginBottom: 3,
  },
  timeValue: {
    fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    color: Colors.onSurface, textTransform: 'uppercase',
  },
  reinforcementGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  reinforcementCard: {
    width: '48%', backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.xxl, paddingVertical: Spacing.lg,
    alignItems: 'center', gap: 8,
  },
  reinforcementIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  reinforcementLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.6,
    color: Colors.onSurface, textTransform: 'uppercase',
  },
  requestBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: Radius.xxl,
    boxShadow: '0px 6px 16px rgba(175,16,26,0.3)',
    elevation: 8,
  },
  requestText: {
    color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.6,
  },
  pendingTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    color: Colors.onSurface, textTransform: 'uppercase',
    marginTop: Spacing.xl, marginBottom: Spacing.md,
  },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  requestIcon: {
    width: 38, height: 38, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  requestTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.onSurface,
  },
  requestSub: {
    fontSize: 9, fontWeight: '800', letterSpacing: 0.8,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase',
    marginTop: 1,
  },
});
