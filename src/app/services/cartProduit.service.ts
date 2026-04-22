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
import { map, mergeMap, tap, mergeMap as mergeMapOp } from 'rxjs/operators';
import { Produit } from '../modeles/produit';
import { LigneProduit } from '../modeles/ligneProduit';
import { Categorie } from '../modeles/categorie';
import { LigneStock } from '../modeles/ligneStock';
import { Stock } from '../modeles/stock';
import { Commande } from '../modeles/commande';
import { ProduitsService } from './produits.service';
import { CommandeService } from './commande.service';
import { CommandeProduitService } from './commande-produit.service';
import { CategorieService } from './categorie.service';
import { LigneStockService } from './ligne-stock.service';
import { PanierService } from './panier.service';
import { AUTH_USER_STORAGE_KEY } from '../modeles/auth';

@Injectable({
  providedIn: 'root',
})
export class CartProduitService {
  constructor(
    private http: HttpClient,
    private produitsService: ProduitsService,
    private commandeService: CommandeService,
    private commandeProduitService: CommandeProduitService,
    private categorieService: CategorieService,
    private ligneStockService: LigneStockService,
    private panierService: PanierService,
  ) {}

  // ============================================================
  // PRODUITS (via ProduitsService) ✅ /api/produits
  // ============================================================

  getProduits(): Observable<Produit[]> {
    return this.produitsService.getProduits();
  }

  getProduitById(id: number): Observable<Produit> {
    return this.produitsService.getProduitById(id);
  }

  addProduit(produit: Produit): Observable<Produit> {
    return this.produitsService.createProduit({
      nom: produit.nom || '',
      description: produit.description || '',
      prix: produit.prix || 0,
      imagePath: produit.imagePath || '',
      categorieId: produit.categorieId || 0,
      ligneStockId: '',
    });
  }

  updateProduit(id: number, produit: any): Observable<Produit> {
    return this.produitsService.updateProduit(id, {
      nom: produit.nom,
      description: produit.description,
      prix: produit.prix,
      imagePath: produit.imagePath,
      categorieId: produit.categorieId,
    });
  }

  deleteProduit(id: number): Observable<void> {
    return this.produitsService.deleteProduit(id);
  }

  // ============================================================
  // CATEGORIES (via CategorieService) ✅ /api/categories
  // ============================================================

  getCategories(): Observable<Categorie[]> {
    return this.categorieService.getCategories();
  }

  getCategorieById(id: number): Observable<Categorie> {
    return this.categorieService.getCategorieById(id);
  }

  // ============================================================
  // LIGNE STOCKS (via LigneStockService) ✅ /api/ligneStocks
  // ============================================================

  getStocks(): Observable<Stock[]> {
    // Compat legacy: reconstruit un tableau de stocks depuis /api/ligneStocks.
    return this.getLigneStocks().pipe(
      map((lignes) => {
        const grouped = lignes.reduce(
          (acc, ligne) => {
            const key = Number(ligne.stock_id || 1);
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(ligne);
            return acc;
          },
          {} as Record<number, LigneStock[]>,
        );

        const stocks = Object.entries(grouped).map(
          ([stockId, lignesStock]) =>
            new Stock(Number(stockId), lignesStock, new Date()),
        );

        return stocks.length ? stocks : [new Stock(1, [], new Date())];
      }),
    );
  }

  getStockById(id: number): Observable<Stock> {
    return this.getStocks().pipe(
      map((stocks) => stocks.find((s) => s.id === id) || stocks[0]),
    );
  }

  getLigneStocks(): Observable<LigneStock[]> {
    return this.ligneStockService.getLigneStocks().pipe(
      map((lignes) =>
        lignes.map((ligne) => ({
          ...ligne,
          produit: ligne.produit
            ? {
                ...ligne.produit,
                imagePath: this.normalizeImagePath(ligne.produit.imagePath),
              }
            : ligne.produit,
        })),
      ),
    );
  }

  private normalizeImagePath(path: string | undefined): string {
    if (!path) return '';
    // Déjà un chemin assets valide
    if (path.startsWith('assets/')) return path;
    // Chemin absolu ou relatif vers /images/... → extraire le nom de fichier
    const filename = path.split('/').pop() || '';
    return filename ? `assets/images/${filename}` : path;
  }

