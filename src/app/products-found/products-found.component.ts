import { Component } from '@angular/core';
import { SearchService } from '../services/search.service';
import { Produit } from '../modeles/produit';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products-found',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products-found.component.html',
  styleUrl: './products-found.component.scss',
})
export class ProductsFoundComponent {
  productsFound: Produit[] = [];
  constructor(
    private searchService: SearchService,
    private router: Router,
  ) {
    this.searchService.produits$.subscribe((produits) => {
      this.productsFound = produits;
    });
  }

  retour() {
    this.router.navigate(['/']);
  }

  voirDetail(produitId: any) {
    this.router.navigate(['/produit', produitId]);
  }

  trackById(index: number, produit: Produit): any {
    return produit.id;
  }
}
