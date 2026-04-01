import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/api/auth/register/', data),
  
  login: (email: string, password: string) =>
    api.post('/api/auth/login/', { email, password }),
  
  logout: () => api.post('/api/auth/logout/'),
  
  getCurrentUser: () => api.get('/api/auth/me/'),
};

// Students API
export const studentsAPI = {
  getAll: (params?: any) => api.get('/api/students/', { params }),
  
  getById: (id: number) => api.get(`/api/students/${id}/`),
  
  create: (data: any) => api.post('/api/students/', data),
  
  update: (id: number, data: any) => api.put(`/api/students/${id}/`, data),
  
  delete: (id: number) => api.delete(`/api/students/${id}/`),
  
  generateQR: (id: number) => api.post(`/api/students/${id}/generate-qr/`),
  
  getQRCode: (id: number) => api.get(`/api/students/${id}/qr-code/`),
};

// Classes API
export const classesAPI = {
  getAll: () => api.get('/api/classes/'),
  
  getById: (id: number) => api.get(`/api/classes/${id}/`),
  
  create: (data: any) => api.post('/api/classes/', data),
  
  update: (id: number, data: any) => api.put(`/api/classes/${id}/`, data),
  
  delete: (id: number) => api.delete(`/api/classes/${id}/`),
  
  getStudents: (id: number) => api.get(`/api/classes/${id}/students/`),
};

export const attendanceAPI = {
  getForm: (classId: number, date: string) =>
    api.get('/api/attendance/take/', { params: { class_id: classId, date } }),
  
  mark: (data: any) => api.post('/api/attendance/mark/', data),
  
  validateQR: (qrData: string) =>
    api.post('/api/attendance/validate-qr/', { qr_data: qrData }),
  
  getPrevious: (classId: number, limit: number = 10) =>
    api.get('/api/attendance/previous/', { params: { class_id: classId, limit } }),
};

export const dashboardAPI = {
  getAdminDashboard: () => api.get('/api/attendance/dashboard/admin/'),
  
  getTeacherDashboard: (teacherId: number) =>
    api.get('/api/attendance/dashboard/teacher/', { params: { teacher_id: teacherId } }),
};

export const gradesAPI = {
  getAll: () => api.get('/api/grades/'),
  create: (data: any) => api.post('/api/grades/', data),
};

export const termsAPI = {
  getAll: (gradeId?: number) =>
    api.get('/api/terms/', { params: gradeId ? { grade_id: gradeId } : {} }),
  create: (data: any) => api.post('/api/terms/', data),
};

export const subjectsAPI = {
  getAll: (gradeId?: number, termId?: number) =>
    api.get('/api/subjects/', { params: { grade_id: gradeId, term_id: termId } }),
  create: (data: any) => api.post('/api/subjects/', data),
};

export const performanceAPI = {
  getAll: (params?: any) => api.get('/api/performance/', { params }),
  create: (data: any) => api.post('/api/performance/', data),
  getSummary: (studentId: number, termId?: number) =>
    api.get(`/api/performance/student/${studentId}/summary/`, {
      params: termId ? { term_id: termId } : {},
    }),
};

// Reports API
export const reportsAPI = {
  // Get attendance report with filters
  getAttendanceReport: (params: {
    start_date?: string;
    end_date?: string;
    class_id?: string;
    student_id?: string;
    status?: string;
  }) => api.get('/api/reports/attendance/', { params }),
  
  // Get class-wise summary
  getClassSummary: (params: {
    start_date?: string;
    end_date?: string;
  }) => api.get('/api/reports/class-summary/', { params }),
  
  // Get student-wise summary
  getStudentSummary: (params: {
    start_date?: string;
    end_date?: string;
    class_id?: string;
  }) => api.get('/api/reports/student-summary/', { params }),
  
  // Export CSV
  exportCSV: (params: {
    start_date?: string;
    end_date?: string;
    class_id?: string;
  }) => api.get('/api/reports/export-csv/', { 
    params,
    responseType: 'blob'
  }),
};
