import { Component, OnInit } from '@angular/core';
import { CartProduitService } from '../services/cartProduit.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LigneStock } from '../modeles/ligneStock';
import { AuthService } from '../services/AuthService';

@Component({
  selector: 'app-categorie1',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categorieA.component.html',
  styleUrl: './categorieA.component.scss',
})
export class CategorieAComponent implements OnInit {
  // 🔥 Source de vérité = stock
  ligneStocksCategorieA$!: Observable<LigneStock[]>;
  isAdmin = false;

  constructor(
    private produitService: CartProduitService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('ROLE_ADMIN');

    // 🔥 on part du stock uniquement
    this.ligneStocksCategorieA$ = this.produitService
      .getLigneStocks()
      .pipe(
        map((lignesStock) =>
          lignesStock.filter((ls) => ls.produit.categorieId === 1),
        ),
      );
  }

  // 🛒 ajout au panier basé sur le stock
  ajoutPanier(ligneStock: LigneStock) {
    if (this.isAdmin) {
      return;
    }

    this.produitService.addToligneProduit(ligneStock).subscribe();
  }

  trackById(index: number, ligneStock: LigneStock): string {
    return ligneStock.id as string;
  }
}
