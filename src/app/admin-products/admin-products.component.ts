import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Produit } from '../modeles/produit';
import {
  AdminManagementService,
  AdminProductPayload,
} from '../services/admin-management.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  products: Produit[] = [];
  isLoading = false;
  errorMessage = '';

  readonly productForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(4)]],
    prix: [0, [Validators.required, Validators.min(1)]],
    imagePath: ['', [Validators.required]],
    categorieId: [1, [Validators.required, Validators.min(1)]],
    quantiteStock: [0, [Validators.required, Validators.min(0)]],
  });

  constructor(private adminService: AdminManagementService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.adminService
      .getProducts()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (products) => {
          this.products = products;
        },
        error: () => {
          this.errorMessage = 'Impossible de charger les produits.';
        },
      });
  }

  createProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const formValue = this.productForm.getRawValue();
    const payload: AdminProductPayload = {
      nom: formValue.nom.trim(),
      description: formValue.description.trim(),
      prix: Number(formValue.prix),
      imagePath: formValue.imagePath.trim(),
      categorieId: Number(formValue.categorieId),
    };
    const quantiteStock = Number(formValue.quantiteStock);

    console.group('📤 [Admin] Création produit - Requête');
    console.log('URL: POST /api/produits');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Quantité stock initiale:', quantiteStock);
    console.groupEnd();

    this.adminService.createProductWithStock(payload, quantiteStock).subscribe({
      next: () => {
        console.group('✅ [Admin] Création produit + stock - Succès');
        console.log('Produit créé et associé à la ligne de stock');
        console.groupEnd();

        this.productForm.reset({
          nom: '',
          description: '',
          prix: 0,
          imagePath: '',
          categorieId: 1,
          quantiteStock: 0,
        });
        this.loadProducts();
      },
      error: (error: HttpErrorResponse) => {
        console.group('❌ [Admin] Création produit - Erreur');
        console.error('Status:', error.status, error.statusText);
        console.error('URL:', error.url);
        console.error("Body complet de l'erreur:", error.error);
        console.error('Headers:', error.headers);
        console.groupEnd();

        this.errorMessage = this.buildApiError(error);
      },
    });
  }

  deleteProduct(product: Produit): void {
    if (!confirm(`Supprimer le produit ${product.nom} ?`)) {
      return;
    }

    this.adminService.deleteProduct(product.id).subscribe({
      next: () => this.loadProducts(),
      error: () => {
        this.errorMessage = 'La suppression du produit a echoue.';
      },
    });
  }

  private buildApiError(error: HttpErrorResponse): string {
    const apiMessage =
      (typeof error.error === 'string' && error.error) ||
      error.error?.message ||
      error.error?.error ||
      null;

    if (apiMessage) {
      return apiMessage;
    }

    if (error.status === 403) {
      return 'Acces refuse (403) lors de la creation du produit. Verifie les roles backend pour POST /api/produits.';
    }

    if (error.status === 400) {
      return 'Requete invalide (400). Verifie les champs du produit.';
    }

    return `La creation du produit a echoue (${error.status || 'erreur reseau'}).`;
  }
}
