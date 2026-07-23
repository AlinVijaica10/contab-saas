import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-templates',
  imports: [ReactiveFormsModule],
  templateUrl: './templates.html',
  styleUrl: './templates.css',
})
export class Templates implements OnInit {
  private apiUrl = `${environment.apiUrl}/tenant`;
  form: FormGroup;
  loading = signal(true);
  submitting = signal(false);
  error = signal('');
  success = signal(false);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
  ) {
    this.form = this.fb.group({
      documentRequestEmailSubject: [''],
      documentRequestEmailBody: [''],
      documentRequestWhatsappMessage: [''],
    });
  }

  ngOnInit(): void {
    this.http.get(`${this.apiUrl}/me`).subscribe({
      next: (tenant: any) => {
        this.form.patchValue({
          documentRequestEmailSubject:
            tenant.documentRequestEmailSubject || 'Solicitare documente - {{luna}} {{an}}',
          documentRequestEmailBody:
            tenant.documentRequestEmailBody ||
            '<p>Bună ziua,</p>\n<p>Vă rugăm să încărcați documentele contabile pentru luna <strong>{{luna}} {{an}}</strong> folosind linkul de mai jos:</p>\n<p><a href="{{link}}">{{link}}</a></p>\n<p>Vă mulțumim!</p>',
          documentRequestWhatsappMessage:
            tenant.documentRequestWhatsappMessage ||
            'Bună ziua! Vă rugăm să încărcați documentele contabile pentru {{luna}} {{an}} folosind acest link: {{link}}',
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSubmit(): void {
    this.submitting.set(true);
    this.error.set('');
    this.success.set(false);

    this.http.patch(`${this.apiUrl}/me`, this.form.value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Eroare la salvare.');
        this.submitting.set(false);
      },
    });
  }
}
