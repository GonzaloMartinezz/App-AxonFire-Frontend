import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#16181d',
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
    backBtn: {
        padding: 4,
        marginRight: 4,
    },
    topBarTitle: {
        color: '#e11d48',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    iconBtn: {
        padding: 4,
    },

    scrollContent: {
        padding: 24,
    },
    subtitle: {
        fontSize: 10,
        color: '#fca5a5',
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 4,
    },
    mainTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: '#f8fafc',
        letterSpacing: -1,
        lineHeight: 33,
        marginBottom: 12,
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
        marginBottom: 24,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    statCard: {
        flex: 1,
        minWidth: 56,
        backgroundColor: '#1b1d24',
        borderRadius: 6,
        padding: 10,
        borderLeftWidth: 3,
        borderWidth: 1,
        borderColor: '#26282f',
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#f8fafc',
    },
    statLabel: {
        fontSize: 7,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        textAlign: 'center',
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionLine: {
        width: 6,
        height: 18,
        borderRadius: 3,
        backgroundColor: '#dc2626',
        marginRight: 10,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 2,
        flex: 1,
    },
    countBadge: {
        backgroundColor: '#26282f',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    countBadgeText: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '800',
    },

    // Loading / Empty / Error
    centered: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    loadingText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 12,
    },
    retryBtn: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: '#26282f',
        borderRadius: 4,
    },
    retryBtnText: {
        color: '#e2e8f0',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    emptyText: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '700',
    },
    emptySubtext: {
        fontSize: 11,
        color: '#64748b',
    },

    // ── Card-based List ──────────────────────────────────────────
    cardsListContainer: {
        gap: 12,
    },
    poiCard: {
        backgroundColor: '#1b1d24',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#26282f',
        flexDirection: 'row',
        overflow: 'hidden',
        minHeight: 80,
    },
    poiCardLeftBorder: {
        width: 4,
        height: '100%',
    },
    poiCardContent: {
        flex: 1,
        padding: 14,
        justifyContent: 'space-between',
    },
    poiCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    poiIconBox: {
        width: 32,
        height: 32,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    poiCardName: {
        color: '#f8fafc',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    poiCardDesc: {
        color: '#94a3b8',
        fontSize: 11,
        marginTop: 6,
        lineHeight: 16,
    },
    poiCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#26282f',
        paddingTop: 8,
    },
    poiCardCoords: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    poiCardCoordText: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    poiCardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    poiCardEditBtn: {
        padding: 6,
        backgroundColor: 'rgba(59,130,246,0.12)',
        borderRadius: 4,
    },
    poiCardDeleteBtn: {
        padding: 6,
        backgroundColor: 'rgba(239,68,68,0.12)',
        borderRadius: 4,
    },

    // Inline Picker
    inlinePickerContainer: {
        backgroundColor: '#16181d',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#334155',
        padding: 8,
        marginBottom: 16,
        marginTop: -8,
    },
    inlinePickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 4,
        marginBottom: 2,
    },
    inlinePickerOptionSelected: {
        backgroundColor: '#26282f',
    },
    inlinePickerOptionText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '700',
        flex: 1,
    },

    // Suggestions
    suggestionsContainer: {
        backgroundColor: '#16181d',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#334155',
        padding: 6,
        marginTop: -12,
        marginBottom: 16,
        maxHeight: 180,
        overflow: 'hidden',
    },
    suggestionOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#26282f',
    },
    suggestionName: {
        color: '#f8fafc',
        fontSize: 12,
        fontWeight: '700',
    },
    suggestionDesc: {
        color: '#64748b',
        fontSize: 10,
        marginTop: 1,
    },

    // ── Modals ───────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
    },
    modalScroll: {
        width: '100%',
    },
    modalScrollContent: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        flexGrow: 1,
    },
    modalView: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#1b1d24',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#26282f',
        padding: 24,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
            android: { elevation: 8 },
            web: { boxShadow: '0px 4px 24px rgba(0,0,0,0.5)' },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    modalTitle: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    modalDesc: {
        color: '#94a3b8',
        fontSize: 11,
        lineHeight: 16,
        marginBottom: 20,
    },
    fieldLabel: {
        color: '#94a3b8',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    modalInput: {
        backgroundColor: '#16181d',
        borderColor: '#334155',
        borderWidth: 1,
        borderRadius: 6,
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 16,
    },
    pickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#16181d',
        borderColor: '#334155',
        borderWidth: 1,
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 16,
    },
    pickerBtnText: {
        color: '#f8fafc',
        fontSize: 13,
        fontWeight: '600',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },

    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnCancel: {
        backgroundColor: '#26282f',
    },
    modalBtnConfirm: {
        backgroundColor: '#e11d48',
    },
    modalBtnDelete: {
        backgroundColor: '#dc2626',
    },
    modalBtnTextCancel: {
        color: '#cbd5e1',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    modalBtnTextConfirm: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },

    // Category Picker Modal (pickerModal is now pickerOptionIcon inside inline list)
    pickerOptionIcon: {
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Delete Modal
    deleteModalIcon: {
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteModalTitle: {
        color: '#f8fafc',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 12,
    },
    deleteModalDesc: {
        color: '#94a3b8',
        fontSize: 11,
        lineHeight: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
});
