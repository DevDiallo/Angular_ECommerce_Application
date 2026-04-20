import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartProduitService } from '../services/cartProduit.service';
import { LigneStock } from '../modeles/ligneStock';
import { map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Stock } from '../modeles/stock';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-produit-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './produit-detail.component.html',
  styleUrl: './produit-detail.component.scss',
})
export class ProduitDetailComponent implements OnInit {
  ligneStock: LigneStock | null = null;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cartService: CartProduitService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.http
      .get<Stock[]>('http://localhost:3000/stock')
      .subscribe((stocks) => {
        const toutes = stocks.flatMap((s) => s.lignesStock);
        const found = toutes.find((ls) => String(ls.produit.id) === String(id));
        if (found) {
          this.ligneStock = found;
        } else {
          this.notFound = true;
        }
      });
  }

  ajouterAuPanier() {
    if (this.ligneStock) {
      this.cartService.addToligneProduit(this.ligneStock).subscribe(() => {
        this.router.navigate(['/cart']);
      });
    }
  }

  retour() {
    history.back();
  }
}
