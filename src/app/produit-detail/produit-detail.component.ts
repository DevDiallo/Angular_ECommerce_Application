import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartProduitService } from '../services/cartProduit.service';
import { LigneStock } from '../modeles/ligneStock';
import { AuthService } from '../services/AuthService';

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
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartProduitService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('ROLE_ADMIN');

    const id = this.route.snapshot.paramMap.get('id');
    this.cartService.getLigneStocks().subscribe((lignesStocks) => {
      const found = lignesStocks.find(
        (ls) => String(ls.produit.id) === String(id),
      );
      if (found) {
        this.ligneStock = found;
      } else {
        this.notFound = true;
      }
    });
  }

  ajouterAuPanier() {
    if (this.isAdmin) {
      return;
    }

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
