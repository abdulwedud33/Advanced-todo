import { useState, useCallback } from 'react';
import { api } from '@/utils/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const request = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data?: T; error?: Error }> => {
    setLoading(true);
    setError(null);

    try {
      let data;
      const method = options.method?.toUpperCase() || 'GET';
      const body = options.body ? JSON.parse(options.body as string) : undefined;

      switch (method) {
        case 'POST':
          data = await api.post<T>(endpoint, body);
          break;
        case 'PUT':
          data = await api.put<T>(endpoint, body);
          break;
        case 'PATCH':
          data = await api.patch<T>(endpoint, body);
          break;
        case 'DELETE':
          data = await api.delete<T>(endpoint);
          break;
        case 'GET':
        default:
          data = await api.get<T>(endpoint);
      }
      
      return { data };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      return { error };
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
};

export const useAuthApi = () => {
  const { request, loading, error } = useApi();
  
  const get = useCallback(<T>(endpoint: string) => 
    request<T>(endpoint, { method: 'GET' }), [request]);
    
  const post = useCallback(<T>(endpoint: string, data: any) => 
    request<T>(endpoint, { 
      method: 'POST',
      body: JSON.stringify(data),
    }), [request]);
    
  const put = useCallback(<T>(endpoint: string, data: any) => 
    request<T>(endpoint, { 
      method: 'PUT',
      body: JSON.stringify(data),
    }), [request]);
    
  const del = useCallback(<T>(endpoint: string) => 
    request<T>(endpoint, { method: 'DELETE' }), [request]);

  return {
    get,
    post,
    put,
    delete: del,
    loading,
    error,
  };
};
