import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IntegrationsService, IntegrationsStatus } from '../../services/integrations';
import { AnafService } from '../../services/anaf';
import { DatePipe } from '@angular/common';

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

  constructor(
    private integrationsService: IntegrationsService,
    private anafService: AnafService,
  ) {}

  ngOnInit(): void {
    this.refreshStatus();
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
