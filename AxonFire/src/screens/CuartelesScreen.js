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
import { Colors, Typography, Spacing, Radius } from '../theme';
import TacticalCard from '../components/TacticalCard';

const STATS = [
  { value: '3', label: 'Operativos', color: Colors.success },
  { value: '1', label: 'En Servicio', color: Colors.warningOrange },
  { value: '5', label: 'Total', color: Colors.onSurface },
];

const CUARTELES = [
  {
    name: 'Cuartel Central Nº1',
    status: 'Operativo',
    statusColor: Colors.success,
    address: 'Av. Libertador 1200, Tucumán',
    personal: 12,
    vehicles: 4,
  },
  {
    name: 'Cuartel Nº2 - San Martín',
    status: 'Operativo',
    statusColor: Colors.success,
    address: 'Calle San Martín 450',
    personal: 8,
    vehicles: 3,
  },
  {
    name: 'Cuartel Nº3 - Yerba Buena',
    status: 'En Servicio',
    statusColor: Colors.warningOrange,
    address: 'Av. Aconquija 2100',
    personal: 6,
    vehicles: 2,
  },
];

export default function CuartelesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.menuBtn}>
          <MaterialCommunityIcons name="menu" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Cuarteles</Text>
        <Text style={styles.pageSubtitle}>5 cuarteles registrados</Text>

        <View style={styles.statsRow}>
          {STATS.map((s, idx) => (
            <View key={idx} style={[styles.statCard, idx === 1 && styles.statCardHighlight]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {CUARTELES.map((cuartel, idx) => (
          <TacticalCard key={idx} elevated>
            <View style={styles.cuartelHeader}>
              <View style={styles.cuartelIcon}>
                <MaterialCommunityIcons name="office-building" size={18} color={Colors.onSurfaceVariant} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cuartelName} numberOfLines={1}>{cuartel.name}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: cuartel.statusColor }]} />
                  <Text style={[styles.statusText, { color: cuartel.statusColor }]}>{cuartel.status}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={14} color={Colors.onSurfaceVariant} />
              <Text style={styles.detailText} numberOfLines={1}>{cuartel.address}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="account-group" size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.metaText}>{cuartel.personal} personal</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="fire-truck" size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.metaText}>{cuartel.vehicles} vehículos</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.mapBtn}>
                <MaterialIcons name="location-on" size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.mapBtnText}>Ver en Mapa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callBtn}>
                <MaterialIcons name="phone" size={14} color="#fff" />
                <Text style={styles.callBtnText}>Llamar</Text>
              </TouchableOpacity>
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
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  menuBtn: {
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
    fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: Spacing.lg,
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  statCardHighlight: { backgroundColor: Colors.tertiaryFixed },
  statValue: {
    fontSize: 24, fontWeight: '900', letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant, marginTop: 1,
  },
  cuartelHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, marginBottom: Spacing.sm,
  },
  cuartelIcon: {
    width: 38, height: 38, borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  cuartelName: {
    fontSize: 14, fontWeight: '700', color: Colors.onSurface,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm,
  },
  detailText: { fontSize: 12, color: Colors.onSurfaceVariant, flex: 1 },
  metaRow: {
    flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.onSurfaceVariant },
  actionRow: { flexDirection: 'row', gap: 8 },
  mapBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  mapBtnText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
  },
  callBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
