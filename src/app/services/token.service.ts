import { Injectable } from '@angular/core';
import { AUTH_TOKEN_STORAGE_KEY } from '../modeles/auth';

interface JwtPayload {
  exp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

  isTokenValid(token: string | null = this.getToken()): boolean {
    if (!token) {
      return false;
    }

    const payload = this.decodePayload(token);
    if (!payload?.exp) {
      return true;
    }

    const expirationMs = payload.exp * 1000;
    return Date.now() < expirationMs;
  }

  decodePayload(token: string): JwtPayload | null {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) {
        return null;
      }

      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const decoded = atob(normalized);
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null;
    }
  }
}
