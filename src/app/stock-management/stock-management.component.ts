import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { StockService } from '../services/stock.service';
import { CartProduitService } from '../services/cartProduit.service';
import { Stock } from '../modeles/stock';
import { LigneStock } from '../modeles/ligneStock';
import { Produit } from '../modeles/produit';

@Component({
  selector: 'app-stock-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-management.component.html',
  styleUrl: './stock-management.component.scss',
})
export class StockManagementComponent implements OnInit {
  stocks$!: Observable<Stock[]>;
  produits: Produit[] = [];
  ligneStocks: LigneStock[] = [];

  selectedStock: Stock | null = null;
  editingLigneStock: LigneStock | null = null;
  isAddingLigneStock = false;

  newLigneStock = {
    produitId: 0,
    quantite_stock: 0,
  };

  errorMessage = '';
  successMessage = '';

  constructor(
    private stockService: StockService,
    private cartService: CartProduitService,
  ) {
    this.stocks$ = this.stockService.stocks$;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Charger les produits
    this.cartService.getProduits().subscribe(
      (produits) => {
        this.produits = produits;
      },
      (error) => {
        console.error('Erreur lors du chargement des produits:', error);
      },
    );

    // Charger les lignes de stock
    this.loadLigneStocks();
  }

  loadLigneStocks(): void {
    this.cartService.getLigneStocks().subscribe(
      (ligneStocks) => {
        this.ligneStocks = ligneStocks;
      },
      (error) => {
        console.error('Erreur lors du chargement des lignes de stock:', error);
      },
    );
  }

  selectStock(stock: Stock): void {
    this.selectedStock = stock;
    this.editingLigneStock = null;
    this.isAddingLigneStock = false;
  }

  editLigneStock(ligneStock: LigneStock): void {
    this.editingLigneStock = { ...ligneStock };
    this.isAddingLigneStock = false;
  }

  saveLigneStockEdit(): void {
    if (!this.editingLigneStock) return;

    this.stockService
      .updateLigneStock(this.editingLigneStock.id, {
        quantite_stock: this.editingLigneStock.quantite_stock,
      })
      .subscribe(
        () => {
          this.successMessage = '✅ Ligne de stock mise à jour avec succès';
          this.editingLigneStock = null;
          this.loadLigneStocks();
          this.clearMessages();
        },
        (error) => {
          this.errorMessage = `❌ Erreur: ${error.error?.message || error.message}`;
          this.clearMessages();
        },
      );
  }

  deleteLigneStock(id: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ligne de stock ?'))
      return;

    this.stockService.updateLigneStock(id, { quantite_stock: 0 }).subscribe(
      () => {
        this.successMessage = '✅ Ligne de stock supprimée';
        this.loadLigneStocks();
        this.clearMessages();
      },
      (error) => {
        this.errorMessage = `❌ Erreur: ${error.error?.message || error.message}`;
        this.clearMessages();
      },
    );
  }

  startAddingLigneStock(): void {
    this.isAddingLigneStock = true;
    this.editingLigneStock = null;
    this.newLigneStock = {
      produitId: 0,
      quantite_stock: 0,
    };
  }

  cancelAddingLigneStock(): void {
    this.isAddingLigneStock = false;
  }

  addNewLigneStock(): void {
    if (
      !this.newLigneStock.produitId ||
      this.newLigneStock.quantite_stock < 0
    ) {
      this.errorMessage = '❌ Veuillez remplir tous les champs correctement';
      this.clearMessages();
      return;
    }

    const produit = this.produits.find(
      (p) => p.id === this.newLigneStock.produitId,
    );
    if (!produit) {
      this.errorMessage = '❌ Produit non trouvé';
      this.clearMessages();
      return;
    }

    // Créer une nouvelle ligne de stock liée au produit
    const ligneStockPayload: Partial<LigneStock> = {
      produit: produit,
      quantite_stock: this.newLigneStock.quantite_stock,
    };

    this.stockService
      .createStock({
        lignesStock: [ligneStockPayload as LigneStock],
        date_stock: new Date(),
      } as Partial<Stock>)
      .subscribe(
        () => {
          this.successMessage = '✅ Nouvelle ligne de stock créée';
          this.isAddingLigneStock = false;
          this.loadLigneStocks();
          this.clearMessages();
        },
        (error) => {
          this.errorMessage = `❌ Erreur: ${error.error?.message || error.message}`;
          this.clearMessages();
        },
      );
  }

  cancelEdit(): void {
    this.editingLigneStock = null;
  }

  getProductName(produitId: number): string {
    const produit = this.produits.find((p) => p.id === produitId);
    return produit ? produit.nom : `Produit #${produitId}`;
  }

  isStockLow(quantite: number): boolean {
    return quantite < 10;
  }

  isOutOfStock(quantite: number): boolean {
    return quantite === 0;
  }

  private clearMessages(): void {
    setTimeout(() => {
      this.errorMessage = '';
      this.successMessage = '';
    }, 5000);
  }
}
