import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { BankPaymentsService, OutstandingClient, BankPayment } from '../../services/bank-payments';
import { ClientService, Client } from '../../services/client';

@Component({
  selector: 'app-payments',
  imports: [RouterLink, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class Payments implements OnInit {
  outstanding = signal<OutstandingClient[]>([]);
  unmatched = signal<BankPayment[]>([]);
  clients = signal<Client[]>([]);
  loading = signal(true);

  matchingId: number | null = null;
  selectedClientId: number | null = null;

  constructor(
    private bankPaymentsService: BankPaymentsService,
    private clientService: ClientService,
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.clientService.getAll().subscribe({ next: (c) => this.clients.set(c) });

    this.bankPaymentsService.getOutstanding().subscribe({
      next: (data) => this.outstanding.set(data),
    });

    this.bankPaymentsService.getUnmatched().subscribe({
      next: (data) => {
        this.unmatched.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startMatching(payment: BankPayment): void {
    this.matchingId = payment.id;
    this.selectedClientId = null;
  }

  confirmMatch(payment: BankPayment): void {
    if (!this.selectedClientId) return;
    this.bankPaymentsService.matchManually(payment.id, this.selectedClientId).subscribe({
      next: () => {
        this.matchingId = null;
        this.ngOnInit();
      },
      error: () => alert('Nu am putut asocia plata.'),
    });
  }

  ignorePayment(payment: BankPayment): void {
    if (!confirm('Sigur ignori această plată?')) return;
    this.bankPaymentsService.ignore(payment.id).subscribe({
      next: () => this.ngOnInit(),
      error: () => alert('Nu am putut ignora plata.'),
    });
  }
}
