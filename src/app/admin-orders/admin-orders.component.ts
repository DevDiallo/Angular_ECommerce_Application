import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Commande } from '../modeles/commande';
import { AdminManagementService } from '../services/admin-management.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  orders: Commande[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private adminService: AdminManagementService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.adminService
      .getOrders()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (orders) => {
          this.orders = [...orders].sort(
            (a, b) =>
              new Date(b.dateValidation).getTime() -
              new Date(a.dateValidation).getTime(),
          );
        },
        error: () => {
          this.errorMessage = 'Impossible de charger les commandes.';
        },
      });
  }

  deleteOrder(order: Commande): void {
    if (!confirm(`Supprimer la commande ${order.id} ?`)) {
      return;
    }

    this.adminService.deleteOrder(order.id).subscribe({
      next: () => this.loadOrders(),
      error: () => {
        this.errorMessage = 'La suppression de la commande a echoue.';
      },
    });
  }

  getItemsCount(order: Commande): number {
    return order.items.reduce((sum, item) => sum + item.quantite, 0);
  }
}
