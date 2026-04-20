import { Component, OnInit } from '@angular/core';
import { CartProduitService } from '../services/cartProduit.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Produit } from '../modeles/produit';
import { Categorie } from '../modeles/categorie';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';


@Component({
  selector: 'app-product-list-component',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  categories$!: Observable<Categorie[]>;
  produits$!: Observable<Produit[]>;
  constructor(private productService: CartProduitService) { }

  ngOnInit(): void {
    this.categories$ = this.productService.getCategories();
    this.produits$ = this.productService.getProduits();

    this.categories$ = forkJoin({
      categories: this.productService.getCategories(),
      produits: this.productService.getProduits()
    }).pipe(
      map(({ categories, produits }) => {
        return categories.map(cat => ({
          ...cat,
          produits: produits.filter(p => p.categorieId === cat.id_categorie)
        }));
      })
    );
    console.log('Categories avec produits :', this.categories$.subscribe(data => {
      console.log(data);
    }));
  }

  ajoutPanier(produit: Produit) {
    this.productService.addToligneProduit(produit);
    console.log('Produit ajouté au panier :', this.productService.getCartProduits().subscribe(data => {
      console.log(data);
    }));
  }
  trackById(index: number, produit: Produit): number {
    return produit.id;
  }


}
