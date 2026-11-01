import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find(c => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

export function setCookie(name: string, value: string, maxAge = 60 * 60 * 8) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function setAuthToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

function removeAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    const isLoginRequest = originalRequest.url?.includes('/auth/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = getCookie('refreshToken');
        if (refreshToken) {
          const { data: rawRefresh } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, { withCredentials: true });
          const refreshData = rawRefresh?.data || rawRefresh;
          setAuthToken(refreshData.accessToken);
          setCookie('accessToken', refreshData.accessToken);
          if (refreshData.refreshToken) {
            setCookie('refreshToken', refreshData.refreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${refreshData.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        removeAuthToken();
        removeCookie('accessToken');
        removeCookie('refreshToken');
        removeCookie('user');
        if (typeof window !== 'undefined') window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.accessToken) {
      setAuthToken(data.accessToken);
      setCookie('accessToken', data.accessToken);
    }
    if (data.refreshToken) setCookie('refreshToken', data.refreshToken);
    if (data.user) setCookie('user', JSON.stringify(data.user), 60 * 60 * 24);
    return data;
  },
  register: async (data: any) => {
    const { data: result } = await api.post('/auth/register', data);
    if (result.accessToken) {
      setAuthToken(result.accessToken);
      setCookie('accessToken', result.accessToken);
    }
    if (result.refreshToken) setCookie('refreshToken', result.refreshToken);
    if (result.user) setCookie('user', JSON.stringify(result.user), 60 * 60 * 24);
    return result;
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    if (data?.user) setCookie('user', JSON.stringify(data.user), 60 * 60 * 24);
    return data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      removeAuthToken();
      removeCookie('accessToken');
      removeCookie('refreshToken');
      removeCookie('user');
      window.location.href = '/';
    }
  },
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
  updateReport: (id: string, data: any) => api.put(`/production/reports/${id}`, data),
  updateStatus: (id: string, estado: string) => api.put(`/production/reports/${id}/status`, { estado }),
  getTiposHuevo: () => api.get('/production/tipos-huevo'),
};

export const ocrService = {
  processImage: (formData: FormData) => api.post('/ocr/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const excelService = {
  analyze: (formData: FormData) => api.post('/excel/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  preview: (formData: FormData, sheet?: string) => api.post('/excel/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: sheet ? { sheet } : undefined,
  }),
  importExcel: (formData: FormData) => api.post('/excel/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getReportes: (params?: { limit?: number; page?: number }) => api.get('/excel/reportes', { params }),
  getReporte: (id: string) => api.get(`/excel/reportes/${id}`),
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
  requestCorrection: (id: string, observaciones: string) => api.post(`/reconciliation/${id}/request-correction`, { observaciones }),
};

export const dashboardService = {
  getKPIs: (params?: { fecha?: string; dias?: number }) => api.get('/dashboard/kpis', { params }),
  getProduccionPorGalpon: (params?: { fecha?: string; dias?: number }) =>
    api.get('/dashboard/produccion-por-galpon', { params }),
  getTendenciaMensual: (meses?: number) => api.get('/dashboard/tendencia-mensual', { params: { meses } }),
  getMortalidadPorGalpon: (fecha?: string) => api.get('/dashboard/mortalidad-por-galpon', { params: { fecha } }),
  getResumenDiario: () => api.get('/dashboard/resumen-diario'),
  getCostosResumen: (fechaInicio?: string, fechaFin?: string) => api.get('/dashboard/costos-resumen', { params: { fechaInicio, fechaFin } }),
};

export const reportsService = {
  getDiario: (params?: { fecha?: string; galponId?: string; tipoHuevoId?: string }) => api.get('/reports/diario', { params }),
  getSemanal: (params: { fechaInicio: string; fechaFin: string; galponId?: string }) => api.get('/reports/semanal', { params }),
  getMensual: (params: { anio: number; mes: number; galponId?: string }) => api.get('/reports/mensual', { params }),
  getInventarioHuevos: (tipoHuevoId?: string) => api.get('/reports/inventario/huevos', { params: { tipoHuevoId } }),
  getInventarioAlimento: () => api.get('/reports/inventario/alimento'),
  getInventarioAves: (galponId?: string) => api.get('/reports/inventario/aves', { params: { galponId } }),
  exportCSV: (params: { tipo: string; fecha?: string; galponId?: string; tipoHuevoId?: string }) =>
    api.get('/reports/export/csv', { params, responseType: 'blob' }),
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

export const userGalponService = {
  assign: (data: { usuarioId: string; galponId: string }) => api.post('/user-galpon', data),
  unassign: (usuarioId: string, galponId: string) => api.delete(`/user-galpon/${usuarioId}/${galponId}`),
  getByUser: (usuarioId: string) => api.get(`/user-galpon/user/${usuarioId}`),
  getByGalpon: (galponId: string) => api.get(`/user-galpon/galpon/${galponId}`),
  getAll: () => api.get('/user-galpon'),
  remove: (id: string) => api.delete(`/user-galpon/${id}`),
};

export const kardexService = {
  createMovimiento: (data: any) => api.post('/kardex/movimientos', data),
  getKardex: (tipoProducto: string, params?: any) => api.get(`/kardex/${tipoProducto}`, { params }),
  getResumen: (tipoProducto: string, fecha?: string) => api.get(`/kardex/${tipoProducto}/resumen`, { params: { fecha } }),
  getHistorialGalpon: (galponId: string) => api.get(`/kardex/galpon/${galponId}`),
};

export const despachosService = {
  create: (data: any) => api.post('/despachos', data),
  getAll: (params?: any) => api.get('/despachos', { params }),
  getOne: (id: string) => api.get(`/despachos/${id}`),
  approve: (id: string) => api.post(`/despachos/${id}/approve`),
  cancel: (id: string, motivo: string) => api.post(`/despachos/${id}/cancel`, { motivo }),
};
