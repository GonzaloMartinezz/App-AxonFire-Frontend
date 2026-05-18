const fs = require('fs');
const path = '/Users/juampi/Desktop/App-AxonFire-Frontend/AxonFire/src/screens/HomeScreen.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import React from 'react';", "import React, { useState, useEffect } from 'react';\nimport axios from 'axios';\nimport { useAuth } from '../context/AuthContext';\nimport { API_BASE_URL } from '../config/api';");

const fetchLogic = `
  const { user, token } = useAuth();
  const [latestAlert, setLatestAlert] = useState(null);

  useEffect(() => {
    const fetchLatestAlert = async () => {
      try {
        const res = await axios.get(\`\${API_BASE_URL}/alerta/rango\`, {
          headers: { Authorization: \`Bearer \${token}\` },
          data: { fecha_desde: "2020-01-01", fecha_hasta: "2030-01-01" }
        });
        if (res.data && res.data.alertas && res.data.alertas.length > 0) {
          const sorted = res.data.alertas.sort((a,b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
          setLatestAlert(sorted[0]);
        }
      } catch (e) {
        console.log('Error fetching home alert:', e.message);
      }
    };
    fetchLatestAlert();
  }, [token]);
`;

content = content.replace("export default function HomeScreen({ navigation }) {\n  const QuickAction", "export default function HomeScreen({ navigation }) {\n" + fetchLogic + "\n  const QuickAction");

content = content.replace(
  "<Text style={styles.bannerDesc}>Incendio Forestal - Sector Alpha 4</Text>",
  "<Text style={styles.bannerDesc}>{latestAlert ? (latestAlert.observaciones || 'Incidente no especificado') + ' - ' + (latestAlert.ubicacion || '') : 'Sin alertas recientes'}</Text>"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched HomeScreen.js');
