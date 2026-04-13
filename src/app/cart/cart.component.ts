import { Component } from '@angular/core';
import { CartProduitService } from '../services/cartProduit.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LigneProduit } from '../modeles/ligneProduit';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';




@Component({
  selector: 'app-cart-component',
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  produitsPanier$!: Observable<LigneProduit[]>;
  constructor(private produitService: CartProduitService) { }

  ngOnInit(): void {
    this.produitsPanier$ = this.produitService.getCartProduits();
  }
}
