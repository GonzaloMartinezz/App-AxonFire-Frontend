import { StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, Radius } from '../theme';

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#16181d' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
        borderBottomWidth: 1, borderBottomColor: '#26282f',
        backgroundColor: '#1a1c23',
    },
    botonVolver: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#26282f',
        alignItems: 'center', justifyContent: 'center',
    },
    tituloHeader: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    botonRefresh: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#26282f',
        alignItems: 'center', justifyContent: 'center',
    },

    contenido: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

    labelSeccion: {
        fontSize: 10, fontWeight: '800', letterSpacing: 1.5,
        color: '#fca5a5', textTransform: 'uppercase', marginBottom: Spacing.md,
    },

    // Emergencia Activa Card
    activeEmergencyCard: {
        backgroundColor: '#1b1d24',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#26282f',
        borderLeftWidth: 3,
        borderLeftColor: '#dc2626',
    },
    emergencyCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    emergencyLabel: {
        fontSize: 9,
        color: '#dc2626',
        fontWeight: '900',
        letterSpacing: 1,
    },
    emergencyTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 2,
    },
    emergencySub: {
        fontSize: 11,
        color: '#94a3b8',
    },

    // Grilla
    grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    cardRefuerzo: {
        width: '48%', backgroundColor: '#1b1d24',
        borderRadius: 8, paddingVertical: Spacing.lg,
        alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: '#26282f',
    },
    iconoRefuerzo: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    nombreRefuerzo: {
        fontSize: 10, fontWeight: '800', letterSpacing: 0.8,
        color: '#f8fafc', textTransform: 'uppercase',
    },

    botonPersonal: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        paddingVertical: 16, borderRadius: 8,
        marginTop: Spacing.lg,
        ...Platform.select({
            ios: { shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
            android: { elevation: 6 },
            web: { boxShadow: '0px 4px 12px rgba(220,38,38,0.3)' },
        }),
    },
    textoBotonPersonal: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

    filaSolicitud: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconoSolicitud: {
        width: 40, height: 40, borderRadius: 6,
        alignItems: 'center', justifyContent: 'center',
    },
    tituloSolicitud: { fontSize: 13, fontWeight: '800', color: '#f8fafc' },
    subtituloSolicitud: {
        fontSize: 9, fontWeight: '800', letterSpacing: 0.8,
        color: '#64748b', textTransform: 'uppercase', marginTop: 3,
    },

    centrado: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    textoVacio: { fontSize: 12, color: '#64748b', fontWeight: '800', letterSpacing: 0.5 },

    // Modal
    fondoModal: { flex: 1, backgroundColor: 'rgba(17,29,35,0.75)', justifyContent: 'flex-end' },
    contenedorModal: {
        backgroundColor: '#1b1d24',
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
        padding: 24, paddingBottom: 40,
        borderTopWidth: 1, borderTopColor: '#26282f',
    },
    headerModal: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20,
    },
    tituloModal: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
    cerrarModal: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#26282f', alignItems: 'center', justifyContent: 'center',
    },
    labelModal: {
        fontSize: 10, fontWeight: '800', color: '#64748b',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 12,
    },
    filaCantidad: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 4 },
    botonCantidad: {
        width: 44, height: 44, borderRadius: 8,
        backgroundColor: '#26282f', alignItems: 'center', justifyContent: 'center',
    },
    valorCantidad: { fontSize: 24, fontWeight: '900', color: '#fff', minWidth: 40, textAlign: 'center' },
    inputMotivo: {
        backgroundColor: '#26282f', borderRadius: 8, padding: 14,
        fontSize: 13, color: '#fff', minHeight: 80,
        textAlignVertical: 'top', marginBottom: 16,
        borderWidth: 1, borderColor: '#334155',
    },
    botonEnviarModal: { borderRadius: 8, overflow: 'hidden' },
    gradientModal: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 16,
    },
    textoEnviarModal: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
    manualRequestCard: {
        backgroundColor: '#1b1d24',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#26282f',
    },
    inputManual: {
        backgroundColor: '#26282f',
        borderRadius: 8,
        padding: 14,
        fontSize: 13,
        color: '#fff',
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    botonManualEnviar: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    gradientBotonManual: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
    },
    textoBotonManual: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
});
