import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../services/AuthService';
import { RegisterRequest } from '../modeles/auth';

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isSubmitting = false;
  apiError = '';

  readonly registerForm = this.fb.nonNullable.group(
    {
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator] },
  );

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.apiError = '';
    this.isSubmitting = true;

    this.authService
      .register(this.registerForm.getRawValue() as RegisterRequest)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/login');
        },
        error: (error: Error) => {
          this.apiError = error.message;
        },
      });
  }

  get nomCtrl() {
    return this.registerForm.controls.nom;
  }

  get prenomCtrl() {
    return this.registerForm.controls.prenom;
  }

  get emailCtrl() {
    return this.registerForm.controls.email;
  }

  get telephoneCtrl() {
    return this.registerForm.controls.telephone;
  }

  get passwordCtrl() {
    return this.registerForm.controls.password;
  }

  get confirmPasswordCtrl() {
    return this.registerForm.controls.confirmPassword;
  }

  get hasPasswordMismatch(): boolean {
    return (
      this.registerForm.hasError('passwordMismatch') &&
      this.confirmPasswordCtrl.touched
    );
  }
}
