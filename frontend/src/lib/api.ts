// API URL - detecta automáticamente según el entorno
function getApiUrl(): string {
  // Si hay una variable de entorno definida en build time, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Si estamos en el navegador, detectar automáticamente
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    // Si es localhost o 127.0.0.1, usar localhost:3001
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3001/api";
    }

    // En producción (VPS), usar el mismo hostname pero puerto 3001
    // Esto funciona cuando ambos servicios están en el mismo servidor
    return `${protocol}//${hostname}:3001/api`;
  }

  // Fallback para desarrollo (SSR o tests)
  return "http://localhost:3001/api";
}

const API_URL = getApiUrl();

// Exportar API_URL para uso en FormData
export { API_URL };

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = "Error desconocido";
    const statusCode = response.status;

    try {
      const error = await response.json();
      errorMessage = error.error || `Error HTTP ${response.status}`;
    } catch {
      // Si no se puede parsear el JSON, usar mensajes según el código de estado
      if (response.status === 0 || response.status >= 500) {
        errorMessage =
          "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
      } else if (response.status === 404) {
        errorMessage = "El recurso solicitado no fue encontrado.";
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = "No tienes permisos para realizar esta acción.";
      } else {
        errorMessage = `Error del servidor (${response.status}). Por favor, intenta nuevamente.`;
      }
    }

    const error = new Error(errorMessage);
    // Agregar el código de estado al error para que el frontend pueda detectarlo
    (error as any).status = statusCode;
    throw error;
  }

  return response.json();
}

export function getAuthHeaders(username: string, password: string) {
  const credentials = btoa(`${username}:${password}`);
  return {
    Authorization: `Basic ${credentials}`,
  };
}

// Helper para peticiones con FormData (no establece Content-Type automáticamente)
export async function apiRequestFormData<T>(
  endpoint: string,
  formData: FormData,
  authHeaders?: Record<string, string>
): Promise<T> {
  const headers: Record<string, string> = {};

  if (authHeaders) {
    Object.assign(headers, authHeaders);
  }

  // NO establecer Content-Type - el navegador lo hace automáticamente con el boundary correcto

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "Error desconocido";

    try {
      const error = await response.json();
      errorMessage = error.error || `Error HTTP ${response.status}`;
    } catch {
      // Si no se puede parsear el JSON, usar mensajes según el código de estado
      if (response.status === 0 || response.status >= 500) {
        errorMessage =
          "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
      } else if (response.status === 404) {
        errorMessage = "El recurso solicitado no fue encontrado.";
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = "No tienes permisos para realizar esta acción.";
      } else {
        errorMessage = `Error del servidor (${response.status}). Por favor, intenta nuevamente.`;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
