import { Component, OnInit } from '@angular/core';
import { CartProduitService } from '../services/cartProduit.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Produit } from '../modeles/produit';
import { Categorie } from '../modeles/categorie';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { LigneStock } from '../modeles/ligneStock';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-list-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  categories$!: Observable<Categorie[]>;
  produits$!: Observable<Produit[]>;
  ligneStocks$!: Observable<LigneStock[]>;
  constructor(
    private productService: CartProduitService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.ligneStocks$ = this.productService.getLigneStocks();

    // ✔️ categories + produits regroupés
    this.categories$ = forkJoin({
      categories: this.productService.getCategories(),
      produits: this.productService.getProduits(),
    }).pipe(
      map(({ categories, produits }) =>
        categories.map((cat) => ({
          ...cat,
          produits: produits.filter((p) => p.categorieId === cat.id_categorie),
        })),
      ),
    );
  }

  ajoutPanier(lineStock: LigneStock) {
    this.productService.addToligneProduit(lineStock).subscribe();
  }

  voirDetail(produitId: any) {
    this.router.navigate(['/produit', produitId]);
  }
  trackById(index: number, ligneStock: LigneStock): string {
    return ligneStock.id as string;
  }
}
