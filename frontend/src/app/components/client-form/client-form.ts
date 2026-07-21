import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../services/client';

@Component({
  selector: 'app-client-form',
  imports: [ReactiveFormsModule],
  templateUrl: './client-form.html',
  styleUrl: './client-form.css',
})
export class ClientForm implements OnInit {
  form: FormGroup;
  submitting = false;
  error = '';
  isEditMode = false;
  clientId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      companyName: ['', Validators.required],
      cui: [''],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPerson: [''],
      phoneNumber: [''],
      status: ['active'],
      clientType: ['SRL', Validators.required],
      fiscalRegime: ['MICRO', Validators.required],
      isVatPayer: [false],
      vatPeriodicity: ['MONTHLY'],
      hasEmployees: [false],
      monthlyFee: [null],
      monthlyFeeVatRate: [0],
      monthlyFeeDescription: ['Servicii de contabilitate'],
      addressStreet: [''],
      addressCity: [''],
      addressCounty: [''],
      addressPostalCode: [''],
      addressCountry: ['RO'],
      iban: [''],
    });

    this.form.get('clientType')?.valueChanges.subscribe((type) => {
      const defaultRegime = type === 'SRL' ? 'MICRO' : 'REAL';
      this.form.get('fiscalRegime')?.setValue(defaultRegime);
    });
  }

  get isSrl(): boolean {
    return this.form.get('clientType')?.value === 'SRL';
  }

  get isVatPayer(): boolean {
    return this.form.get('isVatPayer')?.value === true;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.clientId = +idParam;
      this.clientService.getOne(this.clientId).subscribe({
        next: (client) => {
          this.form.patchValue(client);
        },
        error: (err) => {
          this.error = 'Nu am putut încărca datele clientului.';
          console.error(err);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.submitting = true;
    this.error = '';

    const request =
      this.isEditMode && this.clientId
        ? this.clientService.update(this.clientId, this.form.value)
        : this.clientService.create(this.form.value);

    request.subscribe({
      next: () => {
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        this.error = 'Nu am putut salva clientul.';
        this.submitting = false;
        console.error(err);
      },
    });
  }
}
