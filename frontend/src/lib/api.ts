// API URL - siempre apunta al backend expuesto
const API_URL = 'http://localhost:3001/api';

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = 'Error desconocido';
    
    try {
      const error = await response.json();
      errorMessage = error.error || `Error HTTP ${response.status}`;
    } catch {
      // Si no se puede parsear el JSON, usar mensajes según el código de estado
      if (response.status === 0 || response.status >= 500) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else if (response.status === 404) {
        errorMessage = 'El recurso solicitado no fue encontrado.';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción.';
      } else {
        errorMessage = `Error del servidor (${response.status}). Por favor, intenta nuevamente.`;
      }
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

export function getAuthHeaders(username: string, password: string) {
  const credentials = btoa(`${username}:${password}`);
  return {
    Authorization: `Basic ${credentials}`,
  };
}

