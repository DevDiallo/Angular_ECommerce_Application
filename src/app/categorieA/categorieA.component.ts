import { Component, OnInit } from '@angular/core';
import { CartProduitService } from '../services/cartProduit.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LigneStock } from '../modeles/ligneStock';

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

  constructor(private produitService: CartProduitService) {}

  ngOnInit(): void {
    // 🔥 on part du stock uniquement
    this.ligneStocksCategorieA$ = this.produitService.getStocks().pipe(
      map((stocks) => stocks.flatMap((stock) => stock.lignesStock)),
      map((lignesStock) =>
        lignesStock.filter((ls) => ls.produit.categorieId === 1),
      ),
    );
  }

  // 🛒 ajout au panier basé sur le stock
  ajoutPanier(ligneStock: LigneStock) {
    this.produitService.addToligneProduit(ligneStock).subscribe();
  }

  trackById(index: number, ligneStock: LigneStock): string {
    return ligneStock.id as string;
  }
}
