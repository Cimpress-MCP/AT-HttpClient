import { AxiosError } from 'axios';

export function serializeError(
  error: AxiosError,
): { status: number; statusText: string; data: any } | undefined {
  if (!error.response) {
    return undefined;
  }

  const { status, statusText, data } = error.response;
  return {
    status,
    statusText,
    data,
  };
}
