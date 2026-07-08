import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  isPublicRoute = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {
    this.checkRoute(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkRoute(event.urlAfterRedirects);
      });
  }

  private checkRoute(url: string): void {
    this.isPublicRoute.set(url.startsWith('/upload/'));
  }

  logout(): void {
    this.authService.logout();
  }
}
