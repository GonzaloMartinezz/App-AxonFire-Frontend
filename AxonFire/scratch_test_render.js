const axios = require('axios');
const API_BASE_URL = 'https://axon-fire-back.onrender.com';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFiYzEiLCJyb2wiOiJBRE1JTiIsImlhdCI6MTc3ODYxNTE4MCwiZXhwIjoxNzc4NjE4NzgwfQ.8GA-oqPKHUQ7iztVrOTahGB4zMOCYryX0tOb9YZBzVM';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

async function test() {
  console.log('Testing with params...');
  try {
    const res = await axios.get(`${API_BASE_URL}/alerta/rango`, {
      params: {
        fecha_desde: '2020-01-01T00:00:00.000Z',
        fecha_hasta: '2030-01-01T00:00:00.000Z'
      },
      headers
    });
    console.log('Params success! Count:', Array.isArray(res.data) ? res.data.length : res.data?.alertas?.length);
    console.log('Sample data:', JSON.stringify(res.data).substring(0, 300));
  } catch (err) {
    console.log('Params error:', err.message, err.response?.data);
  }

  console.log('\nTesting with data (request body)...');
  try {
    const res = await axios.get(`${API_BASE_URL}/alerta/rango`, {
      data: {
        fecha_desde: '2020-01-01T00:00:00.000Z',
        fecha_hasta: '2030-01-01T00:00:00.000Z'
      },
      headers
    });
    console.log('Data success! Count:', Array.isArray(res.data) ? res.data.length : res.data?.alertas?.length);
    console.log('Sample data:', JSON.stringify(res.data).substring(0, 300));
  } catch (err) {
    console.log('Data error:', err.message, err.response?.data);
  }
}

test();
