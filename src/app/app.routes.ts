import { Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list.component';
import { CartComponent } from './cart/cart.component';
import { LoginComponent } from './login/login.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { CategorieAComponent } from './categorieA/categorieA.component';
import { CategorieBComponent } from './categorieB/categorieB.component';
import { ProductsFoundComponent } from './products-found/products-found.component';
import { ProduitDetailComponent } from './produit-detail/produit-detail.component';

export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'cart', component: CartComponent },
  { path: 'login', component: LoginComponent },
  { path: 'order-history', component: OrderHistoryComponent },
  { path: 'categorieA', component: CategorieAComponent },
  { path: 'categorieB', component: CategorieBComponent },
  { path: 'recherche', component: ProductsFoundComponent },
  { path: 'produit/:id', component: ProduitDetailComponent },
];
