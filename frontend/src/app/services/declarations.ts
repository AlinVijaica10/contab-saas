import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DeclarationStatus {
  type: string;
  label: string;
  submitted: boolean;
  submittedAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DeclarationsService {
  private apiUrl = 'http://localhost:3000/declarations';

  constructor(private http: HttpClient) {}

  getClientStatus(clientId: number, month: number, year: number): Observable<DeclarationStatus[]> {
    return this.http.get<DeclarationStatus[]>(`${this.apiUrl}/client/${clientId}`, {
      params: { month: month.toString(), year: year.toString() },
    });
  }

  markSubmitted(
    clientId: number,
    declarationType: string,
    month: number,
    year: number,
    submitted: boolean,
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/client/${clientId}/mark`, {
      declarationType,
      month,
      year,
      submitted,
    });
  }
}
