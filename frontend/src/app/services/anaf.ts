import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnafStatus {
  connected: boolean;
  expiresAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnafService {
  private anafUrl = 'http://localhost:3000/anaf';
  private invoicesUrl = 'http://localhost:3000/invoices';

  constructor(private http: HttpClient) {}

  getStatus(): Observable<AnafStatus> {
    return this.http.get<AnafStatus>(`${this.anafUrl}/status`);
  }

  /**
   * Ia URL-ul de autorizare (request autentificat, cu header Authorization
   * atașat de interceptor), apoi navighează browser-ul manual - un redirect
   * server-side direct nu ar putea trimite header-ul de autentificare.
   */
  connect(): void {
    this.http.get<{ url: string }>(`${this.anafUrl}/authorize`).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err) => {
        alert('Eroare la conectarea cu ANAF: ' + (err?.error?.message ?? err.message));
      },
    });
  }

  validateInvoice(invoiceId: number): Observable<any> {
    return this.http.post(`${this.invoicesUrl}/${invoiceId}/efactura/validate`, {});
  }

  sendInvoice(invoiceId: number): Observable<any> {
    return this.http.post(`${this.invoicesUrl}/${invoiceId}/efactura/send`, {});
  }

  checkInvoiceStatus(invoiceId: number): Observable<any> {
    return this.http.get(`${this.invoicesUrl}/${invoiceId}/efactura/status`);
  }

  /** Descarcă arhiva ANAF (factură validată + semnătură, sau erori) direct în browser. */
  downloadResponse(invoiceId: number): void {
    fetch(`${this.invoicesUrl}/${invoiceId}/efactura/download-response`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Nu există încă un răspuns ANAF de descărcat.');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `anaf-raspuns-factura-${invoiceId}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => alert(err.message));
  }
}
