import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { combineLatest, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { Commande, CommandeItem } from '../modeles/commande';
import { Produit } from '../modeles/produit';
import { AdminManagementService } from '../services/admin-management.service';
import {
  CommandeProduit,
  CommandeProduitService,
} from '../services/commande-produit.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  orders: Commande[] = [];
  selectedOrderId: string | null = null;
  isLoading = false;
  errorMessage = '';
  private commandesProduits: CommandeProduit[] = [];
  private produitsById = new Map<number, Produit>();
  private usersById = new Map<string, any>();

  constructor(
    private adminService: AdminManagementService,
    private commandeProduitService: CommandeProduitService,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.errorMessage = '';
    this.isLoading = true;

    combineLatest([
      this.adminService
        .getOrders()
        .pipe(catchError(() => of([] as Commande[]))),
      this.commandeProduitService
        .getCommandesProduits()
        .pipe(catchError(() => of([] as CommandeProduit[]))),
      this.adminService
        .getProducts()
        .pipe(catchError(() => of([] as Produit[]))),
      this.adminService.getUsers().pipe(catchError(() => of([] as any[]))),
    ])
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ([orders, commandesProduits, produits, users]) => {
          this.commandesProduits = commandesProduits || [];
          this.produitsById = new Map<number, Produit>(
            (produits || []).map((p) => [Number(p.id), p]),
          );
          this.usersById = new Map<string, any>(
            (users || []).map((u) => [String(u?.id ?? ''), u]),
          );

          this.orders = [...(orders || [])]
            .filter((order): order is Commande => !!order)
            .map((order) => ({
              ...order,
              items: this.getOrderItems(order),
              ...(this.getOrderCustomer(order)
                ? {
                    nomClient: this.getOrderCustomer(order)!.nom,
                    prenomClient: this.getOrderCustomer(order)!.prenom,
                    emailClient: this.getOrderCustomer(order)!.email,
                    telephoneClient: this.getOrderCustomer(order)!.telephone,
                  }
                : {}),
            }))
            .sort(
              (a, b) =>
                new Date(b.dateValidation || 0).getTime() -
                new Date(a.dateValidation || 0).getTime(),
            );
        },
        error: () => {
          this.errorMessage = 'Impossible de charger les commandes.';
        },
      });
  }

  deleteOrder(order: Commande): void {
    if (!confirm(`Supprimer la commande ${order.id} ?`)) {
      return;
    }

    this.adminService.deleteOrder(order.id).subscribe({
      next: () => this.loadOrders(),
      error: () => {
        this.errorMessage = 'La suppression de la commande a echoue.';
      },
    });
  }

  getItemsCount(order: Commande | null | undefined): number {
    return this.getOrderItems(order).reduce(
      (sum, item) => sum + Number(item.quantite || 0),
      0,
    );
  }

  toggleOrderDetails(order: Commande): void {
    const id = String(order.id);
    this.selectedOrderId = this.selectedOrderId === id ? null : id;
  }

  isOrderExpanded(order: Commande): boolean {
    return this.selectedOrderId === String(order.id);
  }

  getOrderCustomer(order: Commande): {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  } | null {
    const o = order as any;
    const rawCustomer = o?.utilisateur ?? o?.user ?? o?.client ?? null;

    if (!rawCustomer) {
      const userId = String(
        o?.utilisateurId ?? o?.userId ?? o?.clientId ?? o?.customerId ?? '',
      );
      if (userId) {
        const mappedUser = this.usersById.get(userId);
        if (mappedUser) {
          return {
            nom: mappedUser?.nom ?? '',
            prenom: mappedUser?.prenom ?? '',
            email: mappedUser?.email ?? '',
            telephone: mappedUser?.telephone ?? '',
          };
        }
      }

      const nom = o?.nomClient ?? o?.clientNom ?? '';
      const prenom = o?.prenomClient ?? o?.clientPrenom ?? '';
      const email = o?.emailClient ?? o?.clientEmail ?? '';
      const telephone = o?.telephoneClient ?? o?.clientTelephone ?? '';

      if (!nom && !prenom && !email && !telephone) {
        return null;
      }

      return { nom, prenom, email, telephone };
    }

    return {
      nom: rawCustomer?.nom ?? '',
      prenom: rawCustomer?.prenom ?? '',
      email: rawCustomer?.email ?? '',
      telephone: rawCustomer?.telephone ?? '',
    };
  }

  getOrderItems(order: Commande | null | undefined): CommandeItem[] {
    if (!order) {
      return [];
    }

    const o = order as any;
    const rawItems =
      o?.items ?? o?.articles ?? o?.lignes ?? o?.commandeProduits;

    if (!Array.isArray(rawItems)) {
      const commandeId = String(o?.id ?? '');
      if (!commandeId) {
        return [];
      }

      const lignes = this.commandesProduits.filter((cp) => {
        const cpCommandeId = String(
          (cp as any)?.commandeId ?? (cp as any)?.commande?.id ?? '',
        );
        return cpCommandeId === commandeId;
      });

      if (!lignes.length) {
        return [];
      }

      return lignes
        .map((ligne) => {
          const produitId = Number(
            (ligne as any)?.produitId ?? (ligne as any)?.produit?.id ?? 0,
          );
          const quantite = Number((ligne as any)?.quantite ?? 1);
          const produit = this.produitsById.get(produitId);
          const prixUnitaire = Number(
            (ligne as any)?.prixUnitaire ?? produit?.prix ?? 0,
          );

          return {
            produitId,
            nom: produit?.nom ?? `Produit #${produitId}`,
            prixUnitaire,
            quantite,
            sousTotal: Number(
              (ligne as any)?.sousTotal ?? prixUnitaire * quantite,
            ),
          } as CommandeItem;
        })
        .filter((item) => item.quantite > 0 || item.prixUnitaire > 0);
    }

    return rawItems
      .map((item: any) => {
        const produitId = Number(item?.produitId ?? item?.produit?.id ?? 0);
        const quantite = Number(item?.quantite ?? item?.quantity ?? 0);
        const prixUnitaire = Number(
          item?.prixUnitaire ?? item?.prix ?? item?.produit?.prix ?? 0,
        );
        const sousTotal = Number(
          item?.sousTotal ?? item?.subtotal ?? prixUnitaire * quantite,
        );
        const nom =
          item?.nom ?? item?.produitNom ?? item?.produit?.nom ?? 'Produit';

        return {
          produitId,
          nom,
          prixUnitaire,
          quantite,
          sousTotal,
        } as CommandeItem;
      })
      .filter((item) => item.quantite > 0 || item.prixUnitaire > 0);
  }
}
