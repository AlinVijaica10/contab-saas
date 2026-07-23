import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IntegrationsService, IntegrationsStatus } from '../../services/integrations';
import { AnafService } from '../../services/anaf';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-integrations',
  imports: [FormsModule, DatePipe],
  templateUrl: './integrations.html',
  styleUrl: './integrations.css',
})
export class Integrations implements OnInit {
  status = signal<IntegrationsStatus | null>(null);
  loading = signal(true);

  testEmailAddress = '';
  sendingTestEmail = signal(false);
  testEmailResult = signal<'success' | 'error' | null>(null);
  testEmailError = signal('');

  brevoApiKey = '';
  brevoSenderEmail = '';
  brevoSenderName = '';
  savingBrevo = signal(false);
  brevoSaved = signal(false);
  brevoError = signal('');

  constructor(
    private integrationsService: IntegrationsService,
    private anafService: AnafService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.refreshStatus();
    this.loadBrevoCredentials();
  }

  loadBrevoCredentials(): void {
    this.http.get<any>(`${environment.apiUrl}/tenant/me`).subscribe({
      next: (tenant) => {
        this.brevoApiKey = tenant.brevoApiKey ?? '';
        this.brevoSenderEmail = tenant.brevoSenderEmail ?? '';
        this.brevoSenderName = tenant.brevoSenderName ?? '';
      },
    });
  }

  saveBrevoCredentials(): void {
    this.savingBrevo.set(true);
    this.brevoSaved.set(false);
    this.brevoError.set('');

    this.http
      .patch(`${environment.apiUrl}/tenant/me`, {
        brevoApiKey: this.brevoApiKey,
        brevoSenderEmail: this.brevoSenderEmail,
        brevoSenderName: this.brevoSenderName,
      })
      .subscribe({
        next: () => {
          this.savingBrevo.set(false);
          this.brevoSaved.set(true);
          this.refreshStatus();
        },
        error: (err) => {
          this.savingBrevo.set(false);
          this.brevoError.set(err?.error?.message ?? 'Eroare la salvare.');
        },
      });
  }

  refreshStatus(): void {
    this.loading.set(true);
    this.integrationsService.getStatus().subscribe({
      next: (status) => {
        this.status.set(status);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  connectAnaf(): void {
    this.anafService.connect();
  }

  sendTestEmail(): void {
    if (!this.testEmailAddress) return;

    this.sendingTestEmail.set(true);
    this.testEmailResult.set(null);
    this.testEmailError.set('');

    this.integrationsService.sendTestEmail(this.testEmailAddress).subscribe({
      next: () => {
        this.sendingTestEmail.set(false);
        this.testEmailResult.set('success');
      },
      error: (err) => {
        this.sendingTestEmail.set(false);
        this.testEmailResult.set('error');
        this.testEmailError.set(err?.error?.message ?? 'Eroare necunoscută.');
      },
    });
  }
}
