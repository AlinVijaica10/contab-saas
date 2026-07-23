import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OutstandingClient {
  clientId: number;
  companyName: string;
  unpaidInvoiceCount: number;
  totalDue: number;
  overdueCount: number;
}

export interface BankPayment {
  id: number;
  bankName: string;
  amount: number;
  currency: string;
  payerName: string | null;
  referenceText: string | null;
  transactionDate: string | null;
  receivedAt: string;
  status: 'UNMATCHED' | 'MATCHED' | 'IGNORED';
  clientId: number | null;
  invoiceId: number | null;
  client?: { companyName: string };
}

@Injectable({ providedIn: 'root' })
export class BankPaymentsService {
  private apiUrl = `${environment.apiUrl}/bank-notifications`;

  constructor(private http: HttpClient) {}

  getOutstanding(): Observable<OutstandingClient[]> {
    return this.http.get<OutstandingClient[]>(`${this.apiUrl}/outstanding`);
  }

  getClientOutstanding(clientId: number): Observable<{ invoices: any[]; payments: BankPayment[] }> {
    return this.http.get<any>(`${this.apiUrl}/outstanding/${clientId}`);
  }

  getUnmatched(): Observable<BankPayment[]> {
    return this.http.get<BankPayment[]>(`${this.apiUrl}?status=UNMATCHED`);
  }

  matchManually(id: number, clientId: number, invoiceId?: number): Observable<BankPayment> {
    return this.http.patch<BankPayment>(`${this.apiUrl}/${id}/match`, { clientId, invoiceId });
  }

  ignore(id: number): Observable<BankPayment> {
    return this.http.patch<BankPayment>(`${this.apiUrl}/${id}/ignore`, {});
  }
}
