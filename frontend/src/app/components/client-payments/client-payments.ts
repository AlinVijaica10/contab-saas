import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { BankPaymentsService } from '../../services/bank-payments';
import { ClientService } from '../../services/client';

@Component({
  selector: 'app-client-payments',
  imports: [RouterLink, DecimalPipe, DatePipe],
  templateUrl: './client-payments.html',
  styleUrl: './client-payments.css',
})
export class ClientPayments implements OnInit {
  clientId = 0;
  clientName = signal('');
  invoices = signal<any[]>([]);
  payments = signal<any[]>([]);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private bankPaymentsService: BankPaymentsService,
    private clientService: ClientService,
  ) {}

  ngOnInit(): void {
    this.clientId = +(this.route.snapshot.paramMap.get('id') || 0);

    this.clientService.getOne(this.clientId).subscribe({
      next: (client) => this.clientName.set(client.companyName),
    });

    this.bankPaymentsService.getClientOutstanding(this.clientId).subscribe({
      next: (data) => {
        this.invoices.set(data.invoices);
        this.payments.set(data.payments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
