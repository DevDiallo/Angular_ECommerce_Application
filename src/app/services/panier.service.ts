import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LigneProduit } from '../modeles/ligneProduit';

@Injectable({
  providedIn: 'root',
})
export class PanierService {
  private readonly PANIER_STORAGE_KEY = 'panier_items';
  private panierSubject = new BehaviorSubject<LigneProduit[]>(
    this.loadFromStorage(),
  );

  public panier$ = this.panierSubject.asObservable();

  constructor() {}

  // Charger le panier depuis localStorage
  private loadFromStorage(): LigneProduit[] {
    const stored = localStorage.getItem(this.PANIER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Sauvegarder le panier dans localStorage
  private saveToStorage(items: LigneProduit[]): void {
    localStorage.setItem(this.PANIER_STORAGE_KEY, JSON.stringify(items));
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
