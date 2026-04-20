import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  forkJoin,
  from,
  Observable,
  of,
  firstValueFrom,
  throwError,
} from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Produit } from '../modeles/produit';
import { LigneProduit } from '../modeles/ligneProduit';
import { Categorie } from '../modeles/categorie';
import { LigneStock } from '../modeles/ligneStock';
import { Stock } from '../modeles/stock';
import { Commande } from '../modeles/commande';

@Injectable({
  providedIn: 'root',
})
export class CartProduitService {
  private syncDone = false;
  private readonly STOCK_CACHE_KEY = 'stockCache';
  private stockSubject = new BehaviorSubject<Stock[]>([]);
  public stocks$ = this.stockSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStocks();
  }

  private saveStockCache(stocks: Stock[]) {
    localStorage.setItem(this.STOCK_CACHE_KEY, JSON.stringify(stocks));
  }

  private loadStockCache(): Stock[] | null {
    const raw = localStorage.getItem(this.STOCK_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Stock[]) : null;
  }

  loadStocks() {
    const cachedStocks = this.loadStockCache();
    if (cachedStocks?.length) {
      this.stockSubject.next(cachedStocks);
    }

    this.http
      .get<Stock[]>('http://localhost:3000/stock')
      .subscribe((stocks) => {
        this.stockSubject.next(stocks);
        this.saveStockCache(stocks);
      });
  }

  // Service pour gerer les categorie

  getCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>('http://localhost:3000/categorie');
  }
  getCategorieById(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(`http://localhost:3000/categorie/${id}`);
  }

  // Service pour gerer les stock

  getStocks(): Observable<Stock[]> {
    return this.stocks$;
  }
  getStockById(id: number): Observable<Stock> {
    return this.http.get<Stock>(`http://localhost:3000/stock/${id}`);
  }

  // Service pour gerer les ligneStock

  getLigneStocks(): Observable<LigneStock[]> {
    return this.http.get<LigneStock[]>('http://localhost:3000/ligneStock');
  }
  getLigneStockById(id: number): Observable<LigneStock> {
    return this.http.get<LigneStock>(`http://localhost:3000/ligneStock/${id}`);
  }
  addLigneStock(ligneStock: LigneStock) {
    return this.http.post('http://localhost:3000/ligneStock', ligneStock);
  }
  updateLigneStock(id: number, ligneStock: any) {
    return this.http.put(`http://localhost:3000/ligneStock/${id}`, ligneStock);
  }
  deleteLigneStock(id: number) {
    return this.http.delete(`http://localhost:3000/ligneStock/${id}`);
  }
  deleteQuantityLigneStock(ligne_stock_id: string, quantite: number) {
    return this.http
      .get<LigneStock>(`http://localhost:3000/ligneStock/${ligne_stock_id}`)
      .pipe(
        mergeMap((ligneStock) => {
          const updatedLigneStock = {
            ...ligneStock,
            quantite_stock: ligneStock.quantite_stock - quantite,
          };
          return this.http.put(
            `http://localhost:3000/ligneStock/${ligne_stock_id}`,
            updatedLigneStock,
          );
        }),
      );
  }

  updateStockQuantity(ligneStockId: string, delta: number) {
    const currentStocks = this.stockSubject.value;
    const updatedStocks = currentStocks.map((stock) => {
      const ligneIndex = stock.lignesStock.findIndex(
        (ls) => ls.id === ligneStockId,
      );
      if (ligneIndex === -1) {
        return stock;
      }

      const updatedLignesStock = stock.lignesStock.map((ls) =>
        ls.id === ligneStockId
          ? { ...ls, quantite_stock: ls.quantite_stock + delta }
          : ls,
      );

      return {
        ...stock,
        lignesStock: updatedLignesStock,
      };
    });

    this.stockSubject.next(updatedStocks);
    this.saveStockCache(updatedStocks);

    const updatedStock = updatedStocks.find((stock) =>
      stock.lignesStock.some((ls) => ls.id === ligneStockId),
    );
    if (!updatedStock) {
      return of(null);
    }

    return this.http
      .put(`http://localhost:3000/stock/${updatedStock.id}`, updatedStock)
      .pipe(tap(() => this.saveStockCache(updatedStocks)));
  }

  private findStockLineByProduitId(produitId: number) {
    return this.stockSubject.value
      .flatMap((stock) =>
        stock.lignesStock.map((ligneStock) => ({ stock, ligneStock })),
      )
      .find(
        (entry) =>
          entry.ligneStock.produit.id?.toString() === produitId.toString(),
      );
  }

  private async processCartItems(cartItems: LigneProduit[]) {
    if (!cartItems.length) {
      return null;
    }

    for (const item of cartItems) {
      const entry = this.findStockLineByProduitId(item.produitId);
      if (!entry) {
        throw new Error(`Stock introuvable pour produit ${item.produitId}`);
      }

      if (entry.ligneStock.quantite_stock < item.quantite) {
        throw new Error(`Quantité insuffisante pour produit ${item.produitId}`);
      }

      await firstValueFrom(
        this.updateStockQuantity(entry.ligneStock.id, -item.quantite),
      );
    }
    return null;
  }

  private async clearCartItems(cartItems: LigneProduit[]) {
    if (!cartItems.length) {
      return null;
    }

    for (const item of cartItems) {
      await firstValueFrom(
        this.http.delete(`http://localhost:3000/ligneProduit/${item.id}`),
      );
    }
    return null;
  }

  private async createValidatedCartHistory(cartItems: LigneProduit[]) {
    const produits = this.stockSubject.value.flatMap((stock) =>
      stock.lignesStock.map((ligne) => ligne.produit),
    );

    const items = cartItems.map((item) => {
      const produit = produits.find(
        (p) => p.id?.toString() === item.produitId.toString(),
      );
      const prixUnitaire = produit?.prix ?? 0;
      return {
        produitId: item.produitId,
        nom: produit?.nom ?? `Produit #${item.produitId}`,
        prixUnitaire,
        quantite: item.quantite,
        sousTotal: prixUnitaire * item.quantite,
      };
    });

    const commande: Commande = {
      id: crypto.randomUUID().substring(0, 8),
      dateValidation: new Date().toISOString(),
      total: items.reduce((sum, item) => sum + item.sousTotal, 0),
      items,
    };

    await firstValueFrom(
      this.http.post('http://localhost:3000/commande', commande),
    );
  }

  validateCart(cartItems: LigneProduit[]) {
    return from(
      (async () => {
        if (!cartItems.length) {
          return null;
        }

        if (!this.stockSubject.value.length) {
          const stocks = await firstValueFrom(
            this.http.get<Stock[]>('http://localhost:3000/stock'),
          );
          this.stockSubject.next(stocks);
          this.saveStockCache(stocks);
        }

        await this.processCartItems(cartItems);
        await this.createValidatedCartHistory(cartItems);
        await this.clearCartItems(cartItems);
        await firstValueFrom(
          this.http.get<Stock[]>('http://localhost:3000/stock'),
        );
        this.loadStocks();
        return null;
      })(),
    );
  }

  // Synchroniser les produits du stock avec les produits de la base de données

  // Service pour gerer les produits

  getProduits(): Observable<Produit[]> {
    return this.getStocks().pipe(
      map((stocks) =>
        stocks.flatMap((stock) =>
          stock.lignesStock.map((ligne) => ligne.produit),
        ),
      ),
    );
  }

  getProduitById(id: number): Observable<Produit> {
    return this.http.get<Stock[]>('http://localhost:3000/stock').pipe(
      map((stocks) =>
        stocks.flatMap((stock) =>
          stock.lignesStock.map((ligne) => ligne.produit),
        ),
      ),
      map((produits) => produits.find((p) => p.id === id)!),
    );
  }

  addProduit(produit: Produit) {
    return this.http.post('http://localhost:3000/produit', produit);
  }

  updateProduit(id: number, produit: any) {
    return this.http.put(`http://localhost:3000/produit/${id}`, produit);
  }

  deleteProduit(id: number) {
    return this.http.delete(`http://localhost:3000/produit/${id}`);
  }

  // service pour gerer les produits du panier

  getCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>('http://localhost:3000/commande');
  }

  getCartProduits(): Observable<LigneProduit[]> {
    return this.http.get<LigneProduit[]>('http://localhost:3000/ligneProduit');
  }

  addToligneProduit(ligneStock: LigneStock) {
    const produit = ligneStock.produit;
    const prodId = produit.id;

    return from(
      (async () => {
        const ligneProduits = await firstValueFrom(
          this.http.get<LigneProduit[]>(
            `http://localhost:3000/ligneProduit?produitId=${prodId}`,
          ),
        );

        await firstValueFrom(this.updateStockQuantity(ligneStock.id, -1));

        if (ligneProduits.length > 0) {
          const ligneProduit = ligneProduits[0];
          const updated = {
            ...ligneProduit,
            quantite: ligneProduit.quantite + 1,
          };

          return firstValueFrom(
            this.http.put(
              `http://localhost:3000/ligneProduit/${ligneProduit.id}`,
              updated,
            ),
          );
        }

        const newLigneProduit: LigneProduit = {
          id: crypto.randomUUID().substring(0, 4),
          produitId: prodId,
          quantite: 1,
        };

        return firstValueFrom(
          this.http.post('http://localhost:3000/ligneProduit', newLigneProduit),
        );
      })(),
    );
  }

  cancelCart(cartItems: LigneProduit[]): Observable<any> {
    const restoreOperations = cartItems.map((item) => {
      const entry = this.findStockLineByProduitId(item.produitId);
      if (!entry) {
        return throwError(
          () => new Error(`Stock introuvable pour produit ${item.produitId}`),
        );
      }

      const restore$ = this.updateStockQuantity(
        entry.ligneStock.id,
        item.quantite,
      );
      const remove$ = this.http.delete(
        `http://localhost:3000/ligneProduit/${item.id}`,
      );

      return forkJoin([restore$, remove$]);
    });

    return restoreOperations.length
      ? (forkJoin(restoreOperations) as Observable<any>)
      : of(null);
  }
}
