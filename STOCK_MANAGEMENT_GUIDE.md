# 📦 Guide de Gestion du Stock

## Vue d'ensemble

Ce guide explique comment utiliser le système de gestion du stock implémenté dans l'application e-commerce.

## Architecture

### Services

#### 1. **StockService** (`stock.service.ts`)

Service principal pour gérer tous les stocks et lignes de stock.

**Méthodes principales:**

```typescript
// Récupérer tous les stocks
getAllStocks(): Observable<Stock[]>

// Récupérer un stock par ID
getStockById(id: number): Observable<Stock>

// Créer un nouveau stock
createStock(payload: Partial<Stock>): Observable<Stock>

// Mettre à jour un stock
updateStock(id: number, payload: Partial<Stock>): Observable<Stock>

// Supprimer un stock
deleteStock(id: number): Observable<void>

// Vérifier si un produit est en stock
isProductAvailable(ligneStockId: string, quantityRequested: number): Observable<boolean>

// Récupérer la quantité disponible
getAvailableQuantity(ligneStockId: string): Observable<number>

// Réduire le stock (après une commande)
reduceStock(ligneStockId: string, quantity: number): Observable<LigneStock>

// Augmenter le stock (retour/ajustement)
increaseStock(ligneStockId: string, quantity: number): Observable<LigneStock>
```

#### 2. **LigneStockService** (`ligne-stock.service.ts`)

Service pour gérer les lignes de stock (relations produit-stock-quantité).

**Méthodes principales:**

```typescript
// Récupérer tous les lignes de stock
getLigneStocks(): Observable<LigneStock[]>

// Récupérer une ligne de stock par ID
getLigneStockById(id: string): Observable<LigneStock>

// Créer une nouvelle ligne de stock
createLigneStock(payload: Partial<LigneStock>): Observable<LigneStock>

// Mettre à jour une ligne de stock
updateLigneStock(id: string, payload: UpdateLigneStockPayload): Observable<LigneStock>

// Supprimer une ligne de stock
deleteLigneStock(id: string): Observable<void>
```

#### 3. **CartProduitService** (`cartProduit.service.ts`)

Service central qui agrège toutes les opérations liées aux stocks.

**Méthodes de stock:**

```typescript
// Récupérer tous les stocks
getStocks(): Observable<Stock[]>

// Récupérer un stock par ID
getStockById(id: number): Observable<Stock>

// Récupérer toutes les lignes de stock
getLigneStocks(): Observable<LigneStock[]>

// Ajouter une ligne de stock
addLigneStock(ligneStock: LigneStock): Observable<LigneStock>

// Réduire la quantité d'une ligne de stock
deleteQuantityLigneStock(ligne_stock_id: string, quantite: number): Observable<LigneStock>

// Mettre à jour la quantité (ajouter/retirer)
updateStockQuantity(ligneStockId: string, delta: number): Observable<any>
```

### Modèles de données

#### Stock

```typescript
export class Stock {
  id: number;
  lignesStock: LigneStock[];
  date_stock: Date;
}
```

#### LigneStock

```typescript
export class LigneStock {
  id: string;
  stock_id: number;
  produit: Produit;
  quantite_stock: number;
}
```

#### Produit (enrichi avec stock)

```typescript
export class Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  imagePath: string;
  categorieId: number;
  ligneStockId: string; // ✅ Lien vers la ligne de stock
}
```

## Composants

### StockManagementComponent

Composant d'administration pour gérer les stocks.

**Localisation:** `src/app/stock-management/`

**Fonctionnalités:**

- ✅ Afficher tous les stocks
- ✅ Ajouter une nouvelle ligne de stock
- ✅ Modifier la quantité d'une ligne de stock
- ✅ Supprimer une ligne de stock
- ✅ Afficher le statut du stock (En stock, Stock faible, Rupture)
- ✅ Interface responsive

**Route:** `/admin/stock` (Requiert ROLE_ADMIN)

### StockStatusComponent

