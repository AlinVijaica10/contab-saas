import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeclarationsService, DeclarationStatus } from '../../services/declarations';
import { ClientService } from '../../services/client';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-client-declarations',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './client-declarations.html',
  styleUrl: './client-declarations.css',
})
export class ClientDeclarations implements OnInit {
  clientId = 0;
  clientName = signal('');
  declarations = signal<DeclarationStatus[]>([]);
  loading = signal(true);
  error = signal('');

  selectedMonth: number;
  selectedYear: number;

  monthNames = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
  ];

  years: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private declarationsService: DeclarationsService,
    private clientService: ClientService,
  ) {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();

    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
      this.years.push(y);
    }
  }

  ngOnInit(): void {
    this.clientId = +(this.route.snapshot.paramMap.get('id') || 0);

    this.clientService.getOne(this.clientId).subscribe({
      next: (client) => this.clientName.set(client.companyName),
      error: (err) => console.error(err),
    });

    this.loadDeclarations();
  }

  loadDeclarations(): void {
    this.loading.set(true);
    this.declarationsService.getClientStatus(this.clientId, this.selectedMonth, this.selectedYear).subscribe({
      next: (data) => {
        this.declarations.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Nu am putut încărca declarațiile.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  onPeriodChange(): void {
    this.loadDeclarations();
  }

  toggleSubmitted(decl: DeclarationStatus): void {
    const newValue = !decl.submitted;
    this.declarationsService
      .markSubmitted(this.clientId, decl.type, this.selectedMonth, this.selectedYear, newValue)
      .subscribe({
        next: () => this.loadDeclarations(),
        error: (err) => {
          alert('Nu am putut actualiza starea declarației.');
          console.error(err);
        },
      });
  }
}
