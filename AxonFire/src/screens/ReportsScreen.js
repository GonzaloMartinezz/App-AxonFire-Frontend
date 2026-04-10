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
import StatusBadge from '../components/StatusBadge';

const TIMELINE = [
  { label: 'LLAMADA RECIBIDA', time: '02:14', date: '12 Oct 2023', delta: null },
  { label: 'DESPACHO', time: '02:16', date: null, delta: '+2m 14s', deltaColor: Colors.success },
  { label: 'EN ESCENA', time: '02:22', date: null, delta: '8m Total', deltaColor: Colors.alertBlue },
  { label: 'RESUELTO', time: '04:45', date: 'Operación Cerrada', delta: null },
];

const INVENTORY_ITEMS = [
  { name: 'Equipos SCBA (6)', status: 'DEVUELTO', ok: true },
  { name: 'Herramientas Hidráulicas', status: 'ASEGURADO', ok: true },
  { name: 'Manguera LDR 50\'', status: 'DAÑADA', ok: false },
  { name: 'Cámara Térmica', status: 'DEVUELTO', ok: true },
];

export default function ReportsScreen() {
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
          <MaterialCommunityIcons name="asterisk" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.overline}>REVISIÓN POST-INCIDENTE</Text>
        <Text style={styles.incidentId}>INCIDENTE #4409-B</Text>
        <Text style={styles.incidentDesc}>
          Respuesta ante Incendio Estructural - Sector Centro
        </Text>

        <TouchableOpacity style={styles.pdfBtn}>
          <MaterialCommunityIcons name="file-pdf-box" size={16} color="#fff" />
          <Text style={styles.pdfBtnText}>Generar PDF</Text>
        </TouchableOpacity>

        {/* ── Timeline ── */}
        <View style={styles.timeline}>
          {TIMELINE.map((item, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <View style={styles.timelineLine}>
                <View style={[
                  styles.timelineDot,
                  idx === TIMELINE.length - 1 && styles.timelineDotLast,
                ]} />
                {idx < TIMELINE.length - 1 && <View style={styles.timelineConnector} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>{item.label}</Text>
                <Text style={styles.timelineTime}>{item.time}</Text>
                {item.date && <Text style={styles.timelineDate}>{item.date}</Text>}
                {item.delta && (
                  <View style={[styles.deltaBadge, { backgroundColor: `${item.deltaColor}20` }]}>
                    <Text style={[styles.deltaText, { color: item.deltaColor }]}>{item.delta}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* ── Incident Notes ── */}
        <TacticalCard elevated>
          <View style={styles.noteHeader}>
            <View style={styles.noteIconRow}>
              <MaterialCommunityIcons name="file-document-outline" size={18} color={Colors.primary} />
              <Text style={styles.noteTitle}>Notas del Incidente</Text>
            </View>
            <StatusBadge severity="activa" label="VERIFICADO" />
          </View>

          <Text style={styles.noteBody}>
            Al llegar a las 02:22, se observó humo denso desde las ventanas del segundo piso. Motor 4 desplegó dos líneas de 1.75" para ataque interior.
          </Text>

          <View style={styles.quoteBlock}>
            <Text style={styles.quoteText}>
              "La estructura 4409-B mostró daño térmico significativo en vigas principales."
            </Text>
          </View>

          <Text style={styles.noteBody}>
            Todo el personal contabilizado. Sin lesiones reportadas.
          </Text>
        </TacticalCard>

        {/* ── Command Validation ── */}
        <TacticalCard>
          <Text style={styles.validationLabel}>VALIDACIÓN DE COMANDO</Text>
          <View style={styles.validationRow}>
            <View style={styles.validationAvatar}>
              <MaterialCommunityIcons name="account-check" size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.validationName}>Cap. Marcus Thorne</Text>
              <Text style={styles.validationDate}>Firmado @ 05:02</Text>
            </View>
          </View>
        </TacticalCard>

        {/* ── Inventory ── */}
        <TacticalCard elevated>
          <View style={styles.inventoryHeader}>
            <MaterialCommunityIcons name="fire-truck" size={18} color={Colors.onSurface} />
            <Text style={styles.inventoryTitle}>Inventario del Camión</Text>
          </View>
          {INVENTORY_ITEMS.map((item, idx) => (
            <View key={idx} style={styles.inventoryRow}>
              <MaterialCommunityIcons
                name={item.ok ? 'check-circle' : 'alert-circle'}
                size={15}
                color={item.ok ? Colors.success : Colors.primary}
              />
              <Text style={styles.inventoryName} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.inventoryStatus, { color: item.ok ? Colors.success : Colors.primary }]}>
                {item.status}
              </Text>
            </View>
          ))}
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
  overline: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1.2,
    color: Colors.primary, textTransform: 'uppercase',
    marginBottom: 3,
  },
  incidentId: {
    fontSize: 26, fontWeight: '900', letterSpacing: -0.4,
    color: Colors.onSurface, marginBottom: 3,
  },
  incidentDesc: {
    fontSize: 13, color: Colors.onSurfaceVariant,
    marginBottom: Spacing.md,
  },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    backgroundColor: Colors.alertBlue,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: Radius.xl, alignSelf: 'flex-start',
    marginBottom: Spacing.xl,
  },
  pdfBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  timeline: { marginBottom: Spacing.lg, paddingLeft: 2 },
  timelineItem: { flexDirection: 'row' },
  timelineLine: { alignItems: 'center', width: 16, marginRight: Spacing.md },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 2, borderColor: Colors.surfaceContainerHigh,
  },
  timelineDotLast: {
    backgroundColor: Colors.primary, borderColor: Colors.primaryFixed,
  },
  timelineConnector: {
    width: 2, flex: 1, backgroundColor: Colors.surfaceContainerHighest, minHeight: 30,
  },
  timelineContent: { flex: 1, paddingBottom: Spacing.lg },
  timelineLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 24, fontWeight: '900', color: Colors.onSurface, letterSpacing: -0.5,
  },
  timelineDate: {
    fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1,
  },
  deltaBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 9999, marginTop: 4,
  },
  deltaText: { fontSize: 10, fontWeight: '700' },
  noteHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  noteIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteTitle: { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
  noteBody: {
    fontSize: 13, color: Colors.onSurface, lineHeight: 20, marginBottom: Spacing.sm,
  },
  quoteBlock: {
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    paddingLeft: Spacing.md, paddingVertical: Spacing.xs,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  quoteText: {
    fontSize: 12, fontStyle: 'italic',
    color: Colors.onSurfaceVariant, lineHeight: 18,
  },
  validationLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  validationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  validationAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  validationName: {
    fontSize: 13, fontWeight: '700', color: Colors.onSurface,
  },
  validationDate: {
    fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1,
  },
  inventoryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md,
  },
  inventoryTitle: { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
  inventoryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, gap: 8,
  },
  inventoryName: {
    flex: 1, fontSize: 13, fontWeight: '600', color: Colors.onSurface,
  },
  inventoryStatus: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
  },
});
