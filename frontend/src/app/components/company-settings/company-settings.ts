import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-company-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './company-settings.html',
  styleUrl: './company-settings.css',
})
export class CompanySettings implements OnInit {
  private apiUrl = 'http://localhost:3000/tenant';
  form: FormGroup;
  submitting = signal(false);
  loading = signal(true);
  error = signal('');
  success = signal(false);
  bankNotificationEmail = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
  ) {
    this.form = this.fb.group({
      name: [''],
      cui: [''],
      email: [''],
      addressStreet: [''],
      addressCity: [''],
      addressCounty: [''],
      addressPostalCode: [''],
      addressCountry: ['RO'],
      iban: [''],
      bankName: [''],
      invoiceSeriesPrefix: ['FCT'],
      invoiceDueDays: [30],
      invoiceDefaultVatRate: [19],
      invoiceDefaultNote: [''],
    });
  }

  ngOnInit(): void {
    this.http.get<any>(`${this.apiUrl}/me`).subscribe({
      next: (tenant) => {
        this.form.patchValue(tenant as Record<string, unknown>);
        this.bankNotificationEmail = tenant.bankNotificationEmail ?? '';
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Nu am putut încărca datele firmei.');
        this.loading.set(false);
        console.error(err);
      },
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
        this.error.set('Nu am putut salva datele firmei.');
        this.submitting.set(false);
        console.error(err);
      },
    });
  }
}