  getLigneStockById(id: number): Observable<LigneStock> {
    return this.ligneStockService.getLigneStockById(id.toString());
  }

  addLigneStock(ligneStock: LigneStock): Observable<LigneStock> {
    return this.ligneStockService.createLigneStock(ligneStock);
  }

  updateLigneStock(id: number, ligneStock: any): Observable<LigneStock> {
    return this.ligneStockService.updateLigneStock(id.toString(), ligneStock);
  }

  deleteLigneStock(id: number): Observable<void> {
    return this.ligneStockService.deleteLigneStock(id.toString());
  }

  deleteQuantityLigneStock(
    ligne_stock_id: string,
    quantite: number,
  ): Observable<LigneStock> {
    return this.ligneStockService.getLigneStockById(ligne_stock_id).pipe(
      mergeMapOp((ligneStock) => {
        const updatedLigneStock = {
          ...ligneStock,
          quantite_stock: (ligneStock.quantite_stock || 0) - quantite,
        };
        return this.ligneStockService.updateLigneStock(
          ligne_stock_id,
          updatedLigneStock,
        );
      }),
    );
  }

  updateStockQuantity(ligneStockId: string, delta: number): Observable<any> {
    return this.ligneStockService.getLigneStockById(ligneStockId).pipe(
      mergeMapOp((ligneStock) => {
        const updated = {
          ...ligneStock,
          quantite_stock: (ligneStock.quantite_stock || 0) + delta,
        };
        return this.ligneStockService.updateLigneStock(ligneStockId, updated);
      }),
    );
  }

  // ============================================================
  // PANIER LOCAL (via PanierService) ✅ localStorage
  // ============================================================

  getCartProduits(): Observable<LigneProduit[]> {
    return this.panierService.getPanier$();
  }

  addToligneProduit(ligneStock: LigneStock): Observable<void> {
    const prodId = ligneStock.produit?.id || Number(ligneStock.id);

    const quantiteDansPanier = this.panierService
      .getPanier()
      .filter((item) => item.produitId === prodId)
      .reduce((sum, item) => sum + item.quantite, 0);

    if (quantiteDansPanier >= (ligneStock.quantite_stock || 0)) {
      return throwError(
        () => new Error('Stock insuffisant pour ajouter ce produit au panier'),
      );
    }

    this.panierService.ajouterArticle(prodId, 1);
    return of(void 0);
  }

  cancelCart(cartItems?: LigneProduit[]): Observable<any> {
    if (!cartItems || cartItems.length === 0) {
      this.panierService.viderPanier();
      return of(null);
    }

    for (const item of cartItems) {
      this.panierService.supprimerArticle(item.id);
    }
    return of(null);
  }

  // ============================================================
  // COMMANDES (via CommandeService) ✅ /api/commandes
  // ============================================================

  private isLazyInitCommandeError(error: any): boolean {
    const message = (error?.error?.message || error?.message || '') as string;
    return (
      error?.status === 500 &&
      message.toLowerCase().includes('could not initialize proxy')
    );
  }

  private async createCommandeWithFallback(userId: string): Promise<Commande> {
    const commandesAvant = await firstValueFrom(
      this.commandeService.getCommandes(),
    );
    const idsAvant = new Set(commandesAvant.map((c) => String(c.id)));

    try {
      return await firstValueFrom(this.commandeService.createCommande(userId));
    } catch (error) {
      if (!this.isLazyInitCommandeError(error)) {
        throw error;
      }

      // Fallback: la commande peut être persistée malgré une erreur de sérialisation backend.
      const commandesApres = await firstValueFrom(
        this.commandeService.getCommandes(),
      );
      const nouvelles = commandesApres.filter(
        (c) => !idsAvant.has(String(c.id)),
      );

      if (nouvelles.length > 0) {
        return nouvelles.sort((a, b) => {
          const da = new Date(a.dateValidation || 0).getTime();
          const db = new Date(b.dateValidation || 0).getTime();
          return db - da;
        })[0];
      }

      throw error;
    }
  }

