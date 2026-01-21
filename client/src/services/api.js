import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/updateprofile', data),
    updatePassword: (data) => api.put('/auth/updatepassword', data),
};

// Projects API
export const projectsAPI = {
    getAll: () => api.get('/projects'),
    getOne: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`),
    addTeamMember: (id, data) => api.post(`/projects/${id}/team`, data),
    removeTeamMember: (id, data) => api.delete(`/projects/${id}/team`, { data }),
};

// Tasks API
export const tasksAPI = {
    getAll: (projectId) => api.get('/tasks', { params: { project: projectId } }),
    getOne: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
    updatePosition: (id, data) => api.put(`/tasks/${id}/position`, data),
    uploadAttachment: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/tasks/${id}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    deleteAttachment: (id, fileId) => api.delete(`/tasks/${id}/attachments/${fileId}`)
};

// Activities API
export const activitiesAPI = {
    getAll: (params) => api.get('/activities', { params }),
    getProjectActivities: (projectId, params) => api.get(`/activities/project/${projectId}`, { params }),
    getUserActivities: (userId, params) => api.get(`/activities/user/${userId}`, { params })
};

// Users API
export const usersAPI = {
    getAll: () => api.get('/users'),
    getOne: (id) => api.get(`/users/${id}`),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};

export default api;
