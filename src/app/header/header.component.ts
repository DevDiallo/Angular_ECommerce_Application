import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartComponent } from '../cart/cart.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header-component',
  standalone: true,
  imports: [
    RouterLink,
    CartComponent,
    MatIconModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

}
