import { StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, Radius } from '../theme';

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
    },
    botonVolver: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: Colors.surfaceContainerLow,
        alignItems: 'center', justifyContent: 'center',
    },
    tituloHeader: { fontSize: 17, fontWeight: '800', color: Colors.onSurface },
    botonRefresh: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: Colors.surfaceContainerLow,
        alignItems: 'center', justifyContent: 'center',
    },

    contenido: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

    labelSeccion: {
        fontSize: 10, fontWeight: '800', letterSpacing: 1,
        color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: Spacing.md,
    },

    grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    cardRefuerzo: {
        width: '48%', backgroundColor: Colors.surfaceContainerHigh,
        borderRadius: Radius.xxl, paddingVertical: Spacing.lg,
        alignItems: 'center', gap: 8,
    },
    iconoRefuerzo: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    nombreRefuerzo: {
        fontSize: 10, fontWeight: '700', letterSpacing: 0.6,
        color: Colors.onSurface, textTransform: 'uppercase',
    },

    botonPersonal: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        paddingVertical: 18, borderRadius: Radius.xxl,
        ...Platform.select({
            ios: { shadowColor: '#af101a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
            android: { elevation: 8 },
            web: { boxShadow: '0px 6px 16px rgba(175,16,26,0.3)' },
        }),
    },
    textoBotonPersonal: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },

    filaSolicitud: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconoSolicitud: {
        width: 38, height: 38, borderRadius: Radius.lg,
        alignItems: 'center', justifyContent: 'center',
    },
    tituloSolicitud: { fontSize: 13, fontWeight: '700', color: Colors.onSurface },
    subtituloSolicitud: {
        fontSize: 9, fontWeight: '800', letterSpacing: 0.8,
        color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 1,
    },

    centrado: { alignItems: 'center', paddingVertical: 28, gap: 8 },
    textoVacio: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },

    // Modal
    fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    contenedorModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 40,
    },
    headerModal: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20,
    },
    tituloModal: { fontSize: 20, fontWeight: '900', color: '#263238' },
    cerrarModal: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    },
    labelModal: {
        fontSize: 12, fontWeight: '700', color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, marginTop: 12,
    },
    filaCantidad: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 4 },
    botonCantidad: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    },
    valorCantidad: { fontSize: 28, fontWeight: '900', color: '#263238', minWidth: 40, textAlign: 'center' },
    inputMotivo: {
        backgroundColor: '#f8fafc', borderRadius: 14, padding: 14,
        fontSize: 14, color: '#263238', minHeight: 80,
        textAlignVertical: 'top', marginBottom: 16,
    },
    botonEnviarModal: { borderRadius: Radius.xxl, overflow: 'hidden' },
    gradientModal: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 18,
    },
    textoEnviarModal: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.6 },
});
