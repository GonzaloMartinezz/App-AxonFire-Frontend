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

export default function AlertDetailScreen() {
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
        {/* ── Alert Badge Row ── */}
        <View style={styles.badgeRow}>
          <StatusBadge severity="critica" />
          <Text style={styles.alertId}>ALERTA #442-B</Text>
        </View>

        {/* ── Location Hero Card ── */}
        <View style={styles.locationHero}>
          <LinearGradient
            colors={['rgba(38,50,56,0.3)', 'rgba(38,50,56,0.88)']}
            style={styles.locationGradient}
          >
            <Text style={styles.locationLabel}>UBICACIÓN</Text>
            <Text style={styles.locationAddress}>
              Av. Central & Calle 12, Bodega Sur
            </Text>
          </LinearGradient>
          <TouchableOpacity style={styles.gpsBtn}>
            <MaterialIcons name="my-location" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.onSurfaceVariant} />
              <Text style={styles.statLabel}>TIEMPO{'\n'}TRANSCURRIDO</Text>
            </View>
            <Text style={styles.statValue}>04:22</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <MaterialCommunityIcons name="account-group" size={14} color={Colors.onSurfaceVariant} />
              <Text style={styles.statLabel}>RESPONDIENDO</Text>
            </View>
            <Text style={styles.statValue}>12</Text>
          </View>
        </View>

        {/* ── Confirm Button ── */}
        <TouchableOpacity style={{ marginBottom: Spacing.sm }}>
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmBtn}
          >
            <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
            <Text style={styles.confirmText}>CONFIRMAR ASISTENCIA</Text>
            <MaterialIcons name="arrow-forward" size={18} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Decline ── */}
        <TouchableOpacity style={styles.declineBtn}>
          <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceVariant} />
          <Text style={styles.declineText}>NO PUEDO ASISTIR</Text>
        </TouchableOpacity>

        {/* ── Tactical Details ── */}
        <Text style={styles.sectionLabel}>DETALLES TÁCTICOS</Text>

        <TacticalCard>
          <View style={styles.detailItemRow}>
            <View style={[styles.detailIcon, { backgroundColor: Colors.tertiaryFixed }]}>
              <MaterialCommunityIcons name="fire" size={18} color={Colors.tertiary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>Fuego Estructural</Text>
              <Text style={styles.detailDesc}>
                Bodega de materiales inflamables. Reportan personas en el ala norte.
              </Text>
            </View>
          </View>
        </TacticalCard>

        <TacticalCard>
          <View style={styles.detailItemRow}>
            <View style={[styles.detailIcon, { backgroundColor: Colors.alertBlueLight }]}>
              <MaterialCommunityIcons name="information" size={18} color={Colors.alertBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>Unidad Asignada</Text>
              <Text style={styles.detailDesc}>B-1, R-3, A-2</Text>
            </View>
          </View>
        </TacticalCard>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
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
  badgeRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: Spacing.md,
  },
  alertId: {
    fontSize: 13, fontWeight: '700', letterSpacing: 0.4,
    color: Colors.onSurface, textTransform: 'uppercase',
  },
  locationHero: {
    height: 140, borderRadius: Radius.xxl, overflow: 'hidden',
    backgroundColor: Colors.inverseSurface,
    marginBottom: Spacing.md, position: 'relative',
  },
  locationGradient: {
    flex: 1, justifyContent: 'flex-end', padding: Spacing.lg,
  },
  locationLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1,
    color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase',
    marginBottom: 3,
  },
  locationAddress: {
    fontSize: 16, fontWeight: '800', color: '#fff', lineHeight: 22,
  },
  gpsBtn: {
    position: 'absolute', bottom: Spacing.lg, right: Spacing.lg,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
    elevation: 6,
  },
  statsRow: {
    flexDirection: 'row', gap: 8, marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xxl, padding: Spacing.md,
  },
  statIconRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 6,
  },
  statLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 0.8,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 28, fontWeight: '900', color: Colors.onSurface, letterSpacing: -0.5,
  },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: Radius.xxl,
    boxShadow: '0px 8px 20px rgba(175,16,26,0.35)',
    elevation: 10,
  },
  confirmText: {
    color: '#fff', fontSize: 13, fontWeight: '900',
    letterSpacing: 0.6, flex: 1,
  },
  declineBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: Radius.xxl,
    backgroundColor: Colors.surfaceContainerHigh,
    marginBottom: Spacing.xl,
  },
  declineText: {
    fontSize: 12, fontWeight: '700', color: Colors.onSurfaceVariant, letterSpacing: 0.4,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    color: Colors.onSurface, textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  detailItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailIcon: {
    width: 38, height: 38, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  detailTitle: {
    fontSize: 14, fontWeight: '700', color: Colors.onSurface, marginBottom: 3,
  },
  detailDesc: {
    fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 18,
  },
});
