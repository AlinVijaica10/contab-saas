import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
  id: number;
  companyName: string;
  cui?: string;
  contactEmail: string;
  phoneNumber?: string;
  contactPerson?: string;
  status: string;
  createdAt: string;
  clientType: 'SRL' | 'PFA';
  fiscalRegime: 'MICRO' | 'PROFIT' | 'REAL' | 'NORMA_VENIT';
  isVatPayer: boolean;
  vatPeriodicity?: 'MONTHLY' | 'QUARTERLY' | null;
  hasEmployees: boolean;
  monthlyFee?: number;
  monthlyFeeVatRate?: number;
  monthlyFeeDescription?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private apiUrl = 'http://localhost:3000/clients';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }

  getOne(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  create(client: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client);
  }

  update(id: number, client: Partial<Client>): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/${id}`, client);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
