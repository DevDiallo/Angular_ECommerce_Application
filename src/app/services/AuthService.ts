import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  AUTH_USER_STORAGE_KEY,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  UserProfile,
} from '../modeles/auth';
import { TokenService } from './token.service';
import { PanierService } from './panier.service';

interface RawAuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: Partial<UserProfile>;
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  roles?: string[];
  Roles?: string[];
  role?: string;
}

type RawUserPayload = Partial<UserProfile> & {
  Roles?: string[];
  role?: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authApiUrl = '/api/auth';

  private readonly currentUserSubject = new BehaviorSubject<UserProfile | null>(
    null,
  );

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly isAuthenticated$ = this.currentUser$.pipe(map((user) => !!user));
  readonly isAdmin$ = this.currentUser$.pipe(
    map((user) => this.userHasRole(user, 'ROLE_ADMIN')),
  );
  readonly isUser$ = this.currentUser$.pipe(
    map((user) => this.userHasRole(user, 'ROLE_USER')),
  );

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private panierService: PanierService,
  ) {
    this.restoreSession();
  }

  get isAuthenticated(): boolean {
    return this.tokenService.isTokenValid() && !!this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenService.getToken();
  }

  hasRole(role: string): boolean {
    return this.userHasRole(this.currentUserSubject.value, role);
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    const normalizedPayload: LoginRequest = {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    };

    return this.http
      .post<RawAuthResponse>(`${this.authApiUrl}/login`, normalizedPayload)
      .pipe(
        map((response) => this.normalizeAuthResponse(response)),
        tap((response) => this.setSession(response)),
        catchError((error) => this.handleAuthError(error, 'login')),
      );
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<RegisterResponse>(`${this.authApiUrl}/register`, payload)
      .pipe(catchError((error) => this.handleAuthError(error, 'register')));
  }

  logout(): void {
    this.clearSession();
  }

  private restoreSession(): void {
    const token = this.tokenService.getToken();
    if (!this.tokenService.isTokenValid(token)) {
      this.clearSession();
      return;
    }

    const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!storedUser) {
      this.clearSession();
      return;
    }

    try {
      const user = JSON.parse(storedUser) as UserProfile;
      this.currentUserSubject.next(user);
    } catch {
      this.clearSession();
    }
  }

  private normalizeAuthResponse(response: RawAuthResponse): AuthResponse {
    const token = response.token ?? response.accessToken ?? response.jwt;
    if (!token) {
      throw new Error('Le token JWT est absent dans la réponse API.');
    }

    const userFromBody = (response.user ?? response) as RawUserPayload;
    const user: UserProfile = {
      id: userFromBody.id,
      nom: userFromBody.nom ?? '',
      prenom: userFromBody.prenom ?? '',
      email: userFromBody.email ?? '',
      telephone: userFromBody.telephone ?? '',
      roles: this.normalizeRoles(userFromBody),
    };

    return { token, user };
  }

  private setSession(response: AuthResponse): void {
    this.tokenService.setToken(response.token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    // Charger le panier propre de cet utilisateur
    this.panierService.reloadForUser();
  }

  private clearSession(): void {
    this.tokenService.clearToken();
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    this.currentUserSubject.next(null);
    // Vider le panier en mémoire (ne supprime pas les données stockées)
    this.panierService.reloadForUser();
  }

  private handleAuthError(
    error: unknown,
    context: 'login' | 'register',
  ): Observable<never> {
    const httpError = error as HttpErrorResponse;
    const status = httpError?.status;
    const apiMessage = this.extractApiMessage(httpError);

    if (apiMessage) {
      return throwError(() => new Error(apiMessage));
    }

    if (status === 0) {
      return throwError(
        () =>
          new Error(
            "Impossible de joindre l'API d'authentification. Vérifie que le backend Spring écoute sur http://localhost:7000 et redémarre le front (ng serve).",
          ),
      );
    }

    if (status === 401) {
      return throwError(
        () =>
          new Error(
            context === 'login'
              ? 'Email ou mot de passe admin invalide.'
              : 'Action non autorisee (401).',
          ),
      );
    }

    if (status === 403) {
      return throwError(
        () =>
          new Error(
            context === 'register'
              ? 'Inscription refusée par le backend (403). Vérifie Spring Security: /api/auth/register doit être permitAll et CSRF désactivé pour une API JWT.'
              : 'Connexion refusée (403). Vérifie le JwtFilter et les règles permitAll sur /api/auth/login.',
          ),
      );
    }

    if (status === 409) {
      return throwError(
        () => new Error('Un compte existe déjà avec cet email.'),
      );
    }

    if (status === 400) {
      return throwError(
        () => new Error('Données invalides, vérifie les champs du formulaire.'),
      );
    }

    if (status === 500) {
      return throwError(
        () =>
          new Error(
            'Erreur interne du serveur, réessaie dans quelques instants.',
          ),
      );
    }

    return throwError(
      () => new Error('Le serveur est indisponible, réessaie plus tard.'),
    );
  }

  private extractApiMessage(error: HttpErrorResponse): string | null {
    const payload = error?.error;

    if (!payload) {
      return null;
    }

    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload;
    }

    if (typeof payload === 'object') {
      const message = (payload as { message?: string }).message;
      if (message) {
        return message;
      }

      const details = (payload as { error?: string }).error;
      if (details) {
        return details;
      }
    }

    return null;
  }

  private normalizeRoles(user: RawUserPayload): string[] {
    const rawRoles = user.roles ?? user.Roles ?? (user.role ? [user.role] : []);

    return rawRoles.map((role) =>
      role.startsWith('ROLE_') ? role : `ROLE_${role}`,
    );
  }

  private userHasRole(user: UserProfile | null, role: string): boolean {
    if (!user) {
      return false;
    }

    return user.roles.includes(role);
  }
}
