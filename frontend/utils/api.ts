const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

// Helper function to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Only access localStorage in browser environment
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure token has 'Bearer ' prefix
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Generic API request function
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Something went wrong');
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return null as unknown as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request Error [${endpoint}]:`, error);
    throw error;
  }
};

// Specific API methods
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, data: any) => 
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  put: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  patch: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

// Auth specific API calls
export const authApi = {
  login: (token: string) => {
    // Store token with 'Bearer ' prefix if not already present
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', formattedToken);
    }
    return formattedToken;
  },
  
  logout: async () => {
    try {
      // Only make logout request if we have a token
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        // If unauthorized, clear the token
        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch user data');
      }

      const data = await response.json();
      return {
        id: data.user?._id || data.user?.id || '',
        email: data.user?.email || '',
        name: data.user?.name || '',
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
};
