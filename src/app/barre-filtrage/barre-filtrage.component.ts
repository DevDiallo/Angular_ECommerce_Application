import { Component } from '@angular/core';
import { CartProduitService } from '../services/cartProduit.service';
import { map, take } from 'rxjs/operators';
import { Produit } from '../modeles/produit';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { SearchService } from '../services/search.service';

@Component({
  selector: 'app-barre-filtrage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './barre-filtrage.component.html',
  styleUrls: ['./barre-filtrage.component.scss'],
})
export class BarreFiltrageComponent {
  termeRecherche: string = '';
  constructor(
    private produitService: CartProduitService,
    private searchService: SearchService,
    private router: Router,
  ) {}

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD') // sépare les accents
      .replace(/[\u0300-\u036f]/g, '') // supprime les accents
      .replace(/\s+/g, ''); // supprime les espaces multiples
  }

  rechercherProduit() {
    const termeNormalise = this.normalize(this.termeRecherche);
    this.produitService
      .getLigneStocks()
      .pipe(
        take(1),
        map((lignesStocks) => {
          const tousLesProduits: Produit[] = lignesStocks.map(
            (ls) => ls.produit,
          );
          // Dédoublonner par id
          const unique = tousLesProduits.filter(
            (p, i, arr) =>
              arr.findIndex((x) => String(x.id) === String(p.id)) === i,
          );
          if (!termeNormalise) return unique;
          return unique.filter((p) =>
            this.normalize(p.nom).includes(termeNormalise),
          );
        }),
      )
      .subscribe((produitsFiltres) => {
        this.searchService.setProduits(produitsFiltres);
        this.router.navigate(['/recherche']);
      });
  }
  trackById(index: number, produit: Produit): number {
    return produit.id;
  }
}
