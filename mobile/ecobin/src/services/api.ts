// Configuração da API
const API_URL = 'http://localhost:3000/api'; // Altere para sua URL de produção

/**
 * Função genérica para fazer requisições
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // GET request
  get: <T>(endpoint: string): Promise<T> => {
    return fetchApi<T>(endpoint, { method: 'GET' });
  },

  // POST request
  post: <T>(endpoint: string, data: unknown): Promise<T> => {
    return fetchApi<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT request
  put: <T>(endpoint: string, data: unknown): Promise<T> => {
    return fetchApi<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE request
  delete: <T>(endpoint: string): Promise<T> => {
    return fetchApi<T>(endpoint, { method: 'DELETE' });
  },
};
