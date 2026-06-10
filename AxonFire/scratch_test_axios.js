const axios = require('axios');
axios.get("http://localhost:3001/alerta/rango", {
  headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFiYzEiLCJyb2wiOiJBRE1JTiIsImlhdCI6MTc3ODYxNTE4MCwiZXhwIjoxNzc4NjE4NzgwfQ.8GA-oqPKHUQ7iztVrOTahGB4zMOCYryX0tOb9YZBzVM"
  },
  data: {
    fecha_desde: "2020-01-01",
    fecha_hasta: "2030-01-01"
  }
}).then(res => console.log(res.data)).catch(err => console.log(err.message));
