import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#16181d',
    },

    // Top bar
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
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    topBarTitle: {
        color: '#e11d48',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    iconBtn: { padding: 4 },
    refreshBtn: {
        width: 36,
        height: 36,
        borderRadius: 6,
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Content
    scrollContent: { padding: 24 },

    pageLabel: {
        fontSize: 10,
        color: '#fca5a5',
        letterSpacing: 2,
        fontWeight: '700',
        marginBottom: 4,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#f8fafc',
        letterSpacing: -1,
        lineHeight: 30,
        marginBottom: 24,
    },

    // ── Card de Postura Operativa ──
    postureCard: {
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    postureTitle: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 6,
    },
    postureDesc: {
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 18,
        marginBottom: 16,
    },
    postureButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    postureBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#16181d',
        paddingVertical: 10,
        borderRadius: 6,
        borderWidth: 1,
    },
    postureBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    normalBtnBorder: { borderColor: '#1e293b' },
    normalBtnActive: {
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderColor: '#22c55e',
    },
    yellowBtnBorder: { borderColor: '#1e293b' },
    yellowBtnActive: {
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderColor: '#f59e0b',
    },
    redBtnBorder: { borderColor: '#1e293b' },
    redBtnActiveStatic: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderColor: '#ef4444',
    },
    redBtnActivePulse: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: '#ef4444',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 3,
    },

    // ── Card de Acceso al Mapa ──
    mapCard: {
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        borderRadius: 12,
        marginBottom: 24,
        overflow: 'hidden',
    },
    mapCardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    mapIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapCardInfo: {
        flex: 1,
        marginLeft: 14,
    },
    mapCardTitle: {
        color: '#f8fafc',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    mapCardDesc: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    mapChevron: {
        marginLeft: 6,
    },

    // Headers de sección
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: 1.2,
    },
    countBadge: {
        backgroundColor: '#052e16',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    countBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#22c55e',
        letterSpacing: 0.6,
    },

    // Telemetría e información de camión
    camionCard: {
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
    },
    camionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    camionIconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    camionHeaderInfo: {
        flex: 1,
        marginLeft: 12,
    },
    camionNombre: {
        color: '#f8fafc',
        fontSize: 15,
        fontWeight: '800',
    },
    camionTipoLabel: {
        color: '#64748b',
        fontSize: 9,
        fontWeight: '700',
        marginTop: 2,
        letterSpacing: 0.2,
    },
    camionStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#052e16',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    dotGreen: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22c55e',
    },
    camionEstado: {
        fontSize: 8,
        fontWeight: '900',
        color: '#22c55e',
        letterSpacing: 0.6,
    },

    // Telemetry visual gauges
    telemetrySection: {
        backgroundColor: '#16181d',
        borderRadius: 8,
        padding: 12,
        gap: 12,
        marginBottom: 14,
    },
    telemetryRow: {
        gap: 6,
    },
    telemetryLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    labelWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    telemetryLabel: {
        color: '#94a3b8',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    telemetryVal: {
        color: '#e2e8f0',
        fontSize: 10,
        fontWeight: '700',
    },
    gaugeTrack: {
        height: 6,
        backgroundColor: '#1e293b',
        borderRadius: 3,
        overflow: 'hidden',
    },
    gaugeFillBlue: {
        height: '100%',
        backgroundColor: '#38bdf8',
        borderRadius: 3,
    },
    gaugeFillGreen: {
        height: '100%',
        backgroundColor: '#22c55e',
        borderRadius: 3,
    },
    gaugeFillYellow: {
        height: '100%',
        backgroundColor: '#fbbf24',
        borderRadius: 3,
    },

    camionCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    crewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#1e293b',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
    },
    crewText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '700',
    },
    botonChecklist: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#dc2626',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    botonChecklistText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.6,
    },

    // ── Grid de Auditorías y Planillas ──
    gridAuditores: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    auditCard: {
        width: '48%',
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        borderLeftWidth: 4,
        borderRadius: 10,
        padding: 12,
        gap: 4,
    },
    auditIconBg: {
        width: 34,
        height: 34,
        borderRadius: 6,
        backgroundColor: '#16181d',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    auditTitle: {
        color: '#f8fafc',
        fontSize: 12,
        fontWeight: '800',
    },
    auditSub: {
        color: '#64748b',
        fontSize: 9,
        fontWeight: '500',
        lineHeight: 12,
    },

    // ── Bitácora en Vivo ──
    feedContainer: {
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 20,
    },
    feedItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#26282f',
    },
    feedHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    feedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#16181d',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    feedEmisor: {
        color: '#64748b',
        fontSize: 8,
        fontWeight: '800',
    },
    feedTime: {
        color: '#475569',
        fontSize: 8,
        fontWeight: '700',
    },
    feedMessage: {
        color: '#cbd5e1',
        fontSize: 11,
        fontWeight: '500',
        lineHeight: 15,
    },
    dotPulseGreen: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22c55e',
    },

    // Error / empty / loading
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#1b1d24',
        borderRadius: 6,
        padding: 14,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#dc2626',
    },
    errorText: { color: '#f87171', fontSize: 12, fontWeight: '600', flex: 1 },
    emptyCard: {
        alignItems: 'center',
        paddingVertical: 28,
        backgroundColor: '#1b1d24',
        borderRadius: 8,
        marginBottom: 12,
        gap: 8,
    },
    emptyText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#334155',
        letterSpacing: 1,
    },
    loadingCard: {
        alignItems: 'center',
        paddingVertical: 28,
        gap: 12,
    },
    loadingText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '600',
    },

    // Reinforcements
    reinforcementGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    reinforcementCard: {
        width: '48%',
        backgroundColor: '#1b1d24',
        borderRadius: 8,
        paddingVertical: 18,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    reinforcementIconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reinforcementLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.6,
    },

    // Personal button
    personalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#dc2626',
        paddingVertical: 16,
        borderRadius: 6,
    },
    personalBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.8,
    },

    // Admin Logistics Actions
    adminActionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 8,
        marginBottom: 20,
    },
    adminActionCard: {
        width: '48%',
        backgroundColor: '#1b1d24',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#26282f',
        borderLeftWidth: 3,
        gap: 6,
    },
    adminActionCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    adminActionIconBg: {
        width: 32,
        height: 32,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    adminActionTitle: {
        color: '#f8fafc',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.2,
        marginTop: 2,
    },
    adminActionSub: {
        color: '#64748b',
        fontSize: 9,
        fontWeight: '500',
    },
});