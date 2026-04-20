import { Component } from '@angular/core';
import { CartProduitService } from '../services/cartProduit.service';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Produit } from '../modeles/produit';

@Component({
  selector: 'app-categorie1',
  imports: [
    CommonModule
  ],
  templateUrl: './categorie1.component.html',
  styleUrl: './categorie1.component.scss'
})
export class Categorie1Component {
  produitCategorie1$!: Observable<Produit[]>;
  constructor(private produitService: CartProduitService) { }

  ngOnInit(): void {
    // Logique pour charger les produits de la catégorie 1
    this.produitCategorie1$ = this.produitService.getProduits().pipe(
      map(produits => produits.filter(p => p.categorieId === 1))
    );
    console.log('Produits de la catégorie 1 :', this.produitCategorie1$.subscribe(data => {
      console.log(data);
    }));
  }
  ajoutPanier(produit: Produit) {
    this.produitService.addToligneProduit(produit);
    console.log('Produit ajouté au panier :', this.produitService.getCartProduits().subscribe(data => {
      console.log(data);
    }));
  }
  trackById(index: number, produit: Produit): number {
    return produit.id;
  }
}
