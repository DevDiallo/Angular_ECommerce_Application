import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { AUTH_USER_STORAGE_KEY } from '../modeles/auth';
import { TokenService } from './token.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const token = tokenService.getToken();
  const hasValidToken = tokenService.isTokenValid(token);
  const isAuthEndpoint =
    request.url.includes('/api/auth/login') ||
    request.url.includes('/api/auth/register');

  // Ne jamais envoyer un JWT expiré/malformé, sinon certains backends renvoient 403
  // même sur des endpoints publics.
  if (token && !hasValidToken) {
    tokenService.clearToken();
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }

  const requestWithToken =
    token && hasValidToken && !isAuthEndpoint
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : request;

  if (request.url.includes('/api/') && !isAuthEndpoint) {
    console.group('🧭 [AuthState] Requete API');
    console.log('URL cible:', request.url);
    console.log('Token present:', !!token);
    console.log('Token valid:', hasValidToken);
    console.log(
      'Authorization envoyee:',
      requestWithToken.headers.has('Authorization'),
    );
    console.groupEnd();
  }

  // Log JWT claims when sending authenticated request
  if (token && hasValidToken && !isAuthEndpoint) {
    const payload = tokenService.decodePayload(token);
    console.group(`🔐 [JWT] Authorization Bearer envoyé`);
    console.log('Token valide (exp):', payload?.exp);
    console.log(
      'Rôles dans le token:',
      (payload as any)?.roles || (payload as any)?.role || 'N/A',
    );
    console.log('Claims du JWT:', payload);
    console.log('URL cible:', request.url);
    console.groupEnd();
  }

  return next(requestWithToken).pipe(
    tap((response: any) => {
      // Log successful responses (only for API calls, not assets)
      if (requestWithToken.url.includes('/api/')) {
        console.group(
          `✅ [API Success] ${requestWithToken.method} ${requestWithToken.url}`,
        );
        console.log('Status: 200');
        console.log('Response:', response);
        console.groupEnd();
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const shouldHandleAuthFailure = error.status === 401 && !isAuthEndpoint;

      // Log detailed error information for debugging
      console.group(`🔴 [HttpError] ${error.status} - ${error.statusText}`);
      console.error(
        'Method:',
        error.url?.split('/api')[0] ? 'API Call' : 'Network',
      );
      console.error('URL:', error.url);
      console.error('Status Code:', error.status);
      console.error('Status Text:', error.statusText);
      console.error('Response Body:', error.error);
      console.error('Full Error Object:', error);
      if (token && hasValidToken) {
        console.log('Authorization: Bearer [token present]');
      } else if (token && !hasValidToken) {
        console.warn('⚠️ Token invalide/expiré (clearing from storage)');
      } else {
        console.log('No Authorization token');
      }
      console.groupEnd();

      if (shouldHandleAuthFailure) {
        tokenService.clearToken();
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
