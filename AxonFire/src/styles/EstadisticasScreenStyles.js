import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#16181d'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#26282f',
        backgroundColor: '#1a1c23'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#e11d48',
        letterSpacing: 0.5
    },
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#af101a',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 6
    },
    exportBtnText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    scrollView: {
        flex: 1
    },
    contentScroll: {
        paddingHorizontal: 24,
        paddingTop: 20
    },
    loadingText: {
        color: '#94a3b8',
        marginTop: 16,
        fontSize: 13,
        letterSpacing: 0.5
    },
    filtersContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20
    },
    kpisGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 20,
    },
    kpiCard: {
        width: '48%',
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 3,
        gap: 6,
    },
    kpiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    kpiValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#f8fafc',
    },
    kpiLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 0.5,
    },
    filterSelector: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12
    },
    filterText: {
        color: '#f8fafc',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    card: {
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        borderRadius: 10,
        padding: 16,
        marginBottom: 20
    },
    cardHeaderWithToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#e11d48',
        paddingLeft: 10
    },
    cardTitleNoMargin: {
        color: '#f8fafc',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#16181d',
        borderRadius: 6,
        padding: 2,
        borderWidth: 1,
        borderColor: '#26282f',
    },
    toggleBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    toggleBtnActive: {
        backgroundColor: '#e11d48',
    },
    chartContentWrapper: {
        paddingTop: 4,
    },
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    chart: {
        borderRadius: 8,
    },
    customChartContainer: {
        paddingVertical: 4,
        gap: 16,
    },
    chartRow: {
        gap: 8,
    },
    chartRowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chartLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    colorIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    chartLabel: {
        color: '#cbd5e1',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    chartValue: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '800',
    },
    barContainer: {
        height: 6,
        backgroundColor: '#1e293b',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    cardTitle: {
        color: '#f8fafc',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#e11d48',
        paddingLeft: 10
    },
    chart: {
        marginVertical: 8,
        borderRadius: 8
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40
    },
    emptyText: {
        color: '#64748b',
        fontSize: 13,
        textAlign: 'center'
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        paddingBottom: 8,
        marginBottom: 8
    },
    tableHeaderCell: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b'
    },
    rowAlternative: {
        backgroundColor: '#1e253040'
    },
    bomberoName: {
        color: '#f8fafc',
        fontSize: 13,
        fontWeight: '800'
    },
    bomberoRank: {
        color: '#94a3b8',
        fontSize: 10,
        marginTop: 2
    },
    tableCell: {
        color: '#cbd5e1',
        fontSize: 12
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        maxHeight: 400,
        backgroundColor: '#1b1d24',
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: '#26282f'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1
    },
    modalItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#26282f'
    },
    modalItemActive: {
        backgroundColor: '#af101a20'
    },
    modalItemText: {
        color: '#cbd5e1',
        fontSize: 14,
        fontWeight: '600'
    },
    modalItemTextActive: {
        color: '#e11d48',
        fontWeight: '800'
    }
});