Composant réutilisable pour afficher le statut du stock.

**Localisation:** `src/app/shared/stock-status.component.ts`

**Utilisation:**

```typescript
<app-stock-status
  [quantity]="produit.quantite_stock"
  [lowStockThreshold]="10"
  [showQuantity]="true">
</app-stock-status>
```

## Utilisation

### 1. Afficher le statut du stock dans un produit

```typescript
import { StockStatusComponent } from '../shared/stock-status.component';

@Component({
  imports: [StockStatusComponent, ...]
})
export class MonComposant {
  quantity = 15;
}
```

```html
<app-stock-status [quantity]="quantity"></app-stock-status>
```

### 2. Vérifier la disponibilité avant d'ajouter au panier

```typescript
import { StockService } from "../services/stock.service";

export class MonComposant {
  constructor(private stockService: StockService) {}

  addToCart(produit: Produit) {
    this.stockService.isProductAvailable(produit.ligneStockId, 1).subscribe((isAvailable) => {
      if (isAvailable) {
        // Ajouter au panier
      } else {
        // Afficher erreur: produit indisponible
      }
    });
  }
}
```

### 3. Récupérer la quantité disponible

```typescript
this.stockService.getAvailableQuantity(ligneStockId).subscribe((quantity) => {
  console.log("Quantité disponible:", quantity);
});
```

### 4. Réduire le stock après une commande

```typescript
// Quand une commande est confirmée
this.stockService.reduceStock(ligneStockId, quantityOrdered).subscribe((updatedLigneStock) => {
  console.log("Stock réduit:", updatedLigneStock);
});
```

### 5. Augmenter le stock (retour/ajustement)

```typescript
// Pour un retour client
this.stockService.increaseStock(ligneStockId, quantityReturned).subscribe((updatedLigneStock) => {
  console.log("Stock augmenté:", updatedLigneStock);
});
```

## Intégration avec les composants existants

### Produit List Component

```typescript
// Dans product-list.component.ts
export class ProductListComponent implements OnInit {
  constructor(
    private stockService: StockService,
    ...
  ) {}

  ajoutPanier(produit: Produit) {
    // Vérifier le stock
    this.stockService.isProductAvailable(produit.ligneStockId, 1)
      .subscribe(isAvailable => {
        if (isAvailable) {
          this.productService.addToligneProduit(produit);
        } else {
          alert('Produit indisponible');
        }
      });
  }
}
```

### Cart Component

```typescript
// Dans cart.component.ts
// Utiliser le stock pour afficher la disponibilité
// et prévenir les commandes si rupture de stock
```

## Statuts du Stock

### En Stock ✅

- Quantité >= 10 unités
- Badge vert
- Produit commandable

### Stock Faible ⚠️

- Quantité entre 1 et 9 unités
- Badge orange
- Produit commandable mais attention requise

### Rupture de Stock ❌

- Quantité = 0
- Badge rouge
- Produit non commandable

**Configuration du seuil:** Modifiable via `lowStockThreshold` dans `StockStatusComponent`

## Endpoints API attendus

Le service suppose les endpoints suivants sur le backend:

```
GET    /api/stocks             → Récupérer tous les stocks
GET    /api/stocks/{id}        → Récupérer un stock
POST   /api/stocks             → Créer un stock
PUT    /api/stocks/{id}        → Mettre à jour un stock
DELETE /api/stocks/{id}        → Supprimer un stock

GET    /api/ligneStocks        → Récupérer toutes les lignes
GET    /api/ligneStocks/{id}   → Récupérer une ligne
POST   /api/ligneStocks        → Créer une ligne
PUT    /api/ligneStocks/{id}   → Mettre à jour une ligne
DELETE /api/ligneStocks/{id}   → Supprimer une ligne
```

## Best Practices

### 1. Toujours vérifier le stock avant d'ajouter au panier

