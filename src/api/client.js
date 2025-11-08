import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const charactersApi = {
  getAll: () => apiClient.get('/characters'),
  getById: (id) => apiClient.get(`/characters/${id}`),
};

export const costumesApi = {
  getAll: () => apiClient.get('/costumes'),
};

export const memoriesApi = {
  getAll: () => apiClient.get('/memories'),
};

export default apiClient;
