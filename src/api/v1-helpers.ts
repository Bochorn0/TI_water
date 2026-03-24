import { v1Client } from './v1-client';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function req<T>(method: Method, url: string, data?: object, params?: object): Promise<T> {
  const res = await v1Client.request<T>({ url, method, data, params });
  return res.data;
}

export const v1Get = <T>(url: string, params?: object) => req<T>('GET', url, undefined, params);
export const v1Post = <T>(url: string, data: object) => req<T>('POST', url, data);
export const v1Patch = <T>(url: string, data: object) => req<T>('PATCH', url, data);
export const v1Delete = <T>(url: string) => req<T>('DELETE', url);