```typescript
// ✅ BON
this.stockService.isProductAvailable(ligneStockId, quantity).subscribe((isAvailable) => {
  if (isAvailable) {
    // Ajouter au panier
  }
});

// ❌ MAUVAIS
this.cartService.addToligneProduit(produit); // Sans vérification
```

### 2. Afficher le statut du stock

```typescript
// ✅ BON
<app-stock-status [quantity]="produit.quantite_stock"></app-stock-status>

// ❌ MAUVAIS
<span>{{ produit.quantite_stock }} disponibles</span> <!-- Pas clair -->
```

### 3. Mettre à jour le stock après une commande

```typescript
// ✅ BON
onOrderConfirmed() {
  this.lignesProduit.forEach(ligne => {
    this.stockService.reduceStock(ligne.produit.ligneStockId, ligne.quantite);
  });
}

// ❌ MAUVAIS
// Ne pas mettre à jour le stock du tout
```

### 4. Gérer les erreurs

```typescript
// ✅ BON
this.stockService.reduceStock(ligneStockId, quantity).subscribe(
  (updated) => console.log("Stock réduit"),
  (error) => {
    console.error("Erreur stock:", error);
    // Afficher un message à l'utilisateur
  },
);

// ❌ MAUVAIS
this.stockService.reduceStock(ligneStockId, quantity).subscribe(); // Ignorer les erreurs
```

## Troubleshooting

### Le stock ne s'affiche pas

1. Vérifier que les données arrivent du backend
2. Vérifier que `ligneStockId` est rempli dans `Produit`
3. Vérifier que le endpoint `/api/ligneStocks` existe

### Les modifications de stock ne sont pas sauvegardées

1. Vérifier que le backend a l'endpoint PUT `/api/ligneStocks/{id}`
2. Vérifier les logs d'erreur dans la console
3. S'assurer que l'utilisateur a les droits (ROLE_ADMIN)

### Le composant StockManagementComponent affiche une page vide

1. Vérifier que les données de stock arrivent du backend
2. Vérifier les logs de la console du navigateur
3. Vérifier que les stocks ont des lignesStock remplies

## Exemple complet d'intégration

```typescript
import { Component, OnInit } from "@angular/core";
import { StockService } from "../services/stock.service";
import { StockStatusComponent } from "../shared/stock-status.component";
import { Produit } from "../modeles/produit";

@Component({
  selector: "app-product-card",
  standalone: true,
  imports: [StockStatusComponent],
  template: `
    <div class="product">
      <h3>{{ produit.nom }}</h3>
      <p>{{ produit.description }}</p>
      <span class="price">{{ produit.prix }}€</span>

      <!-- Afficher le statut du stock -->
      <app-stock-status [quantity]="stock?.quantite_stock || 0"></app-stock-status>

      <!-- Bouton ajouter au panier (désactivé si rupture de stock) -->
      <button [disabled]="stock?.quantite_stock === 0" (click)="addToCart()">Ajouter au panier</button>
    </div>
  `,
})
export class ProductCardComponent implements OnInit {
  @Input() produit!: Produit;
  stock: any;

  constructor(private stockService: StockService) {}

  ngOnInit() {
    if (this.produit.ligneStockId) {
      this.stockService.getLigneStockById(this.produit.ligneStockId).subscribe((ligne) => {
        this.stock = ligne;
      });
    }
  }

  addToCart() {
    this.stockService.isProductAvailable(this.produit.ligneStockId, 1).subscribe((available) => {
      if (available) {
        // Ajouter au panier
      } else {
        alert("Produit indisponible");
      }
    });
  }
}
```

## Prochaines étapes

1. ✅ Implémenter les endpoints `/api/stocks` et `/api/ligneStocks` sur le backend
2. ✅ Ajouter la vérification de stock à la création de commande
3. ✅ Implémenter les retours de produits (augmentation du stock)
4. ✅ Ajouter des alertes pour le stock faible
5. ✅ Implémenter un système de réservation de stock
6. ✅ Ajouter des rapports de stock (analytics)
