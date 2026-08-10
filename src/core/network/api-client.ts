// src/core/network/api-client.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { env } from '@/core/config/env';

const ACCESS_TOKEN_KEY = 'nutriai_access_token';
const REFRESH_TOKEN_KEY = 'nutriai_refresh_token';
const MAX_RETRIES = 2;
const RETRY_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

class TokenStore {
  private accessToken: string | null = null;

  async getAccessToken(): Promise<string | null> {
    if (this.accessToken) return this.accessToken;
    const stored = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    this.accessToken = stored;
    return stored;
  }

  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    this.accessToken = accessToken;
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }

  async clear(): Promise<void> {
    this.accessToken = null;
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}

export const tokenStore = new TokenStore();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryRefreshToken(instance: AxiosInstance): Promise<boolean> {
  const refreshToken = await tokenStore.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await instance.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken },
    );
    await tokenStore.setTokens(response.data.accessToken, response.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: env.apiTimeoutMs,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  instance.interceptors.request.use(async (config) => {
    const token = await tokenStore.getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetryableRequestConfig | undefined;
      if (!config) {
        return Promise.reject(error);
      }

      const status = error.response?.status;
      const isRetryableStatus = status !== undefined && RETRY_STATUS_CODES.has(status);
      const isNetworkError = !error.response;
      config.__retryCount = config.__retryCount ?? 0;

      if ((isRetryableStatus || isNetworkError) && config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        const backoffMs = 300 * 2 ** (config.__retryCount - 1);
        await wait(backoffMs);
        return instance(config);
      }

      if (status === 401 && config.__retryCount === 0) {
        const refreshed = await tryRefreshToken(instance);
        if (refreshed) {
          config.__retryCount += 1;
          return instance(config);
        }
        await tokenStore.clear();
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

export const apiClient = createApiClient();

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}