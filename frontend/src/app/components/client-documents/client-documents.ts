import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentService, Document } from '../../services/document';
import { ClientService } from '../../services/client';
import { DatePipe, DecimalPipe, KeyValuePipe } from '@angular/common';

type Tab = 'CLIENT_UPLOAD' | 'INTERNAL';

@Component({
  selector: 'app-client-documents',
  imports: [RouterLink, DatePipe, FormsModule, KeyValuePipe],
  templateUrl: './client-documents.html',
  styleUrl: './client-documents.css',
})
export class ClientDocuments implements OnInit {
  clientId = 0;
  clientName = signal('');
  documents = signal<Document[]>([]);
  loading = signal(true);
  error = signal('');
  activeTab = signal<Tab>('CLIENT_UPLOAD');

  // upload intern
  selectedFile: File | null = null;
  internalCategory = 'CI_ADMINISTRATOR';
  uploading = signal(false);

  clientCategoryLabels: Record<string, string> = {
    INVOICE: 'Factură',
    BANK_STATEMENT: 'Extras de cont',
    CONTRACT: 'Contract',
    OTHER: 'Alt document',
  };

  internalCategoryLabels: Record<string, string> = {
    CI_ADMINISTRATOR: 'CI Administrator',
    ACTE_INFIINTARE: 'Acte înființare firmă',
    DECLARATII: 'Declarații',
    ADEVERINTE: 'Adeverințe',
    PONTAJE: 'Pontaje lunare',
    STATE_SALARII: 'State de salarii',
    BILANT: 'Bilanț',
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

  switchTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.documentService.listByClient(this.clientId, this.activeTab()).subscribe({
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

  categoryLabel(doc: Document): string {
    const labels =
      doc.source === 'INTERNAL' ? this.internalCategoryLabels : this.clientCategoryLabels;
    return labels[doc.category] || doc.category;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  onInternalUpload(): void {
    if (!this.selectedFile) {
      return;
    }

    this.uploading.set(true);
    this.documentService
      .uploadInternal(this.clientId, this.selectedFile, this.internalCategory)
      .subscribe({
        next: () => {
          this.uploading.set(false);
          this.selectedFile = null;
          this.loadDocuments();
        },
        error: (err) => {
          this.uploading.set(false);
          alert('Nu am putut încărca documentul.');
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
