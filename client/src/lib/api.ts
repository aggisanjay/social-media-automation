import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to inject the JWT token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh automatically on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", data.accessToken);
        }
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          // Only redirect if we are not on landing page or login page
          if (window.location.pathname !== "/" && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  async login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
  },
  async register(name, email, password) {
    const { data } = await api.post("/auth/register", { name, email, password });
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
  },
  async logout() {
    await api.post("/auth/logout");
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
  },
  getCurrentUser() {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Dashboard Services
export const dashboardService = {
  async getStats() {
    const { data } = await api.get("/dashboard/stats");
    return data.stats;
  },
  async getActivity() {
    const { data } = await api.get("/dashboard/activity");
    return data.activity;
  },
};

// Social Accounts Services
export const accountsService = {
  async getAccounts() {
    const { data } = await api.get("/social/accounts");
    return data.accounts;
  },
  async getConnectUrl(platform) {
    const { data } = await api.post(`/social/connect/${platform}`);
    return data;
  },
  async disconnectAccount(id) {
    const { data } = await api.delete(`/social/accounts/${id}`);
    return data;
  },
  async syncAccounts() {
    const { data } = await api.post("/social/sync");
    return data.accounts;
  },
};

// Post Scheduler Services
export const postsService = {
  async createPost(formData) {
    // Uses multipart/form-data for file uploads
    const { data } = await api.post("/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.post;
  },
  async getUpcoming() {
    const { data } = await api.get("/posts/upcoming");
    return data.posts;
  },
  async getPublished() {
    const { data } = await api.get("/posts/published");
    return data.posts;
  },
  async deletePost(id) {
    await api.delete(`/posts/${id}`);
  },
  async publishImmediately(id) {
    const { data } = await api.post(`/posts/${id}/publish`);
    return data.post;
  },
};

// AI Composer Services
export const aiService = {
  async generateContent(prompt, tone, generateImage = false) {
    const { data } = await api.post("/ai/generate", { prompt, tone, generateImage });
    return data.generation;
  },
  async getHistory() {
    const { data } = await api.get("/ai/history");
    return data.history;
  },
};
