import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../modeles/client';

export interface UpdateUtilisateurPayload {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  role?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class UtilisateursService {
  private readonly apiBase = '/api';

  constructor(private http: HttpClient) {}

  // GET /users [ADMIN]
  getUtilisateurs(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiBase}/users`);
  }

  // PUT /users/{userId} [ADMIN]
  updateUtilisateur(
    userId: string,
    payload: UpdateUtilisateurPayload,
  ): Observable<Client> {
    return this.http.put<Client>(`${this.apiBase}/users/${userId}`, payload);
  }
}
