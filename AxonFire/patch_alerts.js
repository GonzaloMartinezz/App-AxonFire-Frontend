const fs = require('fs');
const path = '/Users/juampi/Desktop/App-AxonFire-Frontend/AxonFire/src/screens/AlertsScreen.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';\nimport axios from 'axios';\nimport { useAuth } from '../context/AuthContext';\nimport { API_BASE_URL } from '../config/api';");

const fetchLogic = `
  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(\`\${API_BASE_URL}/alerta/rango\`, {
        headers: { Authorization: \`Bearer \${token}\` },
        data: {
          fecha_desde: "2020-01-01",
          fecha_hasta: "2030-01-01"
        }
      });
      if (res.data && res.data.alertas) {
        // Map backend alerts to frontend format
        const mappedAlerts = res.data.alertas.map(a => ({
          id: a.id,
          type: a.observaciones || 'Incidente General',
          severity: 'alta', // default or mapped based on subcat
          status: a.estado_alerta_id === '3' ? 'resueltas' : 'activa',
          address: a.ubicacion || 'Ubicación no especificada',
          timeAgo: new Date(a.fecha_hora).toLocaleDateString(),
          icon: 'fire',
          iconColor: '#dc2626',
          iconBg: '#fee2e2'
        }));
        setAlerts(mappedAlerts);
      }
    } catch (e) {
      console.log('Error fetching alerts', e.message);
    } finally {
      setLoading(false);
    }
  };
`;

content = content.replace("export default function AlertsScreen({ navigation }) {\n  const [activeFilter, setActiveFilter] = useState('Activas');\n  const [showMenu, setShowMenu] = useState(false);\n  const insets = useSafeAreaInsets();", "export default function AlertsScreen({ navigation }) {\n  const [activeFilter, setActiveFilter] = useState('Activas');\n  const [showMenu, setShowMenu] = useState(false);\n  const insets = useSafeAreaInsets();\n" + fetchLogic);

content = content.replace("{ALERTS.map((alert) => (", "{alerts.map((alert) => (");

fs.writeFileSync(path, content, 'utf8');
console.log('Patched AlertsScreen.js');
