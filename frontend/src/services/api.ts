import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      if (typeof data === 'string' && data.length > 0) return data;
      if (data.message && typeof data.message === 'string') return data.message;
      if (Array.isArray(data.errors) && data.errors.length > 0) return data.errors[0].message;
      if (data.error && typeof data.error === 'string') return data.error;
    }
    if (!error.response) return 'Sem conexão com o servidor. Verifique sua internet.';
    if (error.response.status === 500) return 'Erro interno no servidor. Tente novamente.';
    if (error.response.status === 404) return 'Recurso não encontrado.';
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

export default api;
