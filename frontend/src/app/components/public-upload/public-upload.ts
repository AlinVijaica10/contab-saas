import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document';

@Component({
  selector: 'app-public-upload',
  imports: [FormsModule],
  templateUrl: './public-upload.html',
  styleUrl: './public-upload.css',
})
export class PublicUpload implements OnInit {
  token = '';
  clientName = signal('');
  loading = signal(true);
  error = signal('');
  selectedFile: File | null = null;
  category = 'OTHER';
  uploading = signal(false);
  success = signal(false);

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.documentService.getPublicInfo(this.token).subscribe({
      next: (info) => {
        this.clientName.set(info.clientName);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Acest link nu este valid sau a expirat.');
        this.loading.set(false);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  onUpload(): void {
    if (!this.selectedFile) {
      return;
    }

    this.uploading.set(true);
    this.documentService.uploadPublic(this.token, this.selectedFile, this.category).subscribe({
      next: () => {
        this.uploading.set(false);
        this.success.set(true);
        this.selectedFile = null;
      },
      error: () => {
        this.uploading.set(false);
        this.error.set('Nu am putut încărca fișierul. Încearcă din nou.');
      },
    });
  }

  uploadAnother(): void {
    this.success.set(false);
  }
}
