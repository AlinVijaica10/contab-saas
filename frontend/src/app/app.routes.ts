import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { ClientList } from './components/client-list/client-list';
import { ClientForm } from './components/client-form/client-form';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/clients', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'clients', component: ClientList, canActivate: [authGuard] },
  { path: 'clients/add', component: ClientForm, canActivate: [authGuard] },
  { path: 'clients/edit/:id', component: ClientForm, canActivate: [authGuard] },
];
