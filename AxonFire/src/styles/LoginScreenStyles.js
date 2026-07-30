import { StyleSheet, Platform } from "react-native";
export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    glow: {
        position: 'absolute',
        borderRadius: 500,
        width: 600,
        height: 600,
        opacity: 0.15,
    },
    redGlow: {
        backgroundColor: '#dc2626',
        top: -200,
        left: -200,
    },
    blueGlow: {
        backgroundColor: '#2563eb',
        bottom: -200,
        right: -200,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 80,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    logoBox: {
        backgroundColor: '#af101a',
        padding: 10,
        borderRadius: 12,
        marginRight: 14,
        ...Platform.select({
            ios: {
                shadowColor: '#af101a',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0px 4px 10px rgba(175, 16, 26, 0.8)',
            },
        }),
    },
    logoText: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2.5,
    },
    logoAxon: {
        color: '#fff',
    },
    logoFire: {
        color: '#dc2626',
    },
    versionText: {
        color: '#90a4ae',
        fontSize: 12,
        letterSpacing: 3,
        marginTop: 8,
        opacity: 0.8,
    },
    card: {
        backgroundColor: 'rgba(17, 24, 39, 0.7)',
        width: '100%',
        maxWidth: 440,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
            },
            android: {
                elevation: 15,
            },
            web: {
                boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
            },
        }),
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        color: '#eceff1',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.8,
    },
    forgotText: {
        color: '#af101a',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 58,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    inputIcon: {
        marginRight: 14,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    primaryButton: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonGradient: {
        height: 58,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
        marginRight: 14,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        marginVertical: 32,
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 12,
        borderRadius: 12,
    },
    securityText: {
        color: '#90a4ae',
        fontSize: 11,
        lineHeight: 18,
        marginLeft: 12,
        flex: 1,
    },
    footerLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 60,
    },
    footerLinkText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    statusFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 'auto',
        paddingTop: 60,
        paddingHorizontal: 12,
    },
    statusText: {
        color: '#37474f',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
});