import { Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list.component';
import { CartComponent } from './cart/cart.component';
import { LoginComponent } from './login/login.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { Categorie1Component } from './categorie1/categorie1.component';
import { Categorie2Component } from './categorie2/categorie2.component';
import { ProductsFoundComponent } from './products-found/products-found.component';

export const routes: Routes = [
    { path: '', component: ProductListComponent },
    { path: 'cart', component: CartComponent },
    { path: 'login', component: LoginComponent },
    { path: 'order-history', component: OrderHistoryComponent },
    { path: 'categorie1', component: Categorie1Component },
    { path: 'categorie2', component: Categorie2Component },
    { path: 'recherche', component: ProductsFoundComponent }
];
