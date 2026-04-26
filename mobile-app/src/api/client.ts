import axios from "axios";
import { API_BASE_URL } from "@/config/env";
import { useTenantStore } from "@/store/tenant.store";
import { useAuthStore } from "@/store/auth.store";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request: inject Host header (tenant) + Cookie header (auth)
apiClient.interceptors.request.use((config) => {
  const { domain } = useTenantStore.getState();
  const { token } = useAuthStore.getState();

  if (domain) {
    config.headers["Host"] = domain;
  }
  if (token) {
    config.headers["Cookie"] = `customer-token=${token}`;
  }

  return config;
});

// Response: extract JWT from Set-Cookie on login/register
apiClient.interceptors.response.use(
  (response) => {
    const setCookieHeader = response.headers["set-cookie"];
    const cookieStr = Array.isArray(setCookieHeader)
      ? setCookieHeader.join("; ")
      : setCookieHeader ?? "";

    if (cookieStr.includes("customer-token=")) {
      const match = cookieStr.match(/customer-token=([^;,\s]+)/);
      if (match?.[1]) {
        useAuthStore.getState().setToken(match[1]);
      }
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
