import React, { useState } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const InputField = ({ label, placeholder, value, onChangeText, keyboardType = 'default' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#52525b"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="words"
      />
    </View>
  </View>
);

const DropdownField = ({ label, value }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.dropdownWrapper}>
      <Text style={styles.dropdownValue}>{value}</Text>
      <MaterialCommunityIcons name="chevron-down" size={20} color="#a1a1aa" />
    </TouchableOpacity>
  </View>
);

export default function AddFirefighterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    nombres: '',
    dni: '',
    telefono: '',
    contactoEmergencia: '',
    rango: 'Probationary Firefighter',
    grupoSanguineo: 'O POSITIVE (O+)',
    unidad: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const updateForm = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const submitFirefighterData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Éxito', 'Personal guardado correctamente.');
      setFormData({
        nombres: '', dni: '', telefono: '', 
        contactoEmergencia: '', rango: 'Bombero en Período de Prueba', grupoSanguineo: 'O POSITIVO (O+)', unidad: ''
      });
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation?.navigate('Mapa')} style={styles.avatarPlaceholder}>
             <MaterialCommunityIcons name="home" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>COMANDO VANGUARDIA</Text>
        </View>
        <TouchableOpacity>
          <MaterialCommunityIcons name="cog" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header Title Section */}
            <View style={styles.headerTitleBox}>
              <View style={styles.redBorder} />
              <View>
                <Text style={styles.mainTitle}>INDUCCIÓN DE PERSONAL</Text>
                <Text style={styles.subtitle}>DEPARTAMENTO DE SERVICIOS DE EMERGENCIA // {'\n'}AXON FIRE</Text>
              </View>
            </View>

            <View style={styles.formContainer}>
              <InputField
                label="NOMBRE COMPLETO"
                placeholder="NOMBRE LEGAL DEL OPERATIVO"
                value={formData.nombres}
                onChangeText={(text) => updateForm('nombres', text)}
              />

              <InputField
                label="DNI / NÚMERO DE IDENTIDAD"
                placeholder="00-00000000-0"
                keyboardType="numeric"
                value={formData.dni}
                onChangeText={(text) => updateForm('dni', text)}
              />

              <InputField
                label="NÚMERO DE CONTACTO"
                placeholder="+1 (555) 000-0000"
                keyboardType="phone-pad"
                value={formData.telefono}
                onChangeText={(text) => updateForm('telefono', text)}
              />

              <InputField
                label="INFORMACIÓN DE CONTACTO DE EMERGENCIA"
                placeholder="NOMBRE - RELACIÓN - TELÉFONO..."
                value={formData.contactoEmergencia}
                onChangeText={(text) => updateForm('contactoEmergencia', text)}
              />

              <DropdownField 
                label="RANGO / JERARQUÍA"
                value={formData.rango}
              />

              <DropdownField 
                label="GRUPO SANGUÍNEO"
                value={formData.grupoSanguineo}
              />

              <InputField
                label="ASIGNACIÓN DE UNIDAD"
                placeholder="ID ESTACIÓN - DESIGNACIÓN VEHÍCULO"
                value={formData.unidad}
                onChangeText={(text) => updateForm('unidad', text)}
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={submitFirefighterData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                    <Text style={styles.buttonText}>GUARDAR PERSONAL</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
               <TouchableOpacity style={styles.actionBtn}>
                 <MaterialCommunityIcons name="printer" size={16} color="#e2e8f0" />
                 <Text style={styles.actionBtnText}>IMPRIMIR CREDENCIAL</Text>
               </TouchableOpacity>
               <View style={styles.divider} />
               <TouchableOpacity style={styles.actionBtn}>
                 <MaterialCommunityIcons name="history" size={16} color="#e2e8f0" />
                 <Text style={styles.actionBtnText}>REGISTRO DE AUDITORÍA</Text>
               </TouchableOpacity>
            </View>
            
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Fake Bottom Nav */}
      <View style={styles.fakeBottomNav}>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="map" size={24} color="#64748b" />
          <Text style={styles.navLabel}>TÁCTICO</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="account-group" size={24} color="#64748b" />
          <Text style={styles.navLabel}>UNIDADES</Text>
        </View>
        <View style={styles.sosContainer}>
           <MaterialCommunityIcons name="asterisk" size={28} color="#fff" />
        </View>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="history" size={24} color="#64748b" />
          <Text style={styles.navLabel}>REGISTROS</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="chart-box" size={24} color="#64748b" />
          <Text style={styles.navLabel}>ESTADO</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#dc2626',
    marginRight: 12,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  formContainer: {
    backgroundColor: '#1b1d24',
    padding: 24,
    borderRadius: 4,
  },
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
  input: {
    color: '#e2e8f0',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
  primaryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
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
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#334155',
  },
  fakeBottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: '#16181d',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#26282f',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingBottom: 6,
  },
  navItemActive: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingBottom: 6,
    position: 'relative',
  },
  activeBar: {
    position: 'absolute',
    top: -10,
    width: '80%',
    height: 2,
    backgroundColor: '#dc2626',
  },
  navLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosContainer: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    gap: 4,
    flex: 1.2,
    marginBottom: 6,
  },
  sosLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  }
});