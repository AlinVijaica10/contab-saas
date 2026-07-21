import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal?: number;
}

export interface Invoice {
  id: number;
  clientId: number;
  seriesId: number;
  number: number;
  issueDate: string;
  dueDate?: string;
  currency: string;
  status: string;
  subtotal: number;
  vatTotal: number;
  total: number;
  notes?: string;
  items: InvoiceItem[];
  client?: {
    id: number;
    companyName: string;
    cui?: string;
    contactEmail: string;
  };
  series?: {
    prefix: string;
    year: number;
  };

  anafStatus?: 'PENDING' | 'PROCESSING' | 'OK' | 'ERROR' | null;
  anafUploadIndex?: string | null;
  anafSentAt?: string | null;

  anafDownloadId?: string | null;
}

export interface CreateInvoicePayload {
  clientId: number;
  seriesPrefix?: string;
  dueDate?: string;
  currency?: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate?: number;
  }[];
}

export interface GenerateMonthlyResult {
  clientId: number;
  companyName: string;
  success: boolean;
  invoiceId?: number;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private apiUrl = 'http://localhost:3000/invoices';

  constructor(private http: HttpClient) {}

  getAll(month?: number, year?: number): Observable<Invoice[]> {
    let params: any = {};
    if (month && year) {
      params = { month: month.toString(), year: year.toString() };
    }
    return this.http.get<Invoice[]>(this.apiUrl, { params });
  }

  update(id: number, invoice: CreateInvoicePayload): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.apiUrl}/${id}`, invoice);
  }

  delete(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }

  getOne(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
  }

  create(invoice: CreateInvoicePayload): Observable<Invoice> {
    return this.http.post<Invoice>(this.apiUrl, invoice);
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  generateMonthly(month: number, year: number): Observable<GenerateMonthlyResult[]> {
    return this.http.post<GenerateMonthlyResult[]>(`${this.apiUrl}/generate-monthly`, {
      month,
      year,
    });
  }
}
