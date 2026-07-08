import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  form: FormGroup;
  submitting = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      tenantName: ['', Validators.required],
      tenantEmail: ['', [Validators.required, Validators.email]],
      userName: ['', Validators.required],
      userEmail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.submitting = true;
    this.error = '';

    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Nu am putut crea contul.';
        this.submitting = false;
      },
    });
  }
}
