import { Component, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/AuthService';

@Component({
  selector: 'app-header-component',
  standalone: true,
  imports: [AsyncPipe, NgIf, RouterLink, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);

  readonly isAuthenticated$ = this.authService.isAuthenticated$;
  readonly currentUser$ = this.authService.currentUser$;
  readonly isAdmin$ = this.authService.isAdmin$;
  readonly isUser$ = this.authService.isUser$;

  logout(): void {
    this.authService.logout();
  }
}
