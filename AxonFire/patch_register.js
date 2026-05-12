const fs = require('fs');
const path = '/Users/juampi/Desktop/App-AxonFire-Frontend/AxonFire/src/screens/RegisterScreen.js';
let content = fs.readFileSync(path, 'utf8');

// Add Modal to imports
content = content.replace("SafeAreaView\n} from 'react-native';", "SafeAreaView,\n  Modal\n} from 'react-native';");

// Add DropdownField component
const dropdownField = `
const DropdownField = ({ label, icon, value, onSelect, options, showPicker, setShowPicker }) => {
  const selectedOption = options.find(o => o.id === value);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={styles.inputWrapper} 
        onPress={() => setShowPicker(true)}
      >
        <MaterialCommunityIcons name={icon} size={20} color="#90a4ae" style={styles.inputIcon} />
        <Text style={[styles.input, { color: selectedOption ? '#fff' : '#455a64' }]}>
          {selectedOption ? selectedOption.nombre : 'Selecciona tu rango'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#90a4ae" />
      </TouchableOpacity>

      <Modal visible={showPicker} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SELECCIONAR RANGO</Text>
            {options.map((opt) => (
              <TouchableOpacity 
                key={opt.id} 
                style={styles.modalOption}
                onPress={() => { onSelect(opt.id); setShowPicker(false); }}
              >
                <Text style={styles.modalOptionText}>{opt.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
`;
content = content.replace("const InputField =", dropdownField + "\nconst InputField =");

// Replace rangosDisponibles
const newRangos = `  const rangosDisponibles = [
    { id: 'CAD', nombre: 'CADETE' },
    { id: 'BOM', nombre: 'BOMBERO' },
    { id: 'OFI', nombre: 'OFICIAL' }
  ];`;
content = content.replace(/const rangosDisponibles = \[[\s\S]*?\];/, newRangos);

// Replace RANGO InputField with DropdownField
const oldRangoInput = `<InputField
              label="RANGO"
              icon="badge-account-outline"
              placeholder="Tu rango"
              value={formData.bombero.rango}
              onChangeText={(text) => updateForm('rango', text)}
            />`;
const newRangoInput = `<DropdownField
              label="RANGO"
              icon="badge-account-outline"
              value={formData.bombero.rango}
              onSelect={(val) => updateForm('rango', val)}
              options={rangosDisponibles}
              showPicker={showRangoPicker}
              setShowPicker={setShowRangoPicker}
            />`;
content = content.replace(oldRangoInput, newRangoInput);

// Add styles
const modalStyles = `
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#90a4ae',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalOptionText: {
    color: '#fff',
    fontSize: 16,
  },`;
content = content.replace("statusText: {", modalStyles + "\n  statusText: {");

fs.writeFileSync(path, content, 'utf8');
console.log('Patched RegisterScreen.js');
