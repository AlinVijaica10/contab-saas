import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Document {
  id: number;
  category: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface UploadLink {
  id: number;
  token: string;
  clientId: number;
}

export interface PublicClientInfo {
  clientName: string;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private apiUrl = 'http://localhost:3000/documents';

  constructor(private http: HttpClient) {}

  // --- Autentificat ---

  getUploadLink(clientId: number): Observable<UploadLink> {
    return this.http.get<UploadLink>(`${this.apiUrl}/client/${clientId}/upload-link`);
  }

  regenerateUploadLink(clientId: number): Observable<UploadLink> {
    return this.http.post<UploadLink>(`${this.apiUrl}/client/${clientId}/upload-link/regenerate`, {});
  }

  listByClient(clientId: number): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/client/${clientId}`);
  }

  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }

  // --- Public (fără autentificare) ---

  getPublicInfo(token: string): Observable<PublicClientInfo> {
    return this.http.get<PublicClientInfo>(`${this.apiUrl}/public/${token}`);
  }

  uploadPublic(token: string, file: File, category: string): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return this.http.post<Document>(`${this.apiUrl}/public/${token}/upload`, formData);
  }
}
