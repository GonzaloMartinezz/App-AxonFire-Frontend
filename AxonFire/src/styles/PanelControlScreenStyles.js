import { StyleSheet, Platform } from 'react-native';
export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#16181d' },

    // Top Bar
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

    contenido: { padding: 24 },

    // Header Row
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 28,
    },
    titleLeftGroup: {
        flexDirection: 'row',
        flex: 1,
    },
    redAccent: {
        width: 3,
        backgroundColor: '#dc2626',
        marginRight: 12,
        marginTop: 4,
    },
    headerLabel: {
        fontSize: 10,
        color: '#fca5a5',
        letterSpacing: 2,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    mainTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
        lineHeight: 33,
    },

    centrado: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    textoCarga: { fontSize: 12, color: '#64748b', marginTop: 12 },
    botonReintentar: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: '#26282f',
        borderRadius: 4,
    },
    textoReintentar: { color: '#e2e8f0', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

    // Total Card
    totalCard: {
        backgroundColor: '#1b1d24',
        borderRadius: 6,
        padding: 18,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#26282f',
        borderLeftWidth: 3,
        borderLeftColor: '#dc2626',
    },
    totalLeft: { marginBottom: 16 },
    totalLabel: { fontSize: 9, color: '#94a3b8', letterSpacing: 1, fontWeight: '700', marginBottom: 6 },
    totalValue: { fontSize: 32, fontWeight: '900', color: '#fff' },
    progressBarLabel: { fontSize: 8, color: '#94a3b8', fontWeight: '800', letterSpacing: 0.5 },
    progressBarPercent: { fontSize: 10, fontWeight: '900' },
    progressBarBg: { height: 6, backgroundColor: '#26282f', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },

    // Section Header
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    sectionLine: { width: 6, height: 18, borderRadius: 3, backgroundColor: '#dc2626', marginRight: 10 },
    sectionTitle: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 2, flex: 1 },

    // Grilla
    grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    cardStat: {
        width: '48%',
        backgroundColor: '#1b1d24',
        borderRadius: 6,
        padding: 14,
        borderLeftWidth: 3,
        gap: 8,
        borderWidth: 1,
        borderColor: '#26282f',
    },
    cardStatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statNumero: { fontSize: 24, fontWeight: '900', color: '#f8fafc' },
    statLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Alert Card (Actividad Reciente)
    alertCard: {
        flexDirection: 'row',
        backgroundColor: '#1b1d24',
        borderRadius: 6,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderWidth: 1,
        borderColor: '#26282f',
        padding: 14,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    alertCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    alertIconBg: {
        width: 44,
        height: 44,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    alertDetails: {
        flex: 1,
        justifyContent: 'center',
        gap: 2,
    },
    alertTitle: {
        color: '#f8fafc',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    alertSubtitle: {
        color: '#94a3b8',
        fontSize: 11,
        marginBottom: 4,
    },
    alertBadgesRow: {
        flexDirection: 'row',
        gap: 6,
    },
    priorityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    priorityBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    statusBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    alertCardRight: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
    },
    alertTime: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '700',
    },

    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    textoVacio: { fontSize: 12, color: '#64748b', fontWeight: '800', letterSpacing: 0.5 },

    botonTest: {
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    botonTestText: { fontSize: 9, color: '#e11d48', fontWeight: '900', letterSpacing: 0.5 },
    logisticCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1b1d24',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#26282f',
        borderLeftWidth: 3,
        borderLeftColor: '#e11d48',
        padding: 16,
        marginBottom: 20,
        marginTop: 8,
        ...Platform.select({
            ios: { shadowColor: '#e11d48', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
            android: { elevation: 3 },
            web: { boxShadow: '0px 4px 12px rgba(225, 29, 72, 0.08)' }
        }),
    },
    logisticCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 14,
    },
    logisticIconBg: {
        width: 44,
        height: 44,
        borderRadius: 6,
        backgroundColor: '#e11d48',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logisticDetails: {
        flex: 1,
        gap: 2,
    },
    logisticCardTitle: {
        color: '#f8fafc',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.6,
    },
    logisticCardSub: {
        color: '#94a3b8',
        fontSize: 11,
        lineHeight: 15,
    },

    // ── Action Grid Styles ──────────────────────────────────────────
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 20,
    },
    gridItem: {
        width: '48%',
        backgroundColor: '#1b1d24',
        borderRadius: 6,
        padding: 12,
        borderWidth: 1,
        borderColor: '#26282f',
        gap: 6,
    },
    gridItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gridIconBg: {
        width: 32,
        height: 32,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridItemTitle: {
        color: '#f8fafc',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.2,
        marginTop: 2,
    },
    gridItemSub: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: '500',
    },
});
