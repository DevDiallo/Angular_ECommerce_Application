import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LigneProduit } from '../modeles/ligneProduit';
import { AUTH_USER_STORAGE_KEY } from '../modeles/auth';

@Injectable({
  providedIn: 'root',
})
export class PanierService {
  private readonly PANIER_BASE_KEY = 'panier_items';
  private panierSubject = new BehaviorSubject<LigneProduit[]>(
    this.loadFromStorage(),
  );

  public panier$ = this.panierSubject.asObservable();

  constructor() {}

  /**
   * Retourne la clé localStorage spécifique à l'utilisateur connecté.
   * Si aucun utilisateur connecté, retourne la clé de base (anonyme).
   */
  private get storageKey(): string {
    try {
      const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (raw) {
        const user = JSON.parse(raw) as { id?: string };
        if (user?.id) {
          return `${this.PANIER_BASE_KEY}_${user.id}`;
        }
      }
    } catch {
      // Ignore parsing errors
    }
    return this.PANIER_BASE_KEY;
  }

  // Charger le panier depuis localStorage
  private loadFromStorage(): LigneProduit[] {
    try {
      const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      let key = this.PANIER_BASE_KEY;
      if (raw) {
        const user = JSON.parse(raw) as { id?: string };
        if (user?.id) {
          key = `${this.PANIER_BASE_KEY}_${user.id}`;
        }
      }
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Sauvegarder le panier dans localStorage
  private saveToStorage(items: LigneProduit[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  /**
   * Recharge le panier de l'utilisateur connecté.
   * À appeler après un login/logout.
   */
  reloadForUser(): void {
    const items = this.loadFromStorage();
    this.panierSubject.next(items);
  }

  // Obtenir le panier courant
  getPanier(): LigneProduit[] {
    return this.panierSubject.value;
  }

  // Obtenir le panier comme Observable
  getPanier$(): Observable<LigneProduit[]> {
    return this.panier$;
  }

  // Ajouter ou augmenter la quantité d'un article
  ajouterArticle(produitId: number, quantite: number = 1): void {
    const panier = this.getPanier();
    const existant = panier.find((item) => item.produitId === produitId);

    if (existant) {
      existant.quantite += quantite;
    } else {
      panier.push({
        id: crypto.randomUUID().substring(0, 8),
        produitId,
        quantite,
      });
    }

    this.panierSubject.next(panier);
    this.saveToStorage(panier);
  }

  // Mettre à jour la quantité d'un article
  mettreAJourQuantite(ligneId: string, quantite: number): void {
    const panier = this.getPanier();
    const article = panier.find((item) => item.id === ligneId);

    if (article) {
      if (quantite <= 0) {
        this.supprimerArticle(ligneId);
      } else {
        article.quantite = quantite;
        this.panierSubject.next(panier);
        this.saveToStorage(panier);
      }
    }
  }

  // Supprimer un article du panier
  supprimerArticle(ligneId: string): void {
    const panier = this.getPanier().filter((item) => item.id !== ligneId);
    this.panierSubject.next(panier);
    this.saveToStorage(panier);
  }

  // Vider le panier
  viderPanier(): void {
    this.panierSubject.next([]);
    this.saveToStorage([]);
  }

  // Obtenir le nombre total d'articles
  getNombreArticles(): number {
    return this.getPanier().reduce((sum, item) => sum + item.quantite, 0);
  }
}
