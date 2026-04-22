import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import {
  AdminManagementService,
  AdminUser,
} from '../services/admin-management.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private adminService: AdminManagementService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.adminService
      .getUsers()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (users) => {
          this.users = users;
        },
        error: () => {
          this.errorMessage = 'Impossible de charger les utilisateurs.';
        },
      });
  }

  setRole(user: AdminUser, role: 'ROLE_ADMIN' | 'ROLE_USER'): void {
    if (!user.id) {
      return;
    }

    this.adminService.updateUserRole(user.id, role).subscribe({
      next: () => this.loadUsers(),
      error: () => {
        this.errorMessage = 'La mise a jour du role a echoue.';
      },
    });
  }

  deleteUser(user: AdminUser): void {
    if (!user.id || !confirm(`Supprimer ${user.prenom} ${user.nom} ?`)) {
      return;
    }

    this.adminService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: () => {
        this.errorMessage = 'La suppression de l utilisateur a echoue.';
      },
    });
  }

  resolveRole(user: AdminUser): string {
    if (user.role) {
      return user.role;
    }

    if (user.roles && user.roles.length > 0) {
      return user.roles[0];
    }

    return 'ROLE_USER';
  }
}
