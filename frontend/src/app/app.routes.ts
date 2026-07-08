import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { ClientList } from './components/client-list/client-list';
import { ClientForm } from './components/client-form/client-form';
import { InvoiceList } from './components/invoice-list/invoice-list';
import { authGuard } from './guards/auth-guard';
import { InvoiceForm } from './components/invoice-form/invoice-form';
import { PublicUpload } from './components/public-upload/public-upload';
import { ClientDocuments } from './components/client-documents/client-documents';


export const routes: Routes = [
  { path: '', redirectTo: '/clients', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'clients', component: ClientList, canActivate: [authGuard] },
  { path: 'clients/add', component: ClientForm, canActivate: [authGuard] },
  { path: 'clients/edit/:id', component: ClientForm, canActivate: [authGuard] },
  { path: 'invoices', component: InvoiceList, canActivate: [authGuard] },
  { path: 'invoices/add', component: InvoiceForm, canActivate: [authGuard] },
  { path: 'upload/:token', component: PublicUpload },
  { path: 'clients/:id/documents', component: ClientDocuments, canActivate: [authGuard] },
];
