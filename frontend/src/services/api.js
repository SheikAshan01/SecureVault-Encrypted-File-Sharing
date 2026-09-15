const BASE_URL = '/api';

export function getToken() {
  return localStorage.getItem('secure_token') || '';
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('secure_token', token);
  } else {
    localStorage.removeItem('secure_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData, add JSON content-type
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle blob responses (e.g. file download)
  if (options.isBlob) {
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || `Download error: ${response.status}`);
    }
    return await response.blob();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  register: (name, email, password, role) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  }),
  getMe: () => request('/auth/me'),
  getRecipients: () => request('/auth/recipients'),

  // Files
  uploadFile: (formData) => request('/files/upload', {
    method: 'POST',
    body: formData,
  }),
  getMyFiles: () => request('/files/my-files'),
  getSharedWithMe: () => request('/files/shared-with-me'),
  deleteFile: (id) => request(`/files/${id}`, { method: 'DELETE' }),
  getFileHistory: (id) => request(`/files/${id}/history`),
  downloadFile: (id) => request(`/files/${id}/download`, { isBlob: true }),

  // Sharing
  shareWithUser: (id, email, permission) => request(`/share/${id}/user`, {
    method: 'POST',
    body: JSON.stringify({ email, permission }),
  }),
  removeSharedUser: (id, email) => request(`/share/${id}/user/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  }),
  generatePublicLink: (id, settings) => request(`/share/${id}/link`, {
    method: 'POST',
    body: JSON.stringify(settings),
  }),
  revokePublicLink: (id) => request(`/share/${id}/link`, {
    method: 'DELETE',
  }),

  // Public Link endpoints
  getPublicInfo: (token) => request(`/share/info/${token}`),
  downloadPublicFile: (token, pin) => request(`/share/download/${token}`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
    isBlob: true,
  }),

  // Admin
  getAdminMetrics: () => request('/admin/metrics'),
  getAdminUsers: () => request('/admin/users'),
  toggleUserStatus: (userId) => request(`/admin/users/${userId}/toggle-status`, { method: 'PATCH' }),
  updateUserRole: (userId, role) => request(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }),
  getAdminFiles: () => request('/admin/files'),
  getAdminLogs: (limit = 100) => request(`/admin/logs?limit=${limit}`),

  // AI Security Advisor
  askAi: (prompt, context) => request('/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ prompt, context }),
  }),
};
