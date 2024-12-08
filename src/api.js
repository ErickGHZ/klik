import axios from 'axios';

// Aquí va la URL de tu servidor
const API_URL = 'http://192.168.1.75:5000/api/auth';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
