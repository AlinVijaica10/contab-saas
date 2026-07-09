import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { InvoiceService, Invoice, GenerateMonthlyResult } from '../../services/invoice';

@Component({
  selector: 'app-invoice-list',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.css',
})
export class InvoiceList implements OnInit {
  invoices = signal<Invoice[]>([]);
  loading = signal(true);
  error = signal('');

  generating = signal(false);
  generationResults = signal<GenerateMonthlyResult[] | null>(null);

  selectedMonth: number;
  selectedYear: number;

  filterMonth: number | null = null;
  filterYear: number | null = null;

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

  constructor(private invoiceService: InvoiceService) {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    this.selectedMonth = prevMonth;
    this.selectedYear = prevYear;

    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
      this.years.push(y);
    }
  }

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    const month = this.filterMonth ?? undefined;
    const year = this.filterYear ?? undefined;
    this.invoiceService.getAll(month, year).subscribe({
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

  onFilterChange(): void {
    this.loadInvoices();
  }

  clearFilter(): void {
    this.filterMonth = null;
    this.filterYear = null;
    this.loadInvoices();
  }

  formatInvoiceNumber(invoice: Invoice): string {
    if (!invoice.series) return `#${invoice.number}`;
    return `${invoice.series.prefix}-${invoice.series.year}-${String(invoice.number).padStart(4, '0')}`;
  }

  generateMonthlyInvoices(): void {
    const monthLabel = this.monthNames[this.selectedMonth - 1];
    if (
      !confirm(
        `Generezi facturile pentru ${monthLabel} ${this.selectedYear} pentru toți clienții cu tarif lunar setat?`,
      )
    ) {
      return;
    }

    this.generating.set(true);
    this.generationResults.set(null);

    this.invoiceService.generateMonthly(this.selectedMonth, this.selectedYear).subscribe({
      next: (results) => {
        this.generationResults.set(results);
        this.generating.set(false);
        this.loadInvoices();
      },
      error: (err) => {
        alert('Nu am putut genera facturile.');
        this.generating.set(false);
        console.error(err);
      },
    });
  }

  deleteInvoice(invoice: Invoice): void {
    if (invoice.status !== 'DRAFT') {
      alert('Doar facturile în stadiul DRAFT pot fi șterse.');
      return;
    }
    if (!confirm(`Sigur vrei să ștergi factura ${this.formatInvoiceNumber(invoice)}?`)) {
      return;
    }
    this.invoiceService.delete(invoice.id).subscribe({
      next: () => this.loadInvoices(),
      error: (err) => {
        alert('Nu am putut șterge factura.');
        console.error(err);
      },
    });
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
