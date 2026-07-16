import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientService, Client } from '../../services/client';
import {
  DocumentRequestLogEntry,
  DocumentService,
  RequestMonthlyResult,
} from '../../services/document';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-client-list',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './client-list.html',
  styleUrl: './client-list.css',
})
export class ClientList implements OnInit {
  clients = signal<Client[]>([]);
  loading = signal(true);
  error = signal('');
  copiedClientId = signal<number | null>(null);

  requesting = signal(false);
  requestResults = signal<RequestMonthlyResult[] | null>(null);

  requestHistory = signal<DocumentRequestLogEntry[]>([]);
  showHistory = signal(false);

  categoryStatusLabels: Record<string, string> = {
    requested: 'Solicitat',
    already_has_documents: 'Avea deja documente',
  };

  selectedMonth: number;
  selectedYear: number;

  monthNames = [
    'Ianuarie',
    'Februarie',
    'Martie',
    'Aprilie',
    'Mai',
    'Iunie',
    'Iulie',
    'August',
    'Septembrie',
    'Octombrie',
    'Noiembrie',
    'Decembrie',
  ];

  years: number[] = [];

  constructor(
    private clientService: ClientService,
    private documentService: DocumentService,
  ) {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();

    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
      this.years.push(y);
    }
  }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading.set(true);
    this.clientService.getAll().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Nu am putut încărca lista de clienți.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  deleteClient(id: number): void {
    if (!confirm('Sigur vrei să ștergi acest client?')) {
      return;
    }
    this.clientService.delete(id).subscribe({
      next: () => {
        this.clients.update((list) => list.filter((c) => c.id !== id));
      },
      error: (err) => {
        alert('Nu am putut șterge clientul.');
        console.error(err);
      },
    });
  }

  copyUploadLink(clientId: number): void {
    this.documentService.getUploadLink(clientId).subscribe({
      next: (link) => {
        const url = `${window.location.origin}/upload/${link.token}`;
        navigator.clipboard.writeText(url).then(() => {
          this.copiedClientId.set(clientId);
          setTimeout(() => this.copiedClientId.set(null), 2000);
        });
      },
      error: (err) => {
        alert('Nu am putut genera linkul de upload.');
        console.error(err);
      },
    });
  }

  loadRequestHistory(): void {
    this.documentService.getRequestHistory().subscribe({
      next: (data) => this.requestHistory.set(data),
      error: (err) => console.error(err),
    });
  }

  toggleHistory(): void {
    this.showHistory.set(!this.showHistory());
    if (this.showHistory() && this.requestHistory().length === 0) {
      this.loadRequestHistory();
    }
  }

  requestMonthlyDocuments(): void {
    const monthLabel = this.monthNames[this.selectedMonth - 1];
    if (
      !confirm(
        `Trimiți solicitare de documente pentru ${monthLabel} ${this.selectedYear} către toți clienții care nu au încărcat încă?`,
      )
    ) {
      return;
    }

    this.requesting.set(true);
    this.requestResults.set(null);

    this.documentService.requestMonthly(this.selectedMonth, this.selectedYear).subscribe({
      next: (results) => {
        this.requestResults.set(results);
        this.requesting.set(false);
        this.loadRequestHistory();
      },
      error: (err) => {
        alert('Nu am putut trimite solicitările.');
        this.requesting.set(false);
        console.error(err);
      },
    });
  }

  getWhatsAppLink(result: RequestMonthlyResult): string {
    const monthLabel = this.monthNames[this.selectedMonth - 1];
    const message = `Bună ziua! Vă rugăm să încărcați documentele contabile pentru ${monthLabel} ${this.selectedYear} folosind acest link: ${result.uploadUrl}`;
    const phone = (result.phoneNumber ?? '').replace(/[^0-9+]/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  sendWhatsAppDirect(client: Client): void {
    if (!client.phoneNumber) {
      alert('Acest client nu are număr de telefon completat.');
      return;
    }

    this.documentService.getUploadLink(client.id).subscribe({
      next: (link) => {
        const uploadUrl = `${window.location.origin}/upload/${link.token}`;
        const monthLabel = this.monthNames[new Date().getMonth()];
        const year = new Date().getFullYear();
        const message = `Bună ziua! Vă rugăm să încărcați documentele contabile pentru ${monthLabel} ${year} folosind acest link: ${uploadUrl}`;
        const phone = client.phoneNumber!.replace(/[^0-9+]/g, '');
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      },
      error: (err) => {
        alert('Nu am putut genera linkul de upload.');
        console.error(err);
      },
    });
  }

  sendEmailDirect(client: Client): void {
    this.documentService.sendEmailRequest(client.id).subscribe({
      next: (result) => {
        if (result.emailSent) {
          alert(`Email trimis către ${client.companyName}.`);
        } else {
          alert(`Trimiterea email-ului a eșuat pentru ${client.companyName}.`);
        }
      },
      error: (err) => {
        alert('Nu am putut trimite email-ul.');
        console.error(err);
      },
    });
  }
}
