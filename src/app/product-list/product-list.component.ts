import { Component, Input, OnInit } from '@angular/core';
import { CartProduitService } from '../services/cartProduit.service';
import { Observable } from 'rxjs';
import { NgForOf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Produit } from '../modeles/produit';

@Component({
  selector: 'app-product-list-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {

  produits$!: Observable<Produit[]>;
  constructor(private productService: CartProduitService) { }

  ngOnInit(): void {
    this.productService.getProduits().subscribe(data => {
      console.log(data);
    });
    this.produits$ = this.productService.getProduits();
  }
  ajoutPanier(produit: Produit) {
    this.productService.addToligneProduit(produit);
    console.log('Produit ajouté au panier :', this.productService.getCartProduits().subscribe(data => {
      console.log(data);
    }));
  }
}
