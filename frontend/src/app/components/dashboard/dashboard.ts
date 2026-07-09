import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { DashboardService, MonthlySummary } from '../../services/dashboard';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  summary = signal<MonthlySummary | null>(null);
  loading = signal(true);
  error = signal('');

  selectedMonth: number;
  selectedYear: number;

  monthNames = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
  ];

  years: number[] = [];

  constructor(private dashboardService: DashboardService) {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();

    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
      this.years.push(y);
    }
  }

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading.set(true);
    this.error.set('');
    this.dashboardService.getSummary(this.selectedMonth, this.selectedYear).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Nu am putut încărca dashboard-ul.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  onPeriodChange(): void {
    this.loadSummary();
  }
}
