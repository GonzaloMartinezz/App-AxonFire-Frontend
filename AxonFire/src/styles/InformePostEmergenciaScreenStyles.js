import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingBottom: 14,
        backgroundColor: '#0d1117',
        borderBottomWidth: 1, borderBottomColor: '#1f2937',
    },
    botonVolver: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#1f2937',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitulo: {
        color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.8,
    },
    headerSub: {
        color: '#475569', fontSize: 9, fontWeight: '600', marginTop: 1,
    },

    contenido: { padding: 20 },

    // Card datos alerta
    cardAlerta: {
        backgroundColor: '#111827', borderRadius: 12, padding: 16,
        marginBottom: 16, borderWidth: 1, borderColor: '#1f2937',
    },
    cardAlertaHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    },
    cardAlertaTitulo: {
        color: '#dc2626', fontSize: 10, fontWeight: '900', letterSpacing: 0.8,
    },
    datosRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6,
    },
    datoTexto: { color: '#94a3b8', fontSize: 12, fontWeight: '500', flex: 1, lineHeight: 18 },
    sinDatos: { color: '#334155', fontSize: 12, fontStyle: 'italic' },

    // Instrucción
    instruccion: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: 'rgba(59,130,246,0.08)',
        borderRadius: 8, padding: 12, marginBottom: 20,
        borderLeftWidth: 2, borderLeftColor: '#3b82f6',
    },
    instruccionTexto: {
        color: '#64748b', fontSize: 11, fontWeight: '500', flex: 1, lineHeight: 16,
    },

    // Sin acceso
    sinAcceso: {
        alignItems: 'center', paddingVertical: 60, gap: 12,
    },
    sinAccesoTexto: {
        color: '#334155', fontSize: 13, fontWeight: '600',
        textAlign: 'center', lineHeight: 20,
    },

    // Botón guardar
    botonGuardar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 16, marginTop: 8,
    },
    botonGuardarTexto: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

    badgeGuardado: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        justifyContent: 'center', marginTop: 10,
    },
    badgeGuardadoTexto: { color: '#22c55e', fontSize: 11, fontWeight: '700' },

    footer: {
        color: '#1f2937', fontSize: 9, fontWeight: '600',
        textAlign: 'center', marginTop: 24, letterSpacing: 0.8,
    },
});
