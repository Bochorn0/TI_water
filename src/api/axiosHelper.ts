// src/api/axiosHelper.ts
// API helper functions for TI Water API calls

import axiosInstance from './axiosInstance';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiRequestParams {
  url: string;
  method: HttpMethod;
  data?: object;
  params?: object;
}

const apiRequest = async <T>({ url, method, data, params }: ApiRequestParams): Promise<T> => {
  try {
    const response = await axiosInstance({
      url,
      method,
      data,
      params,
    });
    return response.data;
  } catch (error: any) {
    console.error('API Request Error:', error);
    // Re-throw error for handling in components
    throw error;
  }
};

export const get = <T>(url: string, params?: object): Promise<T> =>
  apiRequest<T>({ url, method: 'GET', params });

export const post = <T>(url: string, data: object): Promise<T> =>
  apiRequest<T>({ url, method: 'POST', data });

export const put = <T>(url: string, data: object): Promise<T> =>
  apiRequest<T>({ url, method: 'PUT', data });

export const patch = <T>(url: string, data: object): Promise<T> =>
  apiRequest<T>({ url, method: 'PATCH', data });

export const del = <T>(url: string): Promise<T> =>
  apiRequest<T>({ url, method: 'DELETE' });
