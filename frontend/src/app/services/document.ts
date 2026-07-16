import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Document {
  id: number;
  category: string;
  source: 'CLIENT_UPLOAD' | 'INTERNAL';
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface DocumentRequestLogEntry {
  id: number;
  clientId: number;
  month: number;
  year: number;
  requestedAt: string;
  emailSent: boolean;
  status: string;
  client: {
    companyName: string;
  };
}

export interface RequestMonthlyResult {
  clientId: number;
  companyName: string;
  phoneNumber: string | null;
  status: string;
  emailSent: boolean;
  uploadUrl?: string;
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

  requestMonthly(month: number, year: number): Observable<RequestMonthlyResult[]> {
    return this.http.post<RequestMonthlyResult[]>(`${this.apiUrl}/request-monthly`, {
      month,
      year,
    });
  }

  regenerateUploadLink(clientId: number): Observable<UploadLink> {
    return this.http.post<UploadLink>(
      `${this.apiUrl}/client/${clientId}/upload-link/regenerate`,
      {},
    );
  }

  listByClient(clientId: number, source?: 'CLIENT_UPLOAD' | 'INTERNAL'): Observable<Document[]> {
    let params = new HttpParams();
    if (source) {
      params = params.set('source', source);
    }
    return this.http.get<Document[]>(`${this.apiUrl}/client/${clientId}`, { params });
  }

  uploadInternal(clientId: number, file: File, category: string): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return this.http.post<Document>(`${this.apiUrl}/client/${clientId}/internal-upload`, formData);
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

  getRequestHistory(month?: number, year?: number): Observable<DocumentRequestLogEntry[]> {
    let params: any = {};
    if (month && year) {
      params = { month: month.toString(), year: year.toString() };
    }
    return this.http.get<DocumentRequestLogEntry[]>(`${this.apiUrl}/request-history`, { params });
  }

  sendEmailRequest(clientId: number): Observable<{ emailSent: boolean; uploadUrl: string }> {
    return this.http.post<{ emailSent: boolean; uploadUrl: string }>(
      `${this.apiUrl}/client/${clientId}/send-email-request`,
      {},
    );
  }
}
