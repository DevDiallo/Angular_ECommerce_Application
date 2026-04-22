import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Commande, CommandeItem } from '../modeles/commande';
import { Produit } from '../modeles/produit';
import { CommandeProduit } from '../services/commande-produit.service';
import { CartProduitService } from '../services/cartProduit.service';
import { CommandeProduitService } from '../services/commande-produit.service';

@Component({
  selector: 'app-order-history-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.scss',
})
export class OrderHistoryComponent implements OnInit {
  commandes$!: Observable<Commande[]>;

  constructor(
    private cartService: CartProduitService,
    private commandeProduitService: CommandeProduitService,
  ) {}

  ngOnInit(): void {
    this.commandes$ = combineLatest([
      this.cartService.getMyCommandes(),
      this.commandeProduitService
        .getMyCommandesProduits()
        .pipe(catchError(() => of([] as CommandeProduit[]))),
      this.cartService
        .getProduits()
        .pipe(catchError(() => of([] as Produit[]))),
    ]).pipe(
      map(([commandes, commandesProduits, produits]) =>
        this.buildDetailedHistory(commandes, commandesProduits, produits),
      ),
    );
  }

  private buildDetailedHistory(
    commandes: Commande[],
    commandesProduits: CommandeProduit[],
    produits: Produit[],
  ): Commande[] {
    const produitsById = new Map<number, Produit>(
      produits.map((p) => [Number(p.id), p]),
    );

    const lignesByCommandeId = new Map<string, CommandeProduit[]>();
    for (const cp of commandesProduits) {
      const commandeId = String(
        (cp as any)?.commandeId ?? (cp as any)?.commande?.id ?? '',
      );
      if (!commandeId) {
        continue;
      }
      if (!lignesByCommandeId.has(commandeId)) {
        lignesByCommandeId.set(commandeId, []);
      }
      lignesByCommandeId.get(commandeId)!.push(cp);
    }

    return [...commandes]
      .map((commande) => {
        const lignes = lignesByCommandeId.get(String(commande.id)) || [];
        const items = this.mergeItemsFromLignes(
          lignes,
          produitsById,
          commande.items || [],
        );
        const computedTotal = items.reduce(
          (sum, item) => sum + item.sousTotal,
          0,
        );

        return {
          ...commande,
          items,
          total: commande.total > 0 ? commande.total : computedTotal,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.dateValidation || 0).getTime() -
          new Date(a.dateValidation || 0).getTime(),
      );
  }

  private mergeItemsFromLignes(
    lignes: CommandeProduit[],
    produitsById: Map<number, Produit>,
    fallbackItems: CommandeItem[],
  ): CommandeItem[] {
    if (!lignes || lignes.length === 0) {
      return fallbackItems || [];
    }

    const byProduit = new Map<number, CommandeItem>();

    for (const ligne of lignes) {
      const produitId = Number(
        (ligne as any)?.produitId ?? (ligne as any)?.produit?.id ?? 0,
      );
      if (!produitId) {
        continue;
      }

      const quantite = Number((ligne as any)?.quantite ?? 1);
      const produit = produitsById.get(produitId);
      const prixUnitaire = Number(
        (ligne as any)?.prixUnitaire ?? produit?.prix ?? 0,
      );
      const sousTotal = Number(
        (ligne as any)?.sousTotal ?? prixUnitaire * quantite,
      );

      const existing = byProduit.get(produitId);
      if (existing) {
        existing.quantite += quantite;
        existing.sousTotal += sousTotal;
      } else {
        byProduit.set(produitId, {
          produitId,
          nom: produit?.nom ?? `Produit #${produitId}`,
          prixUnitaire,
          quantite,
          sousTotal,
        });
      }
    }

    return Array.from(byProduit.values());
  }
}
