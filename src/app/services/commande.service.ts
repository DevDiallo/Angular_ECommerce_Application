import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande } from '../modeles/commande';

export interface CreateCommandePayload {
  // Payload pour POST /commandes/{userId}
  [key: string]: any;
}

export interface UpdateCommandePayload {
  // Payload pour PUT /users/commandes/{comId}
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class CommandeService {
  private readonly apiBase = '/api';

  constructor(private http: HttpClient) {}

  // GET /commandes [USER|ADMIN]
  getCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.apiBase}/commandes`);
  }

  // GET /commandes/{id} [USER|ADMIN]
  getCommandeById(id: string): Observable<Commande> {
    return this.http.get<Commande>(`${this.apiBase}/commandes/${id}`);
  }

  // POST /commandes/{userId} [USER]
  createCommande(
    userId: string,
    payload?: CreateCommandePayload,
  ): Observable<Commande> {
    return this.http.post<Commande>(
      `${this.apiBase}/commandes/${userId}`,
      payload || {},
    );
  }

  // PUT /users/commandes/{comId} [AUTHENTICATED]
  updateCommande(
    comId: string,
    payload: UpdateCommandePayload,
  ): Observable<Commande> {
    return this.http.put<Commande>(
      `${this.apiBase}/users/commandes/${comId}`,
      payload,
    );
  }

  // DELETE /commandes/{id} [AUTHENTICATED]
  deleteCommande(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/commandes/${id}`);
  }

  // ============================================================
  // USER ENDPOINTS (authenticated user only)
  // ============================================================

  // GET /my/commandes [USER]
  getMyCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.apiBase}/my/commandes`);
  }

  // GET /my/commandes/{id} [USER]
  getMyCommandeById(id: string): Observable<Commande> {
    return this.http.get<Commande>(`${this.apiBase}/my/commandes/${id}`);
  }
}
