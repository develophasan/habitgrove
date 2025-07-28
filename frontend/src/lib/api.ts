import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { username: string; password: string }) => {
    // Convert to form data for OAuth2PasswordRequestForm
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getUser: (id: string) => api.get(`/users/${id}`),
  
  updateUser: (id: string, data: any) => api.patch(`/users/${id}`, data),
  
  addFavoriteTask: (userId: string, taskId: string) => 
    api.post(`/users/${userId}/favorite-tasks/${taskId}`),
  
  removeFavoriteTask: (userId: string, taskId: string) => 
    api.delete(`/users/${userId}/favorite-tasks/${taskId}`),
}

// Tasks API
export const tasksAPI = {
  getTasks: (params?: { type?: string; category?: string; difficulty?: string }) =>
    api.get('/tasks/', { params }),
  
  getTask: (id: string) => api.get(`/tasks/${id}`),
  
  createTask: (data: any) => api.post('/tasks/', data),
  
  // Group tasks
  getGroupTasks: (groupId: string) => api.get(`/tasks/group/${groupId}`),
  
  createGroupTask: (groupId: string, data: any) => api.post(`/tasks/group/${groupId}`, data),
  
  createBulkGroupTasks: (groupId: string, data: { tasks: any[] }) => api.post(`/tasks/group/${groupId}/bulk`, data),
  
  completeTask: (data: { task_id: string; user_id: string; group_id?: string }) =>
    api.post('/tasks/complete', data),
  
  getUserCompletions: (userId: string) => api.get(`/tasks/user/${userId}`),
  
  getGroupCompletions: (groupId: string) => api.get(`/tasks/group/${groupId}/completions`),
};

// Groups API
export const groupsAPI = {
  getGroups: () => api.get('/groups/'),
  
  createGroup: (data: { name: string; type: string }) =>
    api.post('/groups/', data),
  
  getGroup: (id: string) => api.get(`/groups/${id}`),
  
  getGroupAdmins: (groupId: string) => api.get(`/groups/${groupId}/admins`),
  
  joinGroup: (groupId: string) => api.post('/groups/join', { group_id: groupId }),
  
  getGroupCompletions: (groupId: string) => api.get(`/tasks/group/${groupId}/completions`),
};

// Admin API
export const adminAPI = {
  // User Management
  getAllUsers: (params?: { skip?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),
  
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
  
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  
  // Task Management
  getAllTasks: (params?: { skip?: number; limit?: number; type_filter?: string; category_filter?: string }) =>
    api.get('/admin/tasks', { params }),
  
  createTask: (data: any) => api.post('/admin/tasks', data),
  
  createBulkTasks: (data: { tasks: any[] }) => api.post('/admin/tasks/bulk', data),
  
  migrateTaskCategories: () => api.post('/admin/tasks/migrate-categories'),
  
  updateTask: (id: string, data: any) => api.patch(`/admin/tasks/${id}`, data),
  
  deleteTask: (id: string) => api.delete(`/admin/tasks/${id}`),
  
  // Group Management
  getAllGroups: (params?: { skip?: number; limit?: number }) =>
    api.get('/admin/groups', { params }),
  
  updateGroupAdmins: (groupId: string, adminIds: string[]) =>
    api.patch(`/admin/groups/${groupId}/admins`, adminIds),
  
  // Admin Requests Management
  getAdminRequests: (params?: { status_filter?: string; skip?: number; limit?: number }) =>
    api.get('/admin/admin-requests', { params }),
  
  reviewAdminRequest: (requestId: string, data: { status: string; admin_notes?: string }) =>
    api.patch(`/admin/admin-requests/${requestId}`, data),
  
  // Statistics
  getStatistics: (period?: string) => api.get('/admin/statistics', { params: { period } }),
};

// Admin Requests API (for users)
export const adminRequestsAPI = {
  createAdminRequest: (data: { 
    group_id: string; 
    reason: string; 
    full_name: string; 
    email: string; 
    profession: string; 
    bio: string; 
  }) => api.post('/admin-requests/', data),
  
  getMyAdminRequests: () => api.get('/admin-requests/my-requests'),
  
  getAdminRequest: (id: string) => api.get(`/admin-requests/${id}`),
};

export default api; 