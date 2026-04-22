import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produit } from '../modeles/produit';

export interface CreateProduitsPayload {
  nom: string;
  description: string;
  prix: number;
  imagePath: string;
  categorieId: number;
  ligneStockId?: string;
}

export interface UpdateProduitsPayload extends Partial<CreateProduitsPayload> {}

@Injectable({
  providedIn: 'root',
})
export class ProduitsService {
  private readonly apiBase = '/api';

  constructor(private http: HttpClient) {}

  // GET /produits [USER|ADMIN]
  getProduits(): Observable<Produit[]> {
    const url = `${this.apiBase}/produits`;
    console.log(`🔵 [ProduitsService] GET ${url}`);
    return this.http.get<Produit[]>(url);
  }

  // GET /produits/{id} [USER|ADMIN]
  getProduitById(id: number): Observable<Produit> {
    const url = `${this.apiBase}/produits/${id}`;
    console.log(`🔵 [ProduitsService] GET ${url}`);
    return this.http.get<Produit>(url);
  }

  // POST /produits [AUTHENTICATED]
  createProduit(payload: CreateProduitsPayload): Observable<Produit> {
    const url = `${this.apiBase}/produits`;
    console.log(
      `🔵 [ProduitsService] POST ${url} - Envoi du payload:`,
      payload,
    );
    return this.http.post<Produit>(url, payload);
  }

  // PUT /produits/{id} [AUTHENTICATED]
  updateProduit(
    id: number,
    payload: UpdateProduitsPayload,
  ): Observable<Produit> {
    const url = `${this.apiBase}/produits/${id}`;
    console.log(`🟡 [ProduitsService] PUT ${url} - Payload:`, payload);
    return this.http.put<Produit>(url, payload);
  }

  // DELETE /produits/{id} [AUTHENTICATED]
  deleteProduit(id: number): Observable<void> {
    const url = `${this.apiBase}/produits/${id}`;
    console.log(`🔴 [ProduitsService] DELETE ${url}`);
    return this.http.delete<void>(url);
  }
}
