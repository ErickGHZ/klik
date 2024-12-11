import axios from 'axios';

// Aquí va la URL de tu servidor
const API_URL = 'https://klik-api.onrender.com/api/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
