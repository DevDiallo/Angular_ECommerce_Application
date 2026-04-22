export const AUTH_TOKEN_STORAGE_KEY = 'auth_token';
export const AUTH_USER_STORAGE_KEY = 'auth_user';

export interface UserProfile {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface RegisterResponse {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
}
