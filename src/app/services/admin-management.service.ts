import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { Client } from '../modeles/client';
import { Produit } from '../modeles/produit';
import { Commande } from '../modeles/commande';
import { ProduitsService, CreateProduitsPayload } from './produits.service';
import { LigneStockService } from './ligne-stock.service';
import { CommandeService } from './commande.service';
import {
  UtilisateursService,
  UpdateUtilisateurPayload,
} from './utilisateurs.service';

export interface AdminUser extends Client {
  username?: string;
  role?: string;
}

export type AdminProductPayload = CreateProduitsPayload;

@Injectable({
  providedIn: 'root',
})
export class AdminManagementService {
  private readonly apiBase = '/api';

  constructor(
    private http: HttpClient,
    private produitsService: ProduitsService,
    private ligneStockService: LigneStockService,
    private commandeService: CommandeService,
    private utilisateursService: UtilisateursService,
  ) {}

  // Utilisateurs - ADMIN ONLY
  getUsers(): Observable<AdminUser[]> {
    return this.utilisateursService.getUtilisateurs().pipe(
      map((users) => this.normalizeAdminUsers(users as AdminUser[])),
      catchError((err) => {
        // Certains backends exposent les utilisateurs sur un autre endpoint.
        if (err?.status !== 500) {
          throw err;
        }

        return this.http.get<any[]>(`${this.apiBase}/clients`).pipe(
          map((users) => this.normalizeAdminUsers(users || [])),
          catchError(() =>
            this.http.get<any[]>(`${this.apiBase}/utilisateurs`).pipe(
              map((users) => this.normalizeAdminUsers(users || [])),
              catchError(() =>
                this.commandeService.getCommandes().pipe(
                  map((commandes) =>
                    this.extractUsersFromCommandes(commandes as any[]),
                  ),
                  catchError(() => of([])),
                ),
              ),
            ),
          ),
        );
      }),
    ) as Observable<AdminUser[]>;
  }

  updateUserRole(
    id: string,
    role: 'ROLE_ADMIN' | 'ROLE_USER',
  ): Observable<AdminUser> {
    return this.utilisateursService.updateUtilisateur(id, {
      role,
    }) as Observable<AdminUser>;
  }

  deleteUser(id: string): Observable<void> {
    // DELETE /users/{id} - endpoint admin pour supprimer un utilisateur
    return this.http.delete<void>(`${this.apiBase}/users/${id}`);
  }

  // Produits - Delegated to ProduitsService
  getProducts(): Observable<Produit[]> {
    return this.produitsService.getProduits();
  }

  createProduct(payload: AdminProductPayload): Observable<Produit> {
    return this.produitsService.createProduit(payload);
  }

  /**
   * Crée un produit et l'associe automatiquement à une ligne de stock.
   * Flux: POST /api/produits → POST /api/ligneStocks → PUT /api/produits/{id}
   * Si l'endpoint /api/ligneStocks n'existe pas côté backend, le produit est
   * quand même créé et retourné (dégradation gracieuse).
   */
  createProductWithStock(
    payload: AdminProductPayload,
    quantiteStock: number,
  ): Observable<Produit> {
    return this.produitsService.createProduit(payload).pipe(
      switchMap((produit) =>
        this.ligneStockService
          .createLigneStock({
            produit: produit,
            quantite_stock: quantiteStock,
          })
          .pipe(
            switchMap((ligneStock) =>
              this.produitsService.updateProduit(produit.id, {
                ligneStockId: ligneStock.id,
              }),
            ),
            catchError((err) => {
              console.warn(
                '⚠️ [AdminManagementService] Création ligne stock échouée (endpoint non disponible) — produit créé sans lien stock.',
                err,
              );
              return of(produit);
            }),
          ),
      ),
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.ligneStockService.getLigneStocks().pipe(
      map((lignes) =>
        lignes
          .filter((ls) => Number(ls?.produit?.id) === Number(id))
          .map((ls) => String(ls.id)),
      ),
      switchMap((ligneIds) => {
        if (ligneIds.length === 0) {
          return of(void 0);
        }

        // Supprime d'abord les lignes de stock liées pour éviter les contraintes FK.
        return forkJoin(
          ligneIds.map((ligneId) =>
            this.ligneStockService
              .deleteLigneStock(ligneId)
              .pipe(catchError(() => of(void 0))),
          ),
        ).pipe(map(() => void 0));
      }),
      switchMap(() => this.produitsService.deleteProduit(id)),
      catchError((err) => {
        // Fallback: certains backends renvoient 500 malgré une suppression effective.
        if (err?.status !== 500) {
          throw err;
        }

        return this.produitsService.getProduits().pipe(
          map((produits) => {
            const existeEncore = produits.some(
              (p) => Number(p.id) === Number(id),
            );
            if (existeEncore) {
              throw err;
            }
            return void 0;
          }),
        );
      }),
    );
  }

  updateProduct(
    id: number,
    payload: Partial<AdminProductPayload>,
  ): Observable<Produit> {
    return this.produitsService.updateProduit(id, payload);
  }

  // Commandes - Delegated to CommandeService
  getOrders(): Observable<Commande[]> {
    return this.commandeService.getCommandes();
  }

  deleteOrder(id: string): Observable<void> {
    return this.commandeService.deleteCommande(id);
  }

  private normalizeAdminUsers(users: any[]): AdminUser[] {
    return (users || []).map((u) => ({
      id: String(u?.id ?? ''),
      nom: u?.nom ?? '',
      prenom: u?.prenom ?? '',
      email: u?.email ?? '',
      telephone: u?.telephone ?? '',
      roles: Array.isArray(u?.roles)
        ? u.roles
        : u?.role
          ? [u.role]
          : ['ROLE_USER'],
      role: u?.role,
      username: u?.username,
    }));
  }

  private extractUsersFromCommandes(commandes: any[]): AdminUser[] {
    const byId = new Map<string, AdminUser>();

    for (const commande of commandes || []) {
      const rawUser =
        commande?.utilisateur ?? commande?.user ?? commande?.client ?? null;

      if (!rawUser) {
        continue;
      }

      const id = String(rawUser?.id ?? '');
      if (!id) {
        continue;
      }

      if (!byId.has(id)) {
        byId.set(id, this.normalizeAdminUsers([rawUser])[0]);
      }
    }

    return Array.from(byId.values());
  }
}
