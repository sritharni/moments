import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import {
  clearStoredRefreshToken,
  clearStoredToken,
  getStoredRefreshToken,
  getStoredToken,
  storeRefreshToken,
  storeToken,
} from '@/features/auth/utils/token-storage';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

type QueueItem = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let refreshQueue: QueueItem[] = [];

function processQueue(err: unknown, token: string | null) {
  for (const item of refreshQueue) {
    if (err || token === null) {
      item.reject(err);
    } else {
      item.resolve(token);
    }
  }
  refreshQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as {
      config?: InternalAxiosRequestConfig & { _retry?: boolean };
      response?: { status: number };
    };

    const status = axiosError.response?.status ?? null;
    const config = axiosError.config;

    if (status !== 401 || !config || config._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      onUnauthorized?.();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (newToken) => {
            config.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(config));
          },
          reject,
        });
      });
    }

    config._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${env.apiBaseUrl}/auth/refresh`,
        { refreshToken },
      );

      storeToken(data.accessToken);
      storeRefreshToken(data.refreshToken);

      config.headers.Authorization = `Bearer ${data.accessToken}`;
      processQueue(null, data.accessToken);

      return apiClient(config);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      clearStoredToken();
      clearStoredRefreshToken();
      onUnauthorized?.();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);
