import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClientSummary {
  clientId: number;
  companyName: string;
  invoiceCount: number;
  totalInvoiced: number;
  totalPaid: number;
  totalUnpaid: number;
  documentCount: number;
  hasDocuments: boolean;
  pendingDeclarationsCount: number;
  hasPendingDeclarations: boolean;
}

export interface MonthlySummary {
  month: number;
  year: number;
  clients: ClientSummary[];
  totals: {
    totalInvoiced: number;
    totalPaid: number;
    totalUnpaid: number;
    totalDocuments: number;
    clientsWithoutDocuments: number;
    clientsWithPendingDeclarations: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = 'http://localhost:3000/dashboard';

  constructor(private http: HttpClient) {}

  getSummary(month: number, year: number): Observable<MonthlySummary> {
    return this.http.get<MonthlySummary>(`${this.apiUrl}/summary`, {
      params: { month: month.toString(), year: year.toString() },
    });
  }
}
