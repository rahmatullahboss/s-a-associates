const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

interface ApiFetchOptions extends RequestInit {
  credentials?: RequestCredentials;
}

// #12 — Structured API error with optional code for specific handling
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly raw: unknown;

  constructor(message: string, status: number, code?: string, raw?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.raw = raw;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;

  // #5 — Don't force Content-Type for FormData (browser sets multipart boundary automatically)
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = isFormData
    ? {}
    : { "Content-Type": "application/json" };

  // Merge any explicitly provided headers (caller can still override)
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(url, {
    ...options,
    credentials: options.credentials ?? "include",
    headers,
  });

  const data = await response.json() as Record<string, unknown>;

  if (!response.ok) {
    // #12 — Preserve structured error: message + optional code + raw response
    throw new ApiError(
      (data.error as string) || "Request failed",
      response.status,
      data.code as string | undefined,
      data
    );
  }

  return data as T;
}

export { API_BASE };
