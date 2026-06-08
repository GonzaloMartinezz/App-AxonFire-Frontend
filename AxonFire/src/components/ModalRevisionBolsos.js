import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Hook personalizado para manejar el estado del modal de revisión de bolsos.
 */
export function useRevisionBolsos() {
  const [visible, setVisible] = useState(false);
  const [alertaId, setAlertaId] = useState(null);
  const [navigation, setNavigation] = useState(null);
  const [token, setToken] = useState(null);

  const mostrar = ({ token: t, navigation: nav, alertaId: id }) => {
    setToken(t);
    setNavigation(nav);
    setAlertaId(id);
    setVisible(true);
  };

  const ocultar = () => {
    setVisible(false);
  };

  return {
    visible,
    alertaId,
    navigation,
    token,
    mostrar,
    ocultar,
  };
}

/**
 * Componente modal premium que sugiere la revisión de bolsos de emergencia.
 */
export default function ModalRevisionBolsos({ estado }) {
  if (!estado || !estado.visible) return null;

  const handleRevisar = () => {
    if (estado.navigation) {
      estado.navigation.navigate('ChecklistBolsos', {
        alertaId: estado.alertaId,
        token: estado.token,
      });
    }
    estado.ocultar();
  };

  return (
    <Modal
      transparent
      visible={estado.visible}
      animationType="fade"
      onRequestClose={estado.ocultar}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icono superior con degradado */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#dc2626', '#991b1b']}
              style={styles.iconGradient}
            >
              <MaterialCommunityIcons name="bag-personal-outline" size={32} color="#fff" />
            </LinearGradient>
          </View>

          {/* Información */}
          <Text style={styles.title}>¡Emergencia Finalizada!</Text>
          <Text style={styles.description}>
            ¿Utilizaste bolsos de trauma, cuerdas o rescate en esta emergencia?
            {"\n\n"}
            Registrá el control de los materiales inmediatamente para asegurar que queden repuestos y listos para la próxima salida.
          </Text>

          {/* Botones de acción */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleRevisar}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#dc2626', '#991b1b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBtn}
              >
                <MaterialCommunityIcons name="clipboard-check-outline" size={16} color="#fff" />
                <Text style={styles.btnPrimaryText}>REVISAR BOLSOS</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={estado.ocultar}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>OMITIR POR AHORA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 18, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#16181d',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#26282f',
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 20,
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: '#90a4ae',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },
  buttonGroup: {
    width: '100%',
    gap: 8,
  },
  btnPrimary: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  btnSecondary: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
