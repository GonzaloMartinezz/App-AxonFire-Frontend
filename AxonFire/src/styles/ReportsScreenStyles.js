import { StyleSheet } from 'react-native';

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
    screenDesc: {
        color: '#94a3b8',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 20
    },
    scrollView: {
        flex: 1
    },
    contentScroll: {
        paddingHorizontal: 24,
        paddingTop: 20
    },
    filtersContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16
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
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1b1d24',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#26282f',
        height: 46,
        paddingHorizontal: 14,
        marginBottom: 20
    },
    searchInput: {
        flex: 1,
        color: '#f8fafc',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60
    },
    loadingText: {
        color: '#94a3b8',
        marginTop: 16,
        fontSize: 13,
        letterSpacing: 0.5
    },
    alertCard: {
        backgroundColor: '#1b1d24',
        borderWidth: 1,
        borderColor: '#26282f',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    cardId: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    statusBadge: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4
    },
    statusText: {
        color: '#94a3b8',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    cardTitle: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 12
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
    },
    metaText: {
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: '500',
        flex: 1
    },
    pdfButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#dc2626',
        borderRadius: 6,
        paddingVertical: 12,
        marginTop: 16
    },
    pdfButtonDisabled: {
        backgroundColor: '#991b1b',
        opacity: 0.6
    },
    pdfButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12
    },
    emptyText: {
        color: '#64748b',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 20
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
