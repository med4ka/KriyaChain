const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
