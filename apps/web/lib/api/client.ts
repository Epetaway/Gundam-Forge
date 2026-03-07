import { withBasePath } from '@/lib/utils/basePath';

interface ApiErrorPayload {
  ok?: false;
  error?: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

export interface ApiSuccessPayload<T> {
  ok: true;
  data: T;
  requestId?: string;
}

export async function fetchJsonOrThrow<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(withBasePath(path), { cache: 'no-store', ...init });

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }

    const suffix = payload?.requestId ? ` [requestId=${payload.requestId}]` : '';
    const message = payload?.error ?? `Request failed (${response.status})`;
    throw new Error(`${message}${suffix}`);
  }

  return (await response.json()) as T;
}

export async function fetchApiDataOrThrow<T>(path: string, init?: RequestInit): Promise<T> {
  const payload = await fetchJsonOrThrow<ApiSuccessPayload<T>>(path, init);
  return payload.data;
}
