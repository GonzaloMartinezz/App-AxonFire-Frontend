import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../theme';
import StatusBadge from '../components/StatusBadge';
import TacticalCard from '../components/TacticalCard';

// Mock data
const ACTIVE_ALERTS = [
  {
    id: '1',
    type: 'Incendio Estructural',
    severity: 'critica',
    address: 'Av. Corrientes 1500, CABA',
    units: 'Unidades E-12, L-04 En Ruta',
    timeAgo: '02 min',
    image: 'https://images.unsplash.com/photo-1486551937199-baf066858de7?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    type: 'Rescate Vehicular',
    severity: 'alta',
    address: 'Autopista 25 de Mayo, Km 3',
    units: 'Colisión múltiple / Atrapamiento',
    timeAgo: '17 min',
    icon: 'car-wrench',
  },
  {
    id: '3',
    type: 'Fuga de Gas',
    severity: 'alta',
    status: 'progreso',
    address: 'Calle Juramento 2800',
    timeAgo: '17 min',
    icon: 'gas-cylinder',
  },
];

const NEARBY_UNITS = [
  { name: 'MOTOR 104', status: 'Listo', statusColor: Colors.success },
  { name: 'CAMIÓN 22', status: 'Activo', statusColor: Colors.primary },
];

const FILTERS = ['Activas', 'Todas', 'Resueltas'];

export default function AlertsScreen() {
  const [activeFilter, setActiveFilter] = useState('Activas');
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="fire-extinguisher" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>AXON FIRE</Text>
        </View>
        <TouchableOpacity style={styles.emergencyBtn}>
          <MaterialCommunityIcons name="asterisk" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section Title ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.overline}>CENTRO DE EMERGENCIAS</Text>
          <Text style={styles.sectionTitle}>Alertas</Text>
        </View>

        {/* ── Filter Pills ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                  {f}
                </Text>
                {f === 'Activas' && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>3</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ── Alert Cards ── */}
        {ACTIVE_ALERTS.map((alert, idx) => (
          <TacticalCard key={alert.id} elevated>
            {idx === 0 && <View style={styles.ambientGlow} />}

            <View style={styles.cardTop}>
              <View style={styles.badgeRow}>
                <StatusBadge severity={alert.severity} />
                {alert.status && <StatusBadge severity={alert.status} />}
              </View>
              <Text style={styles.timeAgo}>{alert.timeAgo}</Text>
            </View>

            <Text style={styles.alertTitle} numberOfLines={2}>{alert.type}</Text>

            {alert.image ? (
              <View style={styles.alertBody}>
                <Image source={{ uri: alert.image }} style={styles.alertImage} />
                <View style={styles.alertDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="location-on" size={13} color={Colors.onSurfaceVariant} />
                    <Text style={styles.detailText} numberOfLines={1}>{alert.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="account-group" size={13} color={Colors.onSurfaceVariant} />
                    <Text style={styles.detailText} numberOfLines={1}>{alert.units}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.alertBodyCompact}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name={alert.icon || 'alert'} size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTextBold} numberOfLines={1}>{alert.address}</Text>
                  <Text style={styles.detailTextSub} numberOfLines={1}>{alert.units}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
              </View>
            )}

            {idx === 0 && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={{ flex: 1 }}>
                  <LinearGradient
                    colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.respondBtn}
                  >
                    <Text style={styles.respondText}>RESPONDER</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareBtn}>
                  <MaterialIcons name="share" size={18} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            )}
          </TacticalCard>
        ))}

        {/* ── Empty State ── */}
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="clock-outline" size={28} color={Colors.surfaceContainerHighest} />
          <Text style={styles.emptyText}>SIN ALERTAS ADICIONALES</Text>
        </View>

        {/* ── Nearby Units ── */}
        <Text style={styles.sectionLabel}>UNIDADES CERCANAS</Text>
        <View style={styles.unitsGrid}>
          {NEARBY_UNITS.map((unit) => (
            <View key={unit.name} style={styles.unitCard}>
              <View style={[styles.statusDot, { backgroundColor: unit.statusColor }]} />
              <View>
                <Text style={styles.unitName}>{unit.name}</Text>
                <Text style={styles.unitStatus}>{unit.status}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: Colors.onSurface,
    textTransform: 'uppercase',
  },
  emergencyBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  overline: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: Colors.onSurface,
  },
  filterScroll: {
    marginBottom: Spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 3,
    borderRadius: 9999,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  filterPillActive: {
    backgroundColor: Colors.inverseSurface,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  filterTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: Colors.primary,
    marginLeft: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: '100%',
    opacity: 0.05,
    backgroundColor: Colors.primary,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    flex: 1,
  },
  timeAgo: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.15,
    color: Colors.onSurface,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  alertBody: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  alertImage: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
  },
  alertDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  alertBodyCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xl,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextBold: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  detailTextSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  respondBtn: {
    paddingVertical: 12,
    borderRadius: Radius.xl,
    alignItems: 'center',
  },
  respondText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  shareBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: Radius.xxl,
    borderWidth: 2,
    borderColor: Colors.surfaceContainerHighest,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  emptyText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 6,
  },
  sectionLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.sm,
  },
  unitsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  unitCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    padding: Spacing.md,
    borderRadius: Radius.xxl,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  unitName: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.onSurface,
    textTransform: 'uppercase',
  },
  unitStatus: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSecondaryContainer,
    textTransform: 'uppercase',
    marginTop: 1,
  },
});
