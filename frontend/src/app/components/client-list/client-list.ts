import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClientService, Client } from '../../services/client';

@Component({
  selector: 'app-client-list',
  imports: [RouterLink],
  templateUrl: './client-list.html',
  styleUrl: './client-list.css',
})
export class ClientList implements OnInit {
  clients = signal<Client[]>([]);
  loading = signal(true);
  error = signal('');

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading.set(true);
    this.clientService.getAll().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Nu am putut încărca lista de clienți.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  deleteClient(id: number): void {
    if (!confirm('Sigur vrei să ștergi acest client?')) {
      return;
    }
    this.clientService.delete(id).subscribe({
      next: () => {
        this.clients.update((list) => list.filter((c) => c.id !== id));
      },
      error: (err) => {
        alert('Nu am putut șterge clientul.');
        console.error(err);
      },
    });
  }
}
