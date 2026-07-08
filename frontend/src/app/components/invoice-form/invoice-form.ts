import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice';
import { ClientService, Client } from '../../services/client';
import { DecimalPipe } from '@angular/common';

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
  error = '';

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private clientService: ClientService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      clientId: [null, Validators.required],
      dueDate: [''],
      currency: ['RON'],
      notes: [''],
      items: this.fb.array([this.createItemGroup()]),
    });
  }

  ngOnInit(): void {
    this.clientService.getAll().subscribe({
      next: (data) => (this.clients = data),
      error: (err) => console.error(err),
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      vatRate: [19, [Validators.required, Validators.min(0)]],
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
    this.error = '';

    this.invoiceService.create(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/invoices']);
      },
      error: (err) => {
        this.error = 'Nu am putut salva factura.';
        this.submitting = false;
        console.error(err);
      },
    });
  }
}
