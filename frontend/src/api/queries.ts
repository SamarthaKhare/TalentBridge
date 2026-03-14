import api from './client';

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
};

// Profile
export const profileAPI = {
  get: () => api.get('/profile/candidate'),
  update: (data: any) => api.put('/profile/candidate', data),
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/profile/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Jobs
export const jobsAPI = {
  list: (params?: any) => api.get('/jobs', { params }),
  getById: (id: string) => api.get(`/jobs/${id}`),
  create: (data: any) => api.post('/jobs', data),
  update: (id: string, data: any) => api.put(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
  duplicate: (id: string) => api.post(`/jobs/${id}/duplicate`),
};

// Applications
export const applicationsAPI = {
  apply: (data: any) => api.post('/applications', data),
  mine: () => api.get('/applications/mine'),
  forJob: (jobId: string) => api.get(`/applications/job/${jobId}`),
  updateStatus: (id: string, status: string) => api.put(`/applications/${id}/status`, { status }),
  withdraw: (id: string) => api.delete(`/applications/${id}`),
  addNote: (id: string, content: string) => api.post(`/applications/${id}/notes`, { content }),
  savedJobs: () => api.get('/applications/saved-jobs'),
  toggleSave: (jobId: string) => api.post(`/applications/saved-jobs/${jobId}`),
};

// Search
export const searchAPI = {
  jobs: (params: any) => api.get('/search/jobs', { params }),
  candidates: (params: any) => api.get('/search/candidates', { params }),
  suggestSkills: (q: string) => api.get('/search/skills/suggest', { params: { q } }),
};

// Recommendations
export const recommendationsAPI = {
  jobs: () => api.get('/recommendations/jobs'),
};

// Outreach
export const outreachAPI = {
  send: (data: any) => api.post('/outreach/send', data),
  history: () => api.get('/outreach/history'),
};

// Dashboard
export const dashboardAPI = {
  hr: () => api.get('/dashboard/hr'),
  candidate: () => api.get('/dashboard/candidate'),
};
