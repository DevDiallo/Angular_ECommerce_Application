import { Component } from '@angular/core';
import { CartProduitService } from '../services/cartProduit.service';
import { Observable, combineLatest, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { LigneProduit } from '../modeles/ligneProduit';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart-component',
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  cartVm$!: Observable<{
    items: Array<{
      id: string;
      produitId: number;
      quantite: number;
      nom: string;
      prix: number;
      sousTotal: number;
    }>;
    total: number;
  }>;
  constructor(private produitService: CartProduitService) {}

  ngOnInit(): void {
    this.reloadCart();
  }

  reloadCart() {
    this.cartVm$ = combineLatest([
      this.produitService.getCartProduits(),
      this.produitService.getLigneStocks(),
    ]).pipe(
      map(([cartItems, lignesStock]) => {
        const produits = lignesStock.map((ligne) => ligne.produit);

        const items = cartItems.map((item) => {
          const produit = produits.find((p) => p.id === item.produitId);
          const prix = produit?.prix ?? 0;

          return {
            ...item,
            nom: produit?.nom ?? `Produit #${item.produitId}`,
            prix,
            sousTotal: prix * item.quantite,
          };
        });

        const total = items.reduce((sum, item) => sum + item.sousTotal, 0);

        return { items, total };
      }),
    );
  }

  async valider() {
    const cartItems = await firstValueFrom(
      this.produitService.getCartProduits(),
    );

    this.produitService.validateCart(cartItems).subscribe({
      next: () => {
        console.log('Stock mis à jour pour le panier');
        this.reloadCart();
      },
      error: (error) => {
        console.error('Erreur de validation du panier :', error);
      },
    });
  }

  async annuler() {
    const cartItems = await firstValueFrom(
      this.produitService.getCartProduits(),
    );

    this.produitService.cancelCart(cartItems).subscribe(
      () => {
        console.log('Panier annulé et stock restauré');
        this.reloadCart();
      },
      (error: any) => {
        console.error('Erreur lors de l’annulation du panier :', error);
      },
    );
  }
}
