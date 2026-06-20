import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#16181d',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    responsiveWrapper: {
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
        position: 'relative',
    },

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
        padding: 6,
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        borderRadius: 8,
    },

    dropdownMenu: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#1b1d24',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#26282f',
        paddingVertical: 6,
        minWidth: 200,
        zIndex: 9999,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
            android: { elevation: 12 },
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.5)' },
        }),
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 10,
    },
    dropdownDivider: {
        height: 1,
        backgroundColor: '#26282f',
        marginHorizontal: 16,
    },
    dropdownItemText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#f8fafc',
        letterSpacing: 0.5,
    },

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

    // Filters
    filterSection: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    filterChip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterChipActive: {
        backgroundColor: '#ef4444',
    },
    filterChipInactive: {
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterTextActive: {
        color: '#fff',
    },
    filterTextInactive: {
        color: '#94a3b8',
    },
    countBadge: {
        backgroundColor: '#af101a',
        borderRadius: 8,
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        minWidth: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: '900',
    },

    // Alert List
    alertList: {
        gap: 12,
    },
    alertCard: {
        backgroundColor: '#1b1d24',
        borderRadius: 6,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 3,
        borderWidth: 1,
        borderColor: '#26282f',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
        gap: 2,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 2,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    badgeText: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    alertType: {
        fontSize: 12,
        fontWeight: '800',
        color: '#f8fafc',
        letterSpacing: 0.5,
    },
    address: {
        fontSize: 11,
        color: '#94a3b8',
    },
    alertCardRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    timeAgo: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '700',
    },

    centrado: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    textoCarga: {
        fontSize: 12,
        color: '#64748b',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 8,
    },
    textoVacio: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    roleBreadcrumb: {
        height: 24,
        backgroundColor: '#1b1d24',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderLeftWidth: 3,
        borderBottomWidth: 1,
        borderBottomColor: '#26282f',
    },
    roleBreadcrumbDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    roleBreadcrumbText: {
        fontSize: 9,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        letterSpacing: 1.2,
    },
});
