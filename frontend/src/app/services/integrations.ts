import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IntegrationsStatus {
  anaf: { connected: boolean; expiresAt?: string };
  email: { configured: boolean; senderEmail: string | null; senderName: string | null };
}

@Injectable({
  providedIn: 'root',
})
export class IntegrationsService {
  private apiUrl = 'http://localhost:3000/integrations';

  constructor(private http: HttpClient) {}

  getStatus(): Observable<IntegrationsStatus> {
    return this.http.get<IntegrationsStatus>(`${this.apiUrl}/status`);
  }

  sendTestEmail(to: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/email/test`, { to });
  }
}
