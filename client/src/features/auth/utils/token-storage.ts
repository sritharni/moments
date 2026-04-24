const ACCESS_TOKEN_KEY = 'vibecode_access_token';
const REFRESH_TOKEN_KEY = 'vibecode_refresh_token';

export function getStoredToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function storeToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearStoredRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
