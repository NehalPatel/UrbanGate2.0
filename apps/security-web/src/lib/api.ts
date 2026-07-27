const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(`Cannot reach API at ${API_BASE}`, 0);
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    let message = 'Request failed';
    if (data && typeof data === 'object' && data !== null && 'error' in data) {
      const err = (data as { error?: { message?: string; details?: unknown } }).error;
      message = String(err?.message ?? 'Request failed');
      if (Array.isArray(err?.details) && err.details.length) {
        message = `${message}: ${err.details.map(String).join('; ')}`;
      }
    }
    throw new ApiError(message, response.status, data);
  }
  return data as T;
}
