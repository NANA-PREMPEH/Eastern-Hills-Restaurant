import { MenuItem } from '../types';

export interface RemoteImageUploadPayload {
  contentType: string;
  dataUrl: string;
  fileName: string;
}

export class MenuApiUnavailableError extends Error {}

export class MenuApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'MenuApiError';
    this.status = status;
  }
}

export interface BackendDiagnostics {
  blob: {
    configured: boolean;
    message: string;
    ok: boolean;
    sampleCount?: number;
    samplePathname?: null | string;
  };
  checkedAt: string;
  database: {
    configured: boolean;
    menuItemCount?: number;
    message: string;
    ok: boolean;
    updatedAt?: null | string;
  };
  environment: string;
  runtime: string;
  status: 'degraded' | 'ok';
}

const parseResponsePayload = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as { error?: string; items?: MenuItem[]; url?: string };
  } catch {
    return { error: text };
  }
};

const requestJson = async <T>(input: RequestInfo | URL, init?: RequestInit) => {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch (error) {
    throw new MenuApiUnavailableError(
      error instanceof Error ? error.message : 'The backend API is unavailable.'
    );
  }

  const payload = await parseResponsePayload(response);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (response.status === 404 || response.status === 405 || response.status === 503) {
    throw new MenuApiUnavailableError(payload?.error || 'The backend API is unavailable.');
  }

  if (!response.ok) {
    throw new MenuApiError(payload?.error || 'The request failed.', response.status);
  }

  if (!contentType.includes('application/json')) {
    throw new MenuApiUnavailableError('The backend API returned an unexpected response.');
  }

  return payload as T;
};

export const fetchRemoteMenuItems = async () => {
  const payload = await requestJson<{ items: MenuItem[] }>('/api/menu', {
    cache: 'no-store',
  });

  if (!Array.isArray(payload.items)) {
    throw new MenuApiUnavailableError('The backend API returned an invalid menu payload.');
  }

  return payload.items;
};

export const saveRemoteMenuItems = async (items: MenuItem[], adminPin: string) => {
  await requestJson<{ ok: boolean }>('/api/menu', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify({ items }),
  });
};

export const uploadRemoteMenuImage = async (
  payload: RemoteImageUploadPayload,
  adminPin: string
) => {
  const response = await requestJson<{ url: string }>('/api/menu/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify(payload),
  });

  return response.url;
};

export const fetchBackendDiagnostics = async (adminPin: string) => {
  return requestJson<BackendDiagnostics>('/api/admin/diagnostics', {
    headers: {
      'x-admin-pin': adminPin,
    },
    cache: 'no-store',
  });
};
