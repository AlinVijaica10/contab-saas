import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DocumentService, Document } from '../../services/document';
import { ClientService } from '../../services/client';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-client-documents',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './client-documents.html',
  styleUrl: './client-documents.css',
})
export class ClientDocuments implements OnInit {
  clientId = 0;
  clientName = signal('');
  documents = signal<Document[]>([]);
  loading = signal(true);
  error = signal('');

  categoryLabels: Record<string, string> = {
    INVOICE: 'Factură',
    BANK_STATEMENT: 'Extras de cont',
    CONTRACT: 'Contract',
    OTHER: 'Alt document',
  };

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService,
    private clientService: ClientService,
  ) {}

  ngOnInit(): void {
    this.clientId = +(this.route.snapshot.paramMap.get('id') || 0);

    this.clientService.getOne(this.clientId).subscribe({
      next: (client) => this.clientName.set(client.companyName),
      error: (err) => console.error(err),
    });

    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.documentService.listByClient(this.clientId).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Nu am putut încărca documentele.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  download(doc: Document): void {
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = doc.originalName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert('Nu am putut descărca documentul.');
        console.error(err);
      },
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

