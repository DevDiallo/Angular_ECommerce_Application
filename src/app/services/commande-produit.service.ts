import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CommandeProduit {
  id: string;
  commandeId: string;
  produitId: number;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
  [key: string]: any;
}

export interface CreateCommandeProduitPayload {
  // Payload pour POST /commandesProduits/{prodId}/{comId}
  [key: string]: any;
}

export interface UpdateCommandeProduitPayload {
  // Payload pour PUT /commandesProduits/{id}
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class CommandeProduitService {
  private readonly apiBase = '/api';

  constructor(private http: HttpClient) {}

  // GET /commandesProduits [USER|ADMIN]
  getCommandesProduits(): Observable<CommandeProduit[]> {
    return this.http.get<CommandeProduit[]>(
      `${this.apiBase}/commandesProduits`,
    );
  }

  // GET /commandesProduits/{id} [USER|ADMIN]
  getCommandeProduitById(id: string): Observable<CommandeProduit> {
    return this.http.get<CommandeProduit>(
      `${this.apiBase}/commandesProduits/${id}`,
    );
  }

  // POST /commandesProduits/{prodId}/{comId} [USER]
  createCommandeProduit(
    prodId: number,
    comId: string,
    payload?: CreateCommandeProduitPayload,
  ): Observable<CommandeProduit> {
    return this.http.post<CommandeProduit>(
      `${this.apiBase}/commandesProduits/${prodId}/${comId}`,
      payload || {},
    );
  }

  // PUT /commandesProduits/{id} [AUTHENTICATED]
  updateCommandeProduit(
    id: string,
    payload: UpdateCommandeProduitPayload,
  ): Observable<CommandeProduit> {
    return this.http.put<CommandeProduit>(
      `${this.apiBase}/commandesProduits/${id}`,
      payload,
    );
  }

  // DELETE /commandesProduits/{id} [AUTHENTICATED]
  deleteCommandeProduit(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/commandesProduits/${id}`);
  }
}
