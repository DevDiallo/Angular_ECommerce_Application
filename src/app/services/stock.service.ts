import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Stock } from '../modeles/stock';
import { LigneStock } from '../modeles/ligneStock';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly apiBase = '/api';
  private stocksSubject = new BehaviorSubject<Stock[]>([]);
  public stocks$ = this.stocksSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadAllStocks();
  }

  /**
   * Charge tous les stocks au démarrage du service
   */
  private loadAllStocks(): void {
    this.getAllStocks().subscribe(
      (stocks) => this.stocksSubject.next(stocks),
      (error) => console.error('Erreur lors du chargement des stocks:', error),
    );
  }

  /**
   * GET /api/stocks - Récupère tous les stocks
   */
  getAllStocks(): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiBase}/stocks`);
  }

  /**
   * GET /api/stocks/{id} - Récupère un stock par ID
   */
  getStockById(id: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiBase}/stocks/${id}`);
  }

  /**
   * POST /api/stocks - Crée un nouveau stock
   */
  createStock(payload: Partial<Stock>): Observable<Stock> {
    return this.http
      .post<Stock>(`${this.apiBase}/stocks`, payload)
      .pipe(tap(() => this.loadAllStocks()));
  }

  /**
   * PUT /api/stocks/{id} - Met à jour un stock
   */
  updateStock(id: number, payload: Partial<Stock>): Observable<Stock> {
    return this.http
      .put<Stock>(`${this.apiBase}/stocks/${id}`, payload)
      .pipe(tap(() => this.loadAllStocks()));
  }

  /**
   * DELETE /api/stocks/{id} - Supprime un stock
   */
  deleteStock(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiBase}/stocks/${id}`)
      .pipe(tap(() => this.loadAllStocks()));
  }

  /**
   * GET /api/ligneStocks/{id} - Récupère une ligne de stock par ID
   */
  getLigneStockById(id: string): Observable<LigneStock> {
    return this.http.get<LigneStock>(`${this.apiBase}/ligneStocks/${id}`);
  }

  /**
   * PUT /api/ligneStocks/{id} - Met à jour une ligne de stock
   */
  updateLigneStock(
    id: string,
    payload: Partial<LigneStock>,
  ): Observable<LigneStock> {
    return this.http
      .put<LigneStock>(`${this.apiBase}/ligneStocks/${id}`, payload)
      .pipe(tap(() => this.loadAllStocks()));
  }

  /**
   * Vérifier si un produit est en stock avec la quantité demandée
   */
  isProductAvailable(
    ligneStockId: string,
    quantityRequested: number,
  ): Observable<boolean> {
    return new Observable((observer) => {
      this.getLigneStockById(ligneStockId).subscribe(
        (ligneStock) => {
          observer.next(ligneStock.quantite_stock >= quantityRequested);
          observer.complete();
        },
        (error) => {
          console.error('Erreur lors de la vérification du stock:', error);
          observer.next(false);
          observer.complete();
        },
      );
    });
  }

  /**
   * Récupère la disponibilité d'une ligne de stock
   */
  getAvailableQuantity(ligneStockId: string): Observable<number> {
    return new Observable((observer) => {
      this.getLigneStockById(ligneStockId).subscribe(
        (ligneStock) => {
          observer.next(ligneStock.quantite_stock);
          observer.complete();
        },
        (error) => {
          console.error(
            'Erreur lors de la récupération de la quantité:',
            error,
          );
          observer.next(0);
          observer.complete();
        },
      );
    });
  }

  /**
   * Réduit le stock d'une ligne après une commande
   */
  reduceStock(ligneStockId: string, quantity: number): Observable<LigneStock> {
    return new Observable((observer) => {
      this.getLigneStockById(ligneStockId).subscribe(
        (ligneStock) => {
          const newQuantity = Math.max(0, ligneStock.quantite_stock - quantity);
          this.updateLigneStock(ligneStockId, {
            quantite_stock: newQuantity,
          }).subscribe(
            (updatedLigneStock) => {
              observer.next(updatedLigneStock);
              observer.complete();
            },
            (error) => {
              observer.error(error);
            },
          );
        },
        (error) => {
          observer.error(error);
        },
      );
    });
  }

  /**
   * Augmente le stock d'une ligne (ex: retour de produit)
   */
  increaseStock(
    ligneStockId: string,
    quantity: number,
  ): Observable<LigneStock> {
    return new Observable((observer) => {
      this.getLigneStockById(ligneStockId).subscribe(
        (ligneStock) => {
          const newQuantity = ligneStock.quantite_stock + quantity;
          this.updateLigneStock(ligneStockId, {
            quantite_stock: newQuantity,
          }).subscribe(
            (updatedLigneStock) => {
              observer.next(updatedLigneStock);
              observer.complete();
            },
            (error) => {
              observer.error(error);
            },
          );
        },
        (error) => {
          observer.error(error);
        },
      );
    });
  }
}
