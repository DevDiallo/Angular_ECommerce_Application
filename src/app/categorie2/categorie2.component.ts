import { Component } from '@angular/core';
import { CartProduitService } from '../services/cartProduit.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Produit } from '../modeles/produit';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categorie2',
  imports: [
    CommonModule
  ],
  templateUrl: './categorie2.component.html',
  styleUrl: './categorie2.component.scss'
})
export class Categorie2Component {
  produitsCategorie2$!: Observable<Produit[]>;

  constructor(private produitService: CartProduitService) { }

  ngOnInit(): void {
    // Logique pour charger les produits de la catégorie 2
    this.produitsCategorie2$ = this.produitService.getProduits().pipe(
      map(produits => produits.filter(p => p.categorieId === 2))
    );
    console.log('Produits de la catégorie 2 :', this.produitsCategorie2$.subscribe(data => {
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
