import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  timeout: 10000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const authAPI = {
  login: (data) => API.post("/auth/login", data),
  register: (data) => API.post("/auth/register", data),
  getMe: () => API.get("/auth/me"),
  updatePreferences: (prefs) =>
    API.put("/auth/preferences", { preferences: prefs }),
  changePassword: (data) => API.put("/auth/password", data),
};

export const tasksAPI = {
  getAll: (params) => API.get("/tasks", { params }),
  getById: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post("/tasks", data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => API.patch(`/tasks/${id}/status`, { status }),
  bulkUpdateStatus: (ids, status) =>
    API.patch("/tasks/bulk/status", { ids, status }),
  bulkDelete: (ids) => API.delete("/tasks/bulk", { data: { ids } }),
  toggleSubtask: (taskId, subtaskId) =>
    API.patch(`/tasks/${taskId}/subtask/${subtaskId}`),
  timeLog: (id, action, note) =>
    API.post(`/tasks/${id}/timelog`, { action, note }),
  delete: (id) => API.delete(`/tasks/${id}`),
  deleteAll: () => API.delete("/tasks"),
  getCalendar: (year, month) => API.get(`/tasks/calendar/${year}/${month}`),
  compareAlgorithms: () => API.get("/tasks/schedule/compare"),
  getConflicts: () => API.get("/tasks/conflicts"),
  getTags: () => API.get("/tasks/tags"),
};

export const statsAPI = {
  getDashboard: () => API.get("/stats/dashboard"),
  getProductivity: () => API.get("/stats/productivity"),
};

export default API;
