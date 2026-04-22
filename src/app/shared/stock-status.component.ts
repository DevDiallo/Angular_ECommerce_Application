import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stock-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'stock-status ' + statusClass">
      <span class="badge" [class]="'badge-' + status">
        {{ statusIcon }} {{ statusText }}
      </span>
      <span class="quantity" *ngIf="showQuantity">{{ quantity }} unités</span>
    </div>
  `,
  styles: [
    `
      .stock-status {
        display: flex;
        align-items: center;
        gap: 10px;

        .badge {
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 0.85em;
          font-weight: 600;
          white-space: nowrap;

          &.badge-in-stock {
            background-color: #d4edda;
            color: #155724;
          }

          &.badge-low {
            background-color: #fff3cd;
            color: #856404;
          }

          &.badge-out-of-stock {
            background-color: #f8d7da;
            color: #721c24;
          }
        }

        .quantity {
          font-size: 0.9em;
          color: #666;
        }
      }
    `,
  ],
})
export class StockStatusComponent {
  @Input() quantity: number = 0;
  @Input() lowStockThreshold: number = 10;
  @Input() showQuantity: boolean = true;

  get status(): string {
    if (this.quantity === 0) return 'out-of-stock';
    if (this.quantity < this.lowStockThreshold) return 'low';
    return 'in-stock';
  }

  get statusText(): string {
    if (this.quantity === 0) return 'Rupture de stock';
    if (this.quantity < this.lowStockThreshold) return 'Stock faible';
    return 'En stock';
  }

  get statusIcon(): string {
    if (this.quantity === 0) return '❌';
    if (this.quantity < this.lowStockThreshold) return '⚠️';
    return '✅';
  }

  get statusClass(): string {
    return 'status-' + this.status;
  }
}
