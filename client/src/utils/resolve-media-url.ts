import { env } from '@/config/env';

export function resolveMediaUrl(url: string): string {
  if (url.startsWith('/uploads/')) {
    return `${env.apiBaseUrl}${url}`;
  }
  return url;
}
