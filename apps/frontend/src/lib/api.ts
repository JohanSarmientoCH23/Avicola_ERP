import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authService = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  logout: (userId: string) => api.post('/auth/logout', { userId }),
};

export const galponesService = {
  getAll: () => api.get('/galpones'),
  getOne: (id: string) => api.get(`/galpones/${id}`),
  create: (data: any) => api.post('/galpones', data),
  update: (id: string, data: any) => api.put(`/galpones/${id}`, data),
  delete: (id: string) => api.delete(`/galpones/${id}`),
};

export const productionService = {
  getReports: (params?: any) => api.get('/production/reports', { params }),
  getReport: (id: string) => api.get(`/production/reports/${id}`),
  createReport: (data: any) => api.post('/production/reports', data),
  updateStatus: (id: string, estado: string) => api.put(`/production/reports/${id}/status`, { estado }),
  getTiposHuevo: () => api.get('/production/tipos-huevo'),
};

export const ocrService = {
  processImage: (formData: FormData) => api.post('/ocr/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const excelService = {
  importExcel: (formData: FormData) => api.post('/excel/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  preview: (formData: FormData) => api.post('/excel/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getReportes: (limit?: number) => api.get('/excel/reportes', { params: { limit } }),
};

export const comparisonService = {
  compare: (data: { reporteOcrId: string; reporteExcelId: string }) => api.post('/comparison/compare', data),
  getAll: (params?: any) => api.get('/comparison', { params }),
  getOne: (id: string) => api.get(`/comparison/${id}`),
};

export const inventoryService = {
  getResumen: () => api.get('/inventory/resumen'),
  getGallinas: (galponId: string, params?: any) => api.get(`/inventory/gallinas/${galponId}`, { params }),
  getHuevos: (tipoHuevoId: string, params?: any) => api.get(`/inventory/huevos/${tipoHuevoId}`, { params }),
  getAlimento: (galponId: string, params?: any) => api.get(`/inventory/alimento/${galponId}`, { params }),
  getBandejas: (galponId: string, params?: any) => api.get(`/inventory/bandejas/${galponId}`, { params }),
  createGallina: (data: any) => api.post('/inventory/gallinas', data),
  createHuevo: (data: any) => api.post('/inventory/huevos', data),
  createAlimento: (data: any) => api.post('/inventory/alimento', data),
  createBandeja: (data: any) => api.post('/inventory/bandejas', data),
};

export const reconciliationService = {
  generate: (fecha: string) => api.post('/reconciliation/generate', { fecha }),
  getAll: (params?: any) => api.get('/reconciliation', { params }),
  getOne: (id: string) => api.get(`/reconciliation/${id}`),
  approve: (id: string) => api.post(`/reconciliation/${id}/approve`),
  reject: (id: string, observaciones: string) => api.post(`/reconciliation/${id}/reject`, { observaciones }),
};

export const dashboardService = {
  getKPIs: (fecha?: string) => api.get('/dashboard/kpis', { params: { fecha } }),
  getProduccionPorGalpon: (fecha?: string) => api.get('/dashboard/produccion-por-galpon', { params: { fecha } }),
  getTendenciaMensual: (meses?: number) => api.get('/dashboard/tendencia-mensual', { params: { meses } }),
  getCostosResumen: (fechaInicio?: string, fechaFin?: string) => api.get('/dashboard/costos-resumen', { params: { fechaInicio, fechaFin } }),
};

export const reportsService = {
  getDiario: (fecha: string) => api.get('/reports/diario', { params: { fecha } }),
  getSemanal: (fechaInicio: string, fechaFin: string) => api.get('/reports/semanal', { params: { fechaInicio, fechaFin } }),
  getMensual: (anio: number, mes: number) => api.get('/reports/mensual', { params: { anio, mes } }),
  exportCSV: (tipo: string, fecha?: string) => api.get('/reports/export/csv', { params: { tipo, fecha }, responseType: 'blob' }),
};

export const auditService = {
  getAll: (params?: any) => api.get('/audit', { params }),
};

export const costsService = {
  getAll: (params?: any) => api.get('/costs', { params }),
  create: (data: any) => api.post('/costs', data),
  approve: (id: string) => api.post(`/costs/${id}/approve`),
  reject: (id: string) => api.post(`/costs/${id}/reject`),
  getResumen: (fechaInicio?: string, fechaFin?: string) => api.get('/costs/resumen', { params: { fechaInicio, fechaFin } }),
  getCategorias: () => api.get('/costs/categorias'),
  createCategoria: (data: any) => api.post('/costs/categorias', data),
  getGastosFijos: () => api.get('/costs/gastos-fijos'),
  createGastoFijo: (data: any) => api.post('/costs/gastos-fijos', data),
};

export const usersService = {
  getAll: (params?: any) => api.get('/users', { params }),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const aiService = {
  detectInconsistencias: (fecha: string) => api.get('/ai/inconsistencias', { params: { fecha } }),
  calcularConsumo: (galponId: string, gallinas: number) => api.get('/ai/consumo-esperado', { params: { galponId, gallinas } }),
  calcularPostura: (gallinas: number, edadSemanas: number) => api.get('/ai/postura-esperada', { params: { gallinas, edadSemanas } }),
};
