import { Component, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { InvoiceService } from '../../services/invoice';
import { ClientService, Client } from '../../services/client';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-invoice-form',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './invoice-form.html',
  styleUrl: './invoice-form.css',
})
export class InvoiceForm implements OnInit {
  form: FormGroup;
  clients: Client[] = [];
  submitting = false;
  error = signal('');
  isEditMode = false;
  invoiceId: number | null = null;
  isReady = signal(false);
  defaultVatRate = 19;

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private clientService: ClientService,
    private router: Router,
    private http: HttpClient,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      clientId: [null, Validators.required],
      dueDate: [''],
      currency: ['RON'],
      notes: [''],
      items: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.clientService.getAll().subscribe({
      next: (data) => (this.clients = data),
      error: (err) => console.error(err),
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.invoiceId = +idParam;
      this.invoiceService.getOne(this.invoiceId).subscribe({
        next: (invoice) => {
          if (invoice.status !== 'DRAFT') {
            this.error.set('Doar facturile în stadiul DRAFT pot fi editate.');
            return;
          }

          invoice.items.forEach((item) => {
            this.items.push(
              this.fb.group({
                description: [item.description, Validators.required],
                quantity: [item.quantity, [Validators.required, Validators.min(0.01)]],
                unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
                vatRate: [item.vatRate, [Validators.required, Validators.min(0)]],
              }),
            );
          });

          this.form.patchValue({
            clientId: invoice.clientId,
            dueDate: invoice.dueDate ? invoice.dueDate.substring(0, 10) : '',
            currency: invoice.currency,
            notes: invoice.notes,
          });

          this.isReady.set(true);
        },
        error: (err) => {
          this.error.set('Nu am putut încărca factura.');
          console.error(err);
        },
      });
    } else {
      this.http.get<any>(`${environment.apiUrl}/tenant/me`).subscribe({
        next: (tenant) => {
          this.defaultVatRate = tenant.invoiceDefaultVatRate ?? 19;

          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (tenant.invoiceDueDays ?? 30));

          this.form.patchValue({
            dueDate: dueDate.toISOString().substring(0, 10),
            notes: tenant.invoiceDefaultNote ?? '',
          });

          this.items.push(this.createItemGroup());
          this.isReady.set(true);
        },
        error: () => {
          this.items.push(this.createItemGroup());
          this.isReady.set(true);
        },
      });
    }
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      vatRate: [this.defaultVatRate, [Validators.required, Validators.min(0)]],
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  calculateLineTotal(index: number): number {
    const item = this.items.at(index).value;
    return (item.quantity || 0) * (item.unitPrice || 0);
  }

  calculateSubtotal(): number {
    return this.items.controls.reduce((sum, _, i) => sum + this.calculateLineTotal(i), 0);
  }

  calculateVatTotal(): number {
    return this.items.controls.reduce((sum, control, i) => {
      const vatRate = control.value.vatRate || 0;
      return sum + this.calculateLineTotal(i) * (vatRate / 100);
    }, 0);
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + this.calculateVatTotal();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.submitting = true;
    this.error.set('');

    const request =
      this.isEditMode && this.invoiceId
        ? this.invoiceService.update(this.invoiceId, this.form.value)
        : this.invoiceService.create(this.form.value);

    request.subscribe({
      next: () => {
        this.router.navigate(['/invoices']);
      },
      error: (err) => {
        this.error.set('Nu am putut salva factura.');
        this.submitting = false;
        console.error(err);
      },
    });
  }
}
