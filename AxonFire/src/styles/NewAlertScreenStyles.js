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
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    scrollContent: {
        padding: 24,
    },
    headerTitleBox: {
        flexDirection: 'row',
        marginBottom: 32,
    },
    redBorder: {
        width: 3,
        marginRight: 12,
    },
    formContainer: {
        backgroundColor: '#1b1d24',
        padding: 24,
        borderRadius: 4,
    },

    // ── Inputs existentes ──────────────────────────────────────────────────────
    inputGroup: {
        marginBottom: 20,
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
        justifyContent: 'center',
    },
    inputWrapperMultiline: {
        height: 120,
        paddingTop: 16,
    },
    input: {
        color: '#e2e8f0',
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    inputMultiline: {
        height: '100%',
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
    pickerContainer: {
        backgroundColor: '#26282f',
        borderRadius: 4,
        marginBottom: 20,
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

    // ── Botones y acciones ────────────────────────────────────────────────────
    primaryButton: {
        borderRadius: 4,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 12,
        paddingHorizontal: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1,
        textAlign: 'center',
    },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        gap: 20,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtnText: {
        color: '#e2e8f0',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
});