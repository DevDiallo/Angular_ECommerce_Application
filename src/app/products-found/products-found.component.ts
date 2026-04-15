import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { SearchService } from '../services/search.service';
import { Produit } from '../modeles/produit';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-products-found',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './products-found.component.html',
  styleUrl: './products-found.component.scss'
})
export class ProductsFoundComponent {
  productsFound: Produit[] = [];
  constructor(private searchService: SearchService) {
    this.searchService.produits$.subscribe(produits => {
      this.productsFound = produits;
    });
  }

  trackById(index: number, produit: Produit): number {
    return produit.id;
  }
}