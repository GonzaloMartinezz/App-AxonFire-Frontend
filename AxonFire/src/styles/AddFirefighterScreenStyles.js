import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#16181d',
    },
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
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBarTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },
    scrollContent: {
        padding: 24,
    },
    headerTitleBox: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    redBorder: {
        width: 3,
        backgroundColor: '#dc2626',
        marginRight: 12,
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        color: '#94a3b8',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    formContainer: {
        backgroundColor: '#1b1d24',
        padding: 20,
        borderRadius: 4,
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: '#e2e8f0',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 8,
    },
    inputWrapper: {
        backgroundColor: '#26282f',
        borderRadius: 4,
        height: 48,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    input: {
        flex: 1,
        color: '#e2e8f0',
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    passwordField: {
        marginBottom: 16,
    },
    dropdownWrapper: {
        backgroundColor: '#26282f',
        borderRadius: 4,
        height: 48,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownValue: {
        color: '#e2e8f0',
        fontSize: 14,
    },
    dropdownPlaceholder: {
        color: '#52525b',
        fontSize: 14,
    },
    primaryButton: {
        backgroundColor: '#dc2626',
        borderRadius: 4,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 2,
    },
    pickerContainer: {
        backgroundColor: '#26282f',
        borderRadius: 4,
        marginBottom: 16,
        overflow: 'hidden',
    },
    pickerOption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1b1d24',
    },
    pickerOptionText: {
        color: '#e2e8f0',
        fontSize: 14,
    },
    listSection: {
        marginTop: 16,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    listTitle: {
        color: '#e2e8f0',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    listCount: {
        color: '#64748b',
        fontSize: 11,
    },
    centerContent: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    loadingText: {
        color: '#64748b',
        marginTop: 12,
        fontSize: 12,
    },
    errorText: {
        color: '#ef4444',
        marginTop: 12,
        fontSize: 12,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: '#26282f',
        borderRadius: 4,
    },
    retryButtonText: {
        color: '#e2e8f0',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    firefighterCard: {
        flexDirection: 'row',
        backgroundColor: '#1b1d24',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
        alignItems: 'center',
        paddingRight: 16,
    },
    cardLeftBorder: {
        width: 3,
        height: '100%',
    },
    // Nota: En tu código original había dos 'avatarPlaceholder'. React Native tomará el último. 
    // Te dejé el segundo que corresponde a la tarjeta del bombero. Si necesitas el primero, 
    // te recomiendo cambiarle el nombre a uno de los dos para evitar conflictos.
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#26282f',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 12,
    },
    firefighterDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        marginBottom: 4,
    },
    firefighterName: {
        color: '#f8fafc',
        fontSize: 14,
        fontWeight: '800',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rankBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    rankText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    usernameText: {
        color: '#64748b',
        fontSize: 11,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        color: '#64748b',
        marginTop: 12,
        fontSize: 12,
    }
});