  private isLazyInitCommandeProduitError(error: any): boolean {
    // On intercepte tout 500 sur ce POST : le backend peut avoir persisté
    // la ligne même en cas d'erreur de sérialisation (lazy loading Hibernate).
    return error?.status === 500;
  }

  private matchCommandeProduit(
    commandeProduit: any,
    prodId: number,
    comId: string,
  ): boolean {
    const cpProdId = Number(
      commandeProduit?.produitId ?? commandeProduit?.produit?.id,
    );
    const cpComId = String(
      commandeProduit?.commandeId ?? commandeProduit?.commande?.id ?? '',
    );

    return cpProdId === Number(prodId) && cpComId === String(comId);
  }

  private async createCommandeProduitWithFallback(
    prodId: number,
    comId: string,
    quantite: number,
  ): Promise<void> {
    const avant = await firstValueFrom(
      this.commandeProduitService.getCommandesProduits(),
    );
    const idsAvant = new Set(avant.map((cp) => String((cp as any).id)));

    for (let i = 0; i < quantite; i++) {
      try {
        await firstValueFrom(
          this.commandeProduitService.createCommandeProduit(prodId, comId),
        );
      } catch (error) {
        if (!this.isLazyInitCommandeProduitError(error)) {
          throw error;
        }

        // Fallback: l'écriture peut être faite malgré un 500 de sérialisation backend.
        const apres = await firstValueFrom(
          this.commandeProduitService.getCommandesProduits(),
        );
        const nouvelleLigne = apres.find(
          (cp) =>
            !idsAvant.has(String((cp as any).id)) &&
            this.matchCommandeProduit(cp, prodId, comId),
        );

        if (!nouvelleLigne) {
          throw error;
        }
      }

      // Rafraichit le snapshot pour la prochaine itération.
      const courant = await firstValueFrom(
        this.commandeProduitService.getCommandesProduits(),
      );
      courant.forEach((cp) => idsAvant.add(String((cp as any).id)));
    }
  }

  getCommandes(): Observable<Commande[]> {
    return this.commandeService.getCommandes();
  }

  /**
   * Valider le panier et créer une commande
   * ✅ Utilise /api/commandes et /api/commandesProduits
   */
  validateCart(cartItems: LigneProduit[]): Observable<any> {
    return from(
      (async () => {
        if (!cartItems || cartItems.length === 0) {
          return null;
        }

        try {
          // Récupérer l'ID de l'utilisateur
          const userStr = localStorage.getItem(AUTH_USER_STORAGE_KEY);
          if (!userStr) {
            throw new Error('Utilisateur non authentifié');
          }

          const user = JSON.parse(userStr);
          const userId = user.id;

          // Vérifier les quantités disponibles avant toute écriture.
          const lignesStock = await firstValueFrom(this.getLigneStocks());
          const ligneByProduitId = new Map<number, LigneStock>(
            lignesStock
              .filter((ls) => !!ls?.produit?.id)
              .map((ls) => [ls.produit.id, ls]),
          );

          for (const item of cartItems) {
            const ligneStock = ligneByProduitId.get(item.produitId);
            if (!ligneStock) {
              throw new Error(
                `Stock introuvable pour le produit ${item.produitId}`,
              );
            }

            if ((ligneStock.quantite_stock || 0) < item.quantite) {
              throw new Error(
                `Stock insuffisant pour ${ligneStock.produit.nom} (demandé: ${item.quantite}, disponible: ${ligneStock.quantite_stock})`,
              );
            }
          }

          // 1. Créer une commande (avec fallback sur erreur lazy-loading backend)
          const commande = await this.createCommandeWithFallback(userId);

          // 2. Ajouter chaque article à la commande
          for (const item of cartItems) {
            await this.createCommandeProduitWithFallback(
              item.produitId,
              commande.id,
              item.quantite,
            );

            const ligneStock = ligneByProduitId.get(item.produitId)!;
            await firstValueFrom(
              this.ligneStockService.updateLigneStock(ligneStock.id, {
                quantite_stock:
                  (ligneStock.quantite_stock || 0) - item.quantite,
              }),
            );
          }

          // 3. Vider le panier local
          this.panierService.viderPanier();

          return commande;
        } catch (error) {
          console.error('Erreur lors de la validation du panier:', error);
          throw error;
        }
      })(),
    );
  }
}
