import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Invoice, InvoiceService } from '../../services/invoice';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-invoice-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.css',
})
export class InvoiceList implements OnInit {
  invoices = signal<Invoice[]>([]);
  loading = signal(true);
  error = signal('');

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.invoiceService.getAll().subscribe({
      next: (data) => {
        this.invoices.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Nu am putut încărca lista de facturi.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  formatInvoiceNumber(invoice: Invoice): string {
    if (!invoice.series) return `#${invoice.number}`;
    return `${invoice.series.prefix}-${invoice.series.year}-${String(invoice.number).padStart(4, '0')}`;
  }

  downloadPdf(id: number): void {
    this.invoiceService.downloadPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `factura-${id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert('Nu am putut descărca factura.');
        console.error(err);
      },
    });
  }
}
