import { Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list.component';
import { CartComponent } from './cart/cart.component';
import { LoginComponent } from './login/login.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { CategorieAComponent } from './categorieA/categorieA.component';
import { CategorieBComponent } from './categorieB/categorieB.component';
import { ProductsFoundComponent } from './products-found/products-found.component';
import { ProduitDetailComponent } from './produit-detail/produit-detail.component';
import { RegisterComponent } from './register/register.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminProductsComponent } from './admin-products/admin-products.component';
import { AdminOrdersComponent } from './admin-orders/admin-orders.component';
import { StockManagementComponent } from './stock-management/stock-management.component';

export const routes: Routes = [
  { path: '', component: ProductListComponent },
  {
    path: 'cart',
    component: CartComponent,
    canActivate: [authGuard, roleGuard(['ROLE_USER'])],
  },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'order-history',
    component: OrderHistoryComponent,
    canActivate: [authGuard, roleGuard(['ROLE_USER'])],
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard(['ROLE_ADMIN'])],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'users',
      },
      {
        path: 'users',
        component: AdminUsersComponent,
        canActivate: [roleGuard(['ROLE_ADMIN'])],
      },
      {
        path: 'products',
        component: AdminProductsComponent,
        canActivate: [roleGuard(['ROLE_ADMIN'])],
      },
      {
        path: 'orders',
        component: AdminOrdersComponent,
        canActivate: [roleGuard(['ROLE_ADMIN'])],
      },
      {
        path: 'stock',
        component: StockManagementComponent,
        canActivate: [roleGuard(['ROLE_ADMIN'])],
      },
    ],
  },
  { path: 'categorieA', component: CategorieAComponent },
  { path: 'categorieB', component: CategorieBComponent },
  { path: 'recherche', component: ProductsFoundComponent },
  { path: 'produit/:id', component: ProduitDetailComponent },
];
