import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LigneStock } from '../modeles/ligneStock';

export interface UpdateLigneStockPayload {
  quantite_stock?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class LigneStockService {
  private readonly apiBase = '/api';

  constructor(private http: HttpClient) {}

  // GET /ligneStocks [PUBLIC]
  getLigneStocks(): Observable<LigneStock[]> {
    return this.http.get<LigneStock[]>(`${this.apiBase}/ligneStocks`);
  }

  // GET /ligneStocks/{id} [PUBLIC]
  getLigneStockById(id: string): Observable<LigneStock> {
    return this.http.get<LigneStock>(`${this.apiBase}/ligneStocks/${id}`);
  }

  // POST /ligneStocks [AUTHENTICATED]
  createLigneStock(payload: Partial<LigneStock>): Observable<LigneStock> {
    return this.http.post<LigneStock>(`${this.apiBase}/ligneStocks`, payload);
  }

  // PUT /ligneStocks/{id} [AUTHENTICATED]
  updateLigneStock(
    id: string,
    payload: UpdateLigneStockPayload,
  ): Observable<LigneStock> {
    return this.http.put<LigneStock>(
      `${this.apiBase}/ligneStocks/${id}`,
      payload,
    );
  }

  // DELETE /ligneStocks/{id} [AUTHENTICATED]
  deleteLigneStock(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/ligneStocks/${id}`);
  }
}
