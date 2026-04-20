import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Commande } from '../modeles/commande';
import { CartProduitService } from '../services/cartProduit.service';

@Component({
  selector: 'app-order-history-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.scss',
})
export class OrderHistoryComponent implements OnInit {
  commandes$!: Observable<Commande[]>;

  constructor(private cartService: CartProduitService) {}

  ngOnInit(): void {
    this.commandes$ = this.cartService
      .getCommandes()
      .pipe(
        map((commandes) =>
          [...commandes].sort(
            (a, b) =>
              new Date(b.dateValidation).getTime() -
              new Date(a.dateValidation).getTime(),
          ),
        ),
      );
  }
}
