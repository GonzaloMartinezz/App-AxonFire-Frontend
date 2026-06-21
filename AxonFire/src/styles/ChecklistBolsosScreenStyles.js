import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#16181d' },

    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: '#1a1c23',
        borderBottomWidth: 1, borderBottomColor: '#26282f',
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center',
    },
    topBarTitle: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
    topBarSub: { color: '#dc2626', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 1 },

    scrollContent: { padding: 20 },

    // Intro (selector de bolso)
    introBox: {
        alignItems: 'center', paddingVertical: 28, gap: 8, marginBottom: 20,
    },
    introTitulo: {
        color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.3,
    },
    introSub: {
        color: '#64748b', fontSize: 12, fontWeight: '600',
        textAlign: 'center', lineHeight: 18,
    },

    // Grid de bolsos
    gridBolsos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    cardBolso: {
        width: '47%', backgroundColor: '#1b1d24',
        borderRadius: 8, padding: 16,
        alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: '#26282f',
    },
    iconoBolsoBox: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#2d1515',
        alignItems: 'center', justifyContent: 'center',
    },
    nombreBolso: {
        color: '#e2e8f0', fontSize: 11, fontWeight: '800',
        letterSpacing: 0.4, textAlign: 'center',
    },
    estadoBolsoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    puntoverde: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
    estadoBolsoText: {
        color: '#22c55e', fontSize: 9, fontWeight: '800', letterSpacing: 0.6,
    },

    // Barra de progreso
    progressBox: { marginBottom: 20 },
    progressRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 6,
    },
    progressLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    badgeFaltantes: {
        backgroundColor: '#451a03', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    },
    badgeFaltantesText: {
        color: '#fcd34d', fontSize: 9, fontWeight: '900', letterSpacing: 0.6,
    },
    progressBar: {
        height: 4, backgroundColor: '#26282f', borderRadius: 2, overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 2 },

    // Cards de herramientas
    cardItem: {
        backgroundColor: '#1b1d24', borderRadius: 4, padding: 14,
        flexDirection: 'row', alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 10,
        borderLeftWidth: 3, borderLeftColor: '#334155',
    },
    cardOk: { borderLeftColor: '#22c55e' },
    cardFail: { borderLeftColor: '#dc2626', backgroundColor: '#1f1315' },
    cardItemLeft: { flex: 1, paddingRight: 10 },
    itemIconRow: { flexDirection: 'row', alignItems: 'center' },
    itemNombre: {
        color: '#e2e8f0', fontSize: 12, fontWeight: '800',
        letterSpacing: 0.4, marginBottom: 2,
    },
    itemCantidad: { color: '#475569', fontSize: 10, fontWeight: '600' },

    inputObservacion: {
        marginTop: 10,
        backgroundColor: '#2d1515',
        borderRadius: 4, padding: 10,
        color: '#fca5a5', fontSize: 11, fontWeight: '600',
        minHeight: 52, textAlignVertical: 'top',
    },

    botonesItem: { flexDirection: 'row', gap: 8 },
    btnCheck: {
        width: 36, height: 36, borderRadius: 4,
        backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
    },
    btnCheckActivo: { backgroundColor: '#166534' },
    btnFail: {
        width: 36, height: 36, borderRadius: 4,
        backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
    },
    btnFailActivo: { backgroundColor: '#dc2626' },

    // Guardar
    botonGuardar: { marginTop: 28, borderRadius: 4, overflow: 'hidden' },
    gradientGuardar: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 10, paddingVertical: 18,
    },
    textoGuardar: {
        color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2,
    },

    // Estados
    centrado: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    textoEstado: { color: '#475569', fontSize: 13, fontWeight: '600', textAlign: 'center' },
    errorCard: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#1f1315', borderRadius: 8, padding: 12,
        borderLeftWidth: 3, borderLeftColor: '#dc2626', marginBottom: 12,
    },
    errorText: { color: '#f87171', fontSize: 12, fontWeight: '600', flex: 1 },

    // ── Modo Admin ────────────────────────────────────────────────────────────────
    iconBtnActive: { backgroundColor: '#451a03' },

    adminHeaderBox: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#1a1c23', borderRadius: 8, padding: 16,
        borderWidth: 1, borderColor: '#451a03', marginBottom: 14,
    },
    adminHeaderTitulo: {
        color: '#f59e0b', fontSize: 12, fontWeight: '900', letterSpacing: 1.5,
    },
    adminHeaderSub: {
        color: '#78716c', fontSize: 10, fontWeight: '600', marginTop: 2,
    },

    btnAgregarBolso: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, backgroundColor: '#1c1a10', borderRadius: 8,
        borderWidth: 1, borderColor: '#78350f',
        borderStyle: 'dashed', paddingVertical: 16, marginBottom: 16,
    },
    btnAgregarBolsoText: {
        color: '#f59e0b', fontSize: 12, fontWeight: '900', letterSpacing: 1.5,
    },

    // Tarjeta admin
    cardBolsoAdmin: {
        backgroundColor: '#1b1d24', borderRadius: 8, padding: 14,
        borderLeftWidth: 3, marginBottom: 10,
    },
    cardBolsoAdminTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconoBolsoBoxAdmin: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
    },
    cardBolsoAdminNombre: {
        color: '#e2e8f0', fontSize: 12, fontWeight: '800', letterSpacing: 0.4,
    },
    estadoBolsoAdminRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    estadoPunto: { width: 6, height: 6, borderRadius: 3 },
    estadoBolsoAdminText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
    badgeEstadoAdmin: {
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
    },
    badgeEstadoAdminText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    // Controles admin
    controlesAdmin: {
        flexDirection: 'row', gap: 8, marginTop: 12,
        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#26282f',
    },
    btnAdminAccion: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 8, borderRadius: 4,
        borderWidth: 1, backgroundColor: '#0f1117',
    },
    btnAdminAccionText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },

    // ── Modal crear bolso ─────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(10, 12, 18, 0.88)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#1a1c23', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 24, paddingBottom: 40,
        borderTopWidth: 1, borderColor: '#26282f',
    },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
    },
    modalTitulo: {
        color: '#f59e0b', fontSize: 14, fontWeight: '900', letterSpacing: 1.5,
    },
    modalSub: {
        color: '#64748b', fontSize: 12, fontWeight: '500', lineHeight: 18,
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: '#12141a', borderRadius: 8, padding: 14,
        color: '#e2e8f0', fontSize: 13, fontWeight: '600',
        borderWidth: 1, borderColor: '#334155', marginBottom: 20,
    },
    modalBotones: { flexDirection: 'row', gap: 10 },
    modalBtnCancelar: {
        flex: 1, paddingVertical: 14, borderRadius: 8,
        borderWidth: 1, borderColor: '#334155', alignItems: 'center',
    },
    modalBtnCancelarText: { color: '#64748b', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    modalBtnCrear: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14, borderRadius: 8,
        backgroundColor: '#f59e0b',
    },
    modalBtnCrearText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});




