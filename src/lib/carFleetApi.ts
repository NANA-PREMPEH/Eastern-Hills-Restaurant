import { CarListing } from '../data/carFleet';

export interface RemoteCarImageUploadPayload {
  contentType: string;
  dataUrl: string;
  fileName: string;
}

export class CarFleetApiUnavailableError extends Error {}

export class CarFleetApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CarFleetApiError';
    this.status = status;
  }
}

const parseResponsePayload = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as { cars?: CarListing[]; error?: string; url?: string };
  } catch {
    return { error: text };
  }
};

const requestJson = async <T>(input: RequestInfo | URL, init?: RequestInit) => {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch (error) {
    throw new CarFleetApiUnavailableError(
      error instanceof Error ? error.message : 'The backend API is unavailable.'
    );
  }

  const payload = await parseResponsePayload(response);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (response.status === 404 || response.status === 405 || response.status === 503) {
    throw new CarFleetApiUnavailableError(payload?.error || 'The backend API is unavailable.');
  }

  if (!response.ok) {
    throw new CarFleetApiError(payload?.error || 'The request failed.', response.status);
  }

  if (!contentType.includes('application/json')) {
    throw new CarFleetApiUnavailableError('The backend API returned an unexpected response.');
  }

  return payload as T;
};

export const fetchRemoteCarFleet = async () => {
  const payload = await requestJson<{ cars: CarListing[] }>('/api/car-fleet', {
    cache: 'no-store',
  });

  if (!Array.isArray(payload.cars)) {
    throw new CarFleetApiUnavailableError('The backend API returned an invalid fleet payload.');
  }

  return payload.cars;
};

export const saveRemoteCarFleet = async (cars: CarListing[], adminPin: string) => {
  await requestJson<{ ok: boolean }>('/api/car-fleet', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify({ cars }),
  });
};

export const uploadRemoteCarImage = async (
  payload: RemoteCarImageUploadPayload,
  adminPin: string
) => {
  const response = await requestJson<{ url: string }>('/api/car-fleet/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify(payload),
  });

  return response.url;
};